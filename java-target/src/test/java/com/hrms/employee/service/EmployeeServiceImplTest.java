package com.hrms.employee.service;

import com.hrms.employee.*;
import com.hrms.employee.entity.*;
import com.hrms.employee.exception.*;
import com.hrms.employee.repository.*;
import com.hrms.employee.validation.EmployeeValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.hrms.employee.event.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmployeeServiceImpl
 *
 * Demonstrates parity with legacy PKG_EMPLOYEE behavior:
 * - create_employee: validates dept, job, manager; generates emp number; logs history; creates salary record
 * - update_employee: validates references; updates fields
 * - terminate_employee: checks not already terminated; ends salary; logs history; publishes event
 * - transfer_employee: validates new dept; logs history with old/new values
 * - promote_employee: validates new job; creates new salary record; logs history
 * - rehire_employee: only works on terminated employees; resets status
 * - get_direct_reports: returns active employees under a manager
 * - get_headcount_by_dept: counts active employees in department
 * - get_tenure_years: calculates years from hire date
 * - is_active: checks employment status and active flag
 */
@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private JobTitleRepository jobTitleRepository;
    @Mock private EmployeeHistoryRepository historyRepository;
    @Mock private SalaryRecordRepository salaryRecordRepository;
    @Mock private EmployeeValidator validator;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private EmployeeServiceImpl service;

    private Employee sampleEmployee;
    private CreateEmployeeRequest createRequest;

    @BeforeEach
    void setUp() {
        sampleEmployee = new Employee();
        sampleEmployee.setEmpId(1L);
        sampleEmployee.setEmpNumber("EMP-000001");
        sampleEmployee.setFirstName("John");
        sampleEmployee.setLastName("Doe");
        sampleEmployee.setEmail("john.doe@company.com");
        sampleEmployee.setHireDate(LocalDate.of(2020, 1, 15));
        sampleEmployee.setDeptId(100L);
        sampleEmployee.setJobId(10L);
        sampleEmployee.setManagerEmpId(2L);
        sampleEmployee.setLocationCode("NYC");
        sampleEmployee.setEmploymentType("FULL_TIME");
        sampleEmployee.setEmploymentStatus("ACTIVE");
        sampleEmployee.setActiveFlag("Y");

        createRequest = new CreateEmployeeRequest(
            "John", "Doe", "john.doe@company.com",
            "212-555-1234", "917-555-5678",
            LocalDate.now(), 100L, 10L, 2L, "NYC",
            "FULL_TIME", "M", LocalDate.of(1990, 5, 20), "SINGLE",
            new BigDecimal("75000.00")
        );
    }

    // ==================== CREATE TESTS ====================
    // Parity: PKG_EMPLOYEE.create_employee (lines 184-342)

    @Nested
    @DisplayName("create - parity with PKG_EMPLOYEE.create_employee")
    class CreateTests {

        @Test
        @DisplayName("should create employee with valid data (happy path)")
        void createEmployee_success() {
            when(validator.validateForCreate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
            when(departmentRepository.existsByDeptIdAndActiveFlag(100L, "Y")).thenReturn(true);
            when(jobTitleRepository.existsByJobIdAndActiveFlag(10L, "Y")).thenReturn(true);
            when(employeeRepository.existsById(2L)).thenReturn(true);
            when(employeeRepository.count()).thenReturn(0L);
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
                Employee e = inv.getArgument(0);
                e.setEmpId(1L);
                return e;
            });

            Employee result = service.create(createRequest);

            assertThat(result.getEmpNumber()).isEqualTo("EMP-000001");
            assertThat(result.getFirstName()).isEqualTo("John");
            assertThat(result.getEmploymentStatus()).isEqualTo("ACTIVE");
            assertThat(result.getActiveFlag()).isEqualTo("Y");

            // Verify history was logged (replaces PKG_EMPLOYEE.log_history AUTONOMOUS_TRANSACTION)
            verify(historyRepository).save(any(EmployeeHistory.class));
            // Verify salary record created (replaces PKG_PAYROLL.create_salary_record call)
            verify(salaryRecordRepository).save(any(SalaryRecord.class));
            // Verify event published (breaks circular dependency)
            verify(eventPublisher).publishEvent(any(EmployeeCreatedEvent.class));
        }

        @Test
        @DisplayName("should reject invalid department (parity: e_invalid_department -20003)")
        void createEmployee_invalidDept() {
            when(validator.validateForCreate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
            when(departmentRepository.existsByDeptIdAndActiveFlag(100L, "Y")).thenReturn(false);

            assertThatThrownBy(() -> service.create(createRequest))
                .isInstanceOf(InvalidDepartmentException.class)
                .hasMessageContaining("100");
        }

        @Test
        @DisplayName("should reject invalid manager (parity: e_invalid_manager -20004)")
        void createEmployee_invalidManager() {
            when(validator.validateForCreate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
            when(departmentRepository.existsByDeptIdAndActiveFlag(100L, "Y")).thenReturn(true);
            when(jobTitleRepository.existsByJobIdAndActiveFlag(10L, "Y")).thenReturn(true);
            when(employeeRepository.existsById(2L)).thenReturn(false);

            assertThatThrownBy(() -> service.create(createRequest))
                .isInstanceOf(InvalidManagerException.class)
                .hasMessageContaining("2");
        }

        @Test
        @DisplayName("should reject when validation fails")
        void createEmployee_validationFails() {
            when(validator.validateForCreate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of("First name is required"));

            assertThatThrownBy(() -> service.create(createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("First name is required");
        }
    }

    // ==================== FIND TESTS ====================
    // Parity: PKG_EMPLOYEE.get_employee (lines 85-130), get_employee_by_number (lines 135-180)

    @Nested
    @DisplayName("find - parity with PKG_EMPLOYEE.get_employee")
    class FindTests {

        @Test
        @DisplayName("should find employee by ID")
        void findById_found() {
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            Optional<Employee> result = service.findById(1L);
            assertThat(result).isPresent();
            assertThat(result.get().getFirstName()).isEqualTo("John");
        }

        @Test
        @DisplayName("should return empty for non-existent ID")
        void findById_notFound() {
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());
            assertThat(service.findById(999L)).isEmpty();
        }

        @Test
        @DisplayName("should find employee by emp number")
        void findByEmpNumber_found() {
            when(employeeRepository.findByEmpNumber("EMP-000001")).thenReturn(Optional.of(sampleEmployee));
            Optional<Employee> result = service.findByEmpNumber("EMP-000001");
            assertThat(result).isPresent();
        }
    }

    // ==================== TERMINATE TESTS ====================
    // Parity: PKG_EMPLOYEE.terminate_employee (lines 647-745)

    @Nested
    @DisplayName("terminate - parity with PKG_EMPLOYEE.terminate_employee")
    class TerminateTests {

        @Test
        @DisplayName("should terminate active employee")
        void terminateEmployee_success() {
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(salaryRecordRepository.findByEmpIdAndActiveFlag(1L, "Y"))
                .thenReturn(Optional.of(new SalaryRecord()));

            TerminationRequest request = new TerminationRequest(LocalDate.now(), "Resignation", "Voluntary");
            Employee result = service.terminate(1L, request);

            assertThat(result.getEmploymentStatus()).isEqualTo("TERMINATED");
            assertThat(result.getActiveFlag()).isEqualTo("N");
            assertThat(result.getTerminationDate()).isEqualTo(LocalDate.now());
            verify(historyRepository).save(any(EmployeeHistory.class));
            verify(eventPublisher).publishEvent(any(EmployeeTerminatedEvent.class));
        }

        @Test
        @DisplayName("should reject termination of already terminated employee (parity: e_termination_error -20005)")
        void terminateEmployee_alreadyTerminated() {
            sampleEmployee.setEmploymentStatus("TERMINATED");
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));

            TerminationRequest request = new TerminationRequest(LocalDate.now(), "Resignation", null);
            assertThatThrownBy(() -> service.terminate(1L, request))
                .isInstanceOf(TerminationException.class)
                .hasMessageContaining("already terminated");
        }

        @Test
        @DisplayName("should throw EmployeeNotFoundException for non-existent employee")
        void terminateEmployee_notFound() {
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());
            TerminationRequest request = new TerminationRequest(LocalDate.now(), "Resignation", null);
            assertThatThrownBy(() -> service.terminate(999L, request))
                .isInstanceOf(EmployeeNotFoundException.class);
        }
    }

    // ==================== TRANSFER TESTS ====================
    // Parity: PKG_EMPLOYEE.transfer_employee (lines 504-576)

    @Nested
    @DisplayName("transfer - parity with PKG_EMPLOYEE.transfer_employee")
    class TransferTests {

        @Test
        @DisplayName("should transfer employee to new department")
        void transferEmployee_success() {
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(departmentRepository.existsByDeptIdAndActiveFlag(200L, "Y")).thenReturn(true);
            when(employeeRepository.existsById(3L)).thenReturn(true);
            when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            TransferRequest request = new TransferRequest(200L, 3L, "SFO", LocalDate.now(), "Relocation");
            Employee result = service.transfer(1L, request);

            assertThat(result.getDeptId()).isEqualTo(200L);
            assertThat(result.getManagerEmpId()).isEqualTo(3L);
            assertThat(result.getLocationCode()).isEqualTo("SFO");

            // Verify history logged with old and new values
            ArgumentCaptor<EmployeeHistory> captor = ArgumentCaptor.forClass(EmployeeHistory.class);
            verify(historyRepository).save(captor.capture());
            EmployeeHistory history = captor.getValue();
            assertThat(history.getChangeType()).isEqualTo("TRANSFER");
            assertThat(history.getOldDeptId()).isEqualTo(100L);
            assertThat(history.getNewDeptId()).isEqualTo(200L);
        }

        @Test
        @DisplayName("should reject transfer to invalid department")
        void transferEmployee_invalidDept() {
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(departmentRepository.existsByDeptIdAndActiveFlag(999L, "Y")).thenReturn(false);

            TransferRequest request = new TransferRequest(999L, null, null, LocalDate.now(), "Test");
            assertThatThrownBy(() -> service.transfer(1L, request))
                .isInstanceOf(InvalidDepartmentException.class);
        }
    }

    // ==================== PROMOTE TESTS ====================
    // Parity: PKG_EMPLOYEE.promote_employee (lines 581-642)

    @Nested
    @DisplayName("promote - parity with PKG_EMPLOYEE.promote_employee")
    class PromoteTests {

        @Test
        @DisplayName("should promote employee to new job with new salary")
        void promoteEmployee_success() {
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(jobTitleRepository.existsByJobIdAndActiveFlag(20L, "Y")).thenReturn(true);
            when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(salaryRecordRepository.findByEmpIdAndActiveFlag(1L, "Y"))
                .thenReturn(Optional.of(new SalaryRecord()));

            PromoteRequest request = new PromoteRequest(20L, new BigDecimal("95000.00"), "Excellent performance");
            Employee result = service.promote(1L, request);

            assertThat(result.getJobId()).isEqualTo(20L);
            verify(salaryRecordRepository, times(2)).save(any(SalaryRecord.class));
            verify(historyRepository).save(any(EmployeeHistory.class));
            verify(eventPublisher).publishEvent(any(EmployeePromotedEvent.class));
        }
    }

    // ==================== REHIRE TESTS ====================
    // Parity: PKG_EMPLOYEE.rehire_employee (lines 750-793)

    @Nested
    @DisplayName("rehire - parity with PKG_EMPLOYEE.rehire_employee")
    class RehireTests {

        @Test
        @DisplayName("should rehire terminated employee")
        void rehireEmployee_success() {
            sampleEmployee.setEmploymentStatus("TERMINATED");
            sampleEmployee.setActiveFlag("N");
            sampleEmployee.setTerminationDate(LocalDate.of(2023, 6, 30));

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(departmentRepository.existsByDeptIdAndActiveFlag(100L, "Y")).thenReturn(true);
            when(jobTitleRepository.existsByJobIdAndActiveFlag(10L, "Y")).thenReturn(true);
            when(employeeRepository.existsById(2L)).thenReturn(true);
            when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            RehireRequest request = new RehireRequest(100L, 10L, 2L, "NYC",
                LocalDate.now(), new BigDecimal("80000.00"));
            Employee result = service.rehire(1L, request);

            assertThat(result.getEmploymentStatus()).isEqualTo("ACTIVE");
            assertThat(result.getActiveFlag()).isEqualTo("Y");
            assertThat(result.getTerminationDate()).isNull();
            verify(salaryRecordRepository).save(any(SalaryRecord.class));
            verify(historyRepository).save(any(EmployeeHistory.class));
        }

        @Test
        @DisplayName("should reject rehire of active employee")
        void rehireEmployee_notTerminated() {
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));

            RehireRequest request = new RehireRequest(100L, 10L, null, null,
                LocalDate.now(), new BigDecimal("80000.00"));
            assertThatThrownBy(() -> service.rehire(1L, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("terminated");
        }
    }

    // ==================== ORG CHART & REPORTS TESTS ====================
    // Parity: PKG_EMPLOYEE.get_direct_reports (lines 798-816), get_org_chart (lines 822-840)

    @Nested
    @DisplayName("org chart and reports - parity with PKG_EMPLOYEE.get_org_chart/get_direct_reports")
    class OrgChartTests {

        @Test
        @DisplayName("should get direct reports for a manager")
        void getDirectReports() {
            Employee report1 = new Employee();
            report1.setEmpId(3L);
            report1.setFirstName("Jane");
            report1.setLastName("Smith");
            Employee report2 = new Employee();
            report2.setEmpId(4L);
            report2.setFirstName("Bob");
            report2.setLastName("Wilson");

            when(employeeRepository.findByManagerEmpIdAndActiveFlag(1L, "Y"))
                .thenReturn(List.of(report1, report2));

            List<Employee> reports = service.getDirectReports(1L);
            assertThat(reports).hasSize(2);
        }

        @Test
        @DisplayName("should build org chart tree recursively")
        void getOrgChart() {
            Employee child = new Employee();
            child.setEmpId(3L);
            child.setEmpNumber("EMP-000003");
            child.setFirstName("Jane");
            child.setLastName("Smith");

            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            when(employeeRepository.findByManagerEmpIdAndActiveFlag(1L, "Y"))
                .thenReturn(List.of(child));
            when(employeeRepository.findByManagerEmpIdAndActiveFlag(3L, "Y"))
                .thenReturn(List.of());

            OrgChartNode node = service.getOrgChart(1L);
            assertThat(node.empId()).isEqualTo(1L);
            assertThat(node.directReports()).hasSize(1);
            assertThat(node.directReports().get(0).empId()).isEqualTo(3L);
        }
    }

    // ==================== HEADCOUNT, TENURE, ACTIVE TESTS ====================
    // Parity: PKG_EMPLOYEE.get_headcount_by_dept, get_tenure_years, is_active

    @Nested
    @DisplayName("queries - parity with PKG_EMPLOYEE utility functions")
    class QueryTests {

        @Test
        @DisplayName("should return headcount by department")
        void getHeadcountByDept() {
            when(employeeRepository.countActiveByDeptId(100L)).thenReturn(15L);
            assertThat(service.getHeadcountByDept(100L)).isEqualTo(15L);
        }

        @Test
        @DisplayName("should calculate tenure years for active employee")
        void getTenureYears_active() {
            sampleEmployee.setHireDate(LocalDate.now().minusYears(3));
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            double tenure = service.getTenureYears(1L);
            assertThat(tenure).isBetween(2.9, 3.1);
        }

        @Test
        @DisplayName("should calculate tenure using termination date for terminated employee")
        void getTenureYears_terminated() {
            sampleEmployee.setHireDate(LocalDate.of(2020, 1, 1));
            sampleEmployee.setTerminationDate(LocalDate.of(2022, 1, 1));
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            double tenure = service.getTenureYears(1L);
            assertThat(tenure).isBetween(1.9, 2.1);
        }

        @Test
        @DisplayName("should return true for active employee")
        void isActive_true() {
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            assertThat(service.isActive(1L)).isTrue();
        }

        @Test
        @DisplayName("should return false for terminated employee")
        void isActive_terminated() {
            sampleEmployee.setEmploymentStatus("TERMINATED");
            sampleEmployee.setActiveFlag("N");
            when(employeeRepository.findById(1L)).thenReturn(Optional.of(sampleEmployee));
            assertThat(service.isActive(1L)).isFalse();
        }

        @Test
        @DisplayName("should return false for non-existent employee")
        void isActive_notFound() {
            when(employeeRepository.findById(999L)).thenReturn(Optional.empty());
            assertThat(service.isActive(999L)).isFalse();
        }
    }
}
