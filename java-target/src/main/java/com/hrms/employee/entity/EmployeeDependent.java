package com.hrms.employee.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "EMPLOYEE_DEPENDENTS", schema = "HRMS")
public class EmployeeDependent {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "dep_seq")
    @SequenceGenerator(name = "dep_seq", sequenceName = "SEQ_DEPENDENT", allocationSize = 1)
    @Column(name = "DEPENDENT_ID")
    private Long dependentId;

    @Column(name = "EMP_ID", nullable = false)
    private Long empId;
    @Column(name = "FIRST_NAME", nullable = false, length = 50)
    private String firstName;
    @Column(name = "LAST_NAME", nullable = false, length = 50)
    private String lastName;
    @Column(name = "RELATIONSHIP", nullable = false, length = 20)
    private String relationship;
    @Column(name = "DATE_OF_BIRTH")
    private LocalDate dateOfBirth;
    @Column(name = "BENEFITS_ENROLLED", length = 1)
    private String benefitsEnrolled = "N";
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

    public EmployeeDependent() {}

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        if (activeFlag == null) activeFlag = "Y";
    }

    public Long getDependentId() { return dependentId; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getBenefitsEnrolled() { return benefitsEnrolled; }
    public String getActiveFlag() { return activeFlag; }
    public void setActiveFlag(String activeFlag) { this.activeFlag = activeFlag; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
