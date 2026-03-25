package com.hrms.employee;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmployeeServiceImpl
 *
 * Validates parity with PKG_EMPLOYEE legacy behavior while verifying
 * that known bugs (SQL injection, race condition, circular dependency) are fixed.
 */
@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private Employee sampleEmployee;

    @BeforeEach
    void setUp() {
        sampleEmployee = new Employee();
        sampleEmployee.setEmpId(1001L);
        sampleEmployee.setEmpNumber("EMP-001001");
        sampleEmployee.setFirstName("JOHN");
        sampleEmployee.setLastName("DOE");
        sampleEmployee.setEmail("john.doe@company.com");
        sampleEmployee.setHireDate(LocalDate.of(2020, 1, 15));
        sampleEmployee.setDeptId(10L);
        sampleEmployee.setJobId(5L);
        sampleEmployee.setEmploymentStatus("ACTIVE");
        sampleEmployee.setActiveFlag("Y");
        sampleEmployee.setEmploymentType("FULL_TIME");
    }

    @Nested
    @DisplayName("create_employee — Replaces PKG_EMPLOYEE.create_employee")
    class CreateEmployee {

        @Test
        @DisplayName("should create employee with uppercase name (matches legacy UPPER(TRIM()) behavior)")
        void shouldCreateEmployeeWithUppercaseName() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "  jane  ", "  smith  ", "jane@co.com", null, null,
                    LocalDate.now(), 10L, 5L, null, null, "FULL_TIME",
                    "F", null, null, BigDecimal.valueOf(75000));

            when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
                Employee e = invocation.getArgument(0);
                if (e.getEmpId() == null) e.setEmpId(100L);
                return e;
            });

            Employee result = employeeService.create(request);

            assertThat(result.getFirstName()).isEqualTo("JANE");
            assertThat(result.getLastName()).isEqualTo("SMITH");
            assertThat(result.getEmail()).isEqualTo("jane@co.com");
        }

        @Test
        @DisplayName("should set ACTIVE status and Y flag (matches legacy PRE-INSERT trigger)")
        void shouldSetActiveDefaults() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "Test", "User", null, null, null,
                    LocalDate.now(), 10L, 5L, null, null, null,
                    null, null, null, BigDecimal.valueOf(50000));

            when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
                Employee e = invocation.getArgument(0);
                if (e.getEmpId() == null) e.setEmpId(200L);
                return e;
            });

            Employee result = employeeService.create(request);

            assertThat(result.getEmploymentStatus()).isEqualTo("ACTIVE");
            assertThat(result.getActiveFlag()).isEqualTo("Y");
            assertThat(result.getEmploymentType()).isEqualTo("FULL_TIME");
        }

        @Test
        @DisplayName("should generate sequence-based emp number (FIXES race condition in legacy)")
        void shouldGenerateSequenceBasedEmpNumber() {
            // Legacy bug: PKG_EMPLOYEE.generate_emp_number used SELECT MAX()+1
            // without SELECT FOR UPDATE, causing duplicates under concurrency.
            // Fix: use sequence-assigned ID to derive emp number.
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "Race", "Test", null, null, null,
                    LocalDate.now(), 10L, 5L, null, null, null,
                    null, null, null, BigDecimal.valueOf(60000));

            when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
                Employee e = invocation.getArgument(0);
                if (e.getEmpId() == null) e.setEmpId(42L);
                return e;
            });

            Employee result = employeeService.create(request);

            assertThat(result.getEmpNumber()).isEqualTo("EMP-000042");
        }
    }

    @Nested
    @DisplayName("update_employee — Replaces PKG_EMPLOYEE.update_employee")
    class UpdateEmployee {

        @Test
        @DisplayName("should apply partial update (only non-null fields)")
        void shouldApplyPartialUpdate() {
            when(employeeRepository.findById(1001L)).thenReturn(Optional.of(sampleEmployee));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> i.getArgument(0));

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    null, null, "new@email.com", null, null,
                    null, null, null, null, null, null, null);

            Employee result = employeeService.update(1001L, request);

            assertThat(result.getEmail()).isEqualTo("new@email.com");
            assertThat(result.getFirstName()).isEqualTo("JOHN"); // unchanged
        }

        @Test
        @DisplayName("should throw EntityNotFoundException for missing employee")
        void shouldThrowForMissingEmployee() {
            when(employeeRepository.findById(9999L)).thenReturn(Optional.empty());

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    "Test", "User", null, null, null,
                    null, null, null, null, null, null, null);

            assertThatThrownBy(() -> employeeService.update(9999L, request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("9999");
        }
    }

    @Nested
    @DisplayName("search_employees — Replaces PKG_EMPLOYEE.search_employees (SQL injection FIXED)")
    class SearchEmployees {

        @Test
        @DisplayName("should use Specifications instead of string concatenation")
        @SuppressWarnings("unchecked")
        void shouldUseSpecifications() {
            when(employeeRepository.findAll(any(Specification.class)))
                    .thenReturn(List.of(sampleEmployee));

            EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(
                    "DOE", 10L, null, null, null, null);

            List<Employee> results = employeeService.search(criteria);

            assertThat(results).hasSize(1);
            verify(employeeRepository).findAll(any(Specification.class));
        }

        @Test
        @DisplayName("should handle search with no criteria (returns active employees)")
        @SuppressWarnings("unchecked")
        void shouldHandleEmptyCriteria() {
            when(employeeRepository.findAll(any(Specification.class)))
                    .thenReturn(List.of(sampleEmployee));

            EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(
                    null, null, null, null, null, null);

            List<Employee> results = employeeService.search(criteria);

            assertThat(results).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("terminate_employee — Replaces PKG_EMPLOYEE.terminate_employee")
    class TerminateEmployee {

        @Test
        @DisplayName("should set status to TERMINATED and active flag to N")
        void shouldTerminateEmployee() {
            when(employeeRepository.findById(1001L)).thenReturn(Optional.of(sampleEmployee));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> i.getArgument(0));

            TerminationRequest request = new TerminationRequest(
                    LocalDate.of(2024, 12, 31), "VOLUNTARY", "Relocation");

            Employee result = employeeService.terminate(1001L, request);

            assertThat(result.getEmploymentStatus()).isEqualTo("TERMINATED");
            assertThat(result.getActiveFlag()).isEqualTo("N");
            assertThat(result.getTerminationDate()).isEqualTo(LocalDate.of(2024, 12, 31));
            assertThat(result.getTerminationReason()).isEqualTo("VOLUNTARY");
        }

        @Test
        @DisplayName("should reject termination of already-terminated employee")
        void shouldRejectDoubleTermination() {
            sampleEmployee.setEmploymentStatus("TERMINATED");
            when(employeeRepository.findById(1001L)).thenReturn(Optional.of(sampleEmployee));

            TerminationRequest request = new TerminationRequest(
                    LocalDate.now(), "VOLUNTARY", null);

            assertThatThrownBy(() -> employeeService.terminate(1001L, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already terminated");
        }
    }

    @Nested
    @DisplayName("transfer_employee — Replaces PKG_EMPLOYEE.transfer_employee")
    class TransferEmployee {

        @Test
        @DisplayName("should transfer active employee to new department")
        void shouldTransferEmployee() {
            when(employeeRepository.findById(1001L)).thenReturn(Optional.of(sampleEmployee));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> i.getArgument(0));

            TransferRequest request = new TransferRequest(
                    20L, null, "NYC", LocalDate.now(), "Reorg");

            Employee result = employeeService.transfer(1001L, request);

            assertThat(result.getDeptId()).isEqualTo(20L);
            assertThat(result.getLocationCode()).isEqualTo("NYC");
        }

        @Test
        @DisplayName("should reject transfer of non-active employee")
        void shouldRejectTransferOfNonActive() {
            sampleEmployee.setEmploymentStatus("TERMINATED");
            when(employeeRepository.findById(1001L)).thenReturn(Optional.of(sampleEmployee));

            TransferRequest request = new TransferRequest(
                    20L, null, null, LocalDate.now(), null);

            assertThatThrownBy(() -> employeeService.transfer(1001L, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("non-active");
        }
    }

    @Nested
    @DisplayName("Circular dependency detection — FIXES PKG_EMPLOYEE.validate_manager")
    class CircularDependency {

        @Test
        @DisplayName("should detect circular reporting chain")
        void shouldDetectCircularChain() {
            // Employee 1001 -> Manager 2001 -> Manager 1001 (circular!)
            Employee manager = new Employee();
            manager.setEmpId(2001L);
            manager.setManagerEmpId(1001L);

            when(employeeRepository.findById(1001L)).thenReturn(Optional.of(sampleEmployee));
            when(employeeRepository.findById(2001L)).thenReturn(Optional.of(manager));

            TransferRequest request = new TransferRequest(
                    10L, 2001L, null, LocalDate.now(), null);

            assertThatThrownBy(() -> employeeService.transfer(1001L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Circular reporting chain");
        }
    }

    @Nested
    @DisplayName("get_direct_reports — Replaces PKG_EMPLOYEE.get_direct_reports")
    class DirectReports {

        @Test
        @DisplayName("should return only active direct reports")
        void shouldReturnActiveReports() {
            Employee report1 = new Employee();
            report1.setEmpId(2001L);
            report1.setFirstName("ALICE");
            report1.setLastName("SMITH");

            when(employeeRepository.findByManagerEmpIdAndEmploymentStatus(1001L, "ACTIVE"))
                    .thenReturn(List.of(report1));

            List<Employee> reports = employeeService.getDirectReports(1001L);

            assertThat(reports).hasSize(1);
            assertThat(reports.get(0).getFirstName()).isEqualTo("ALICE");
        }
    }
}
