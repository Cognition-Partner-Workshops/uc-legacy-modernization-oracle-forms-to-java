package com.hrms.employee;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Employee Entity
 *
 * Migrated from: HRMS.EMPLOYEES table + HRMS_EMPLOYEE.xml Forms block
 * Legacy references:
 * - PKG_EMPLOYEE.create_employee -> Service layer + @PrePersist
 * - HRMS_EMPLOYEE PRE-INSERT trigger -> @PrePersist
 * - HRMS_EMPLOYEE PRE-UPDATE trigger -> @PreUpdate
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

    @Column(name = "MIDDLE_NAME", length = 50)
    private String middleName;

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

    @Column(name = "ADDRESS_LINE1", length = 200)
    private String addressLine1;

    @Column(name = "ADDRESS_LINE2", length = 200)
    private String addressLine2;

    @Column(name = "CITY", length = 100)
    private String city;

    @Column(name = "STATE_PROVINCE", length = 100)
    private String stateProvince;

    @Column(name = "POSTAL_CODE", length = 20)
    private String postalCode;

    @Column(name = "COUNTRY_CODE", length = 3)
    private String countryCode;

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

    @Column(name = "NATIONALITY", length = 50)
    private String nationality;

    @Column(name = "ACTIVE_FLAG", length = 1)
    private String activeFlag = "Y";

    @Column(name = "CREATED_BY", updatable = false)
    private String createdBy;

    @Column(name = "CREATED_DATE", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "MODIFIED_BY")
    private String modifiedBy;

    @Column(name = "MODIFIED_DATE")
    private LocalDateTime modifiedDate;

    public Employee() {}

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

    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public String getEmpNumber() { return empNumber; }
    public void setEmpNumber(String empNumber) { this.empNumber = empNumber; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneWork() { return phoneWork; }
    public void setPhoneWork(String phoneWork) { this.phoneWork = phoneWork; }
    public String getPhoneMobile() { return phoneMobile; }
    public void setPhoneMobile(String phoneMobile) { this.phoneMobile = phoneMobile; }
    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }
    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getStateProvince() { return stateProvince; }
    public void setStateProvince(String stateProvince) { this.stateProvince = stateProvince; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public LocalDate getTerminationDate() { return terminationDate; }
    public void setTerminationDate(LocalDate terminationDate) { this.terminationDate = terminationDate; }
    public String getTerminationReason() { return terminationReason; }
    public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }
    public Long getDeptId() { return deptId; }
    public void setDeptId(Long deptId) { this.deptId = deptId; }
    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public Long getManagerEmpId() { return managerEmpId; }
    public void setManagerEmpId(Long managerEmpId) { this.managerEmpId = managerEmpId; }
    public String getLocationCode() { return locationCode; }
    public void setLocationCode(String locationCode) { this.locationCode = locationCode; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public String getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(String employmentStatus) { this.employmentStatus = employmentStatus; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }
    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }
    public String getActiveFlag() { return activeFlag; }
    public void setActiveFlag(String activeFlag) { this.activeFlag = activeFlag; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }
    public LocalDateTime getModifiedDate() { return modifiedDate; }
    public void setModifiedDate(LocalDateTime modifiedDate) { this.modifiedDate = modifiedDate; }
}
