package com.hrms.employee;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Employee Entity
 *
 * Migrated from: HRMS.EMPLOYEES table
 * Maps to the same table structure with JPA annotations replacing
 * the Forms block definition in HRMS_EMPLOYEE.xml
 */
@Entity
@Table(name = "EMPLOYEES", schema = "HRMS")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "emp_seq")
    @SequenceGenerator(name = "emp_seq", sequenceName = "SEQ_EMPLOYEE", allocationSize = 1)
    @Column(name = "EMP_ID")
    private Long empId;

    @Column(name = "EMP_NUMBER", unique = true, nullable = false, length = 20)
    private String empNumber;

    @NotBlank
    @Column(name = "FIRST_NAME", nullable = false, length = 50)
    private String firstName;

    @NotBlank
    @Column(name = "LAST_NAME", nullable = false, length = 50)
    private String lastName;

    @Email
    @Column(name = "EMAIL", length = 100)
    private String email;

    @Column(name = "PHONE_WORK", length = 30)
    private String phoneWork;

    @Column(name = "PHONE_MOBILE", length = 30)
    private String phoneMobile;

    @NotNull
    @Column(name = "HIRE_DATE", nullable = false)
    private LocalDate hireDate;

    @Column(name = "TERMINATION_DATE")
    private LocalDate terminationDate;

    @Column(name = "TERMINATION_REASON", length = 50)
    private String terminationReason;

    @NotNull
    @Column(name = "DEPT_ID", nullable = false)
    private Long deptId;

    @NotNull
    @Column(name = "JOB_ID", nullable = false)
    private Long jobId;

    @Column(name = "MANAGER_EMP_ID")
    private Long managerEmpId;

    @Column(name = "LOCATION_CODE", length = 10)
    private String locationCode;

    @Column(name = "EMPLOYMENT_TYPE", length = 20)
    private String employmentType;

    @Column(name = "EMPLOYMENT_STATUS", length = 20)
    private String employmentStatus;

    @Column(name = "GENDER", length = 1)
    private String gender;

    @Column(name = "DATE_OF_BIRTH")
    private LocalDate dateOfBirth;

    @Column(name = "MARITAL_STATUS", length = 10)
    private String maritalStatus;

    @Column(name = "ACTIVE_FLAG", length = 1)
    private String activeFlag = "Y";

    // Audit columns - replaces Forms PRE-INSERT/PRE-UPDATE triggers
    @Column(name = "CREATED_BY", updatable = false)
    private String createdBy;

    @Column(name = "CREATED_DATE", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "MODIFIED_BY")
    private String modifiedBy;

    @Column(name = "MODIFIED_DATE")
    private LocalDateTime modifiedDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        if (activeFlag == null) activeFlag = "Y";
        if (employmentStatus == null) employmentStatus = "ACTIVE";
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedDate = LocalDateTime.now();
    }

    // Getters and setters omitted for brevity
    // In production: use Lombok @Data or Java records for DTOs
}
