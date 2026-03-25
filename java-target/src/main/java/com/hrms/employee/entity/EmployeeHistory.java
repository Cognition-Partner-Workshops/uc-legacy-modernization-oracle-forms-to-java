package com.hrms.employee.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "EMPLOYEE_HISTORY", schema = "HRMS")
public class EmployeeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "emp_hist_seq")
    @SequenceGenerator(name = "emp_hist_seq", sequenceName = "SEQ_EMP_HISTORY", allocationSize = 1)
    @Column(name = "HIST_ID")
    private Long histId;

    @Column(name = "EMP_ID", nullable = false)
    private Long empId;
    @Column(name = "CHANGE_TYPE", nullable = false, length = 30)
    private String changeType;
    @Column(name = "EFFECTIVE_DATE", nullable = false)
    private LocalDate effectiveDate;
    @Column(name = "OLD_DEPT_ID")
    private Long oldDeptId;
    @Column(name = "NEW_DEPT_ID")
    private Long newDeptId;
    @Column(name = "OLD_JOB_ID")
    private Long oldJobId;
    @Column(name = "NEW_JOB_ID")
    private Long newJobId;
    @Column(name = "OLD_MANAGER_ID")
    private Long oldManagerId;
    @Column(name = "NEW_MANAGER_ID")
    private Long newManagerId;
    @Column(name = "OLD_SALARY", precision = 12, scale = 2)
    private BigDecimal oldSalary;
    @Column(name = "NEW_SALARY", precision = 12, scale = 2)
    private BigDecimal newSalary;
    @Column(name = "OLD_LOCATION", length = 10)
    private String oldLocation;
    @Column(name = "NEW_LOCATION", length = 10)
    private String newLocation;
    @Column(name = "REASON_CODE", length = 30)
    private String reasonCode;
    @Column(name = "COMMENTS", length = 4000)
    private String comments;
    @Column(name = "CREATED_BY", nullable = false, updatable = false)
    private String createdBy;
    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    public EmployeeHistory() {}

    @PrePersist
    protected void onCreate() { createdDate = LocalDateTime.now(); }

    public Long getHistId() { return histId; }
    public void setHistId(Long histId) { this.histId = histId; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public String getChangeType() { return changeType; }
    public void setChangeType(String changeType) { this.changeType = changeType; }
    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }
    public Long getOldDeptId() { return oldDeptId; }
    public void setOldDeptId(Long oldDeptId) { this.oldDeptId = oldDeptId; }
    public Long getNewDeptId() { return newDeptId; }
    public void setNewDeptId(Long newDeptId) { this.newDeptId = newDeptId; }
    public Long getOldJobId() { return oldJobId; }
    public void setOldJobId(Long oldJobId) { this.oldJobId = oldJobId; }
    public Long getNewJobId() { return newJobId; }
    public void setNewJobId(Long newJobId) { this.newJobId = newJobId; }
    public Long getOldManagerId() { return oldManagerId; }
    public void setOldManagerId(Long oldManagerId) { this.oldManagerId = oldManagerId; }
    public Long getNewManagerId() { return newManagerId; }
    public void setNewManagerId(Long newManagerId) { this.newManagerId = newManagerId; }
    public BigDecimal getOldSalary() { return oldSalary; }
    public void setOldSalary(BigDecimal oldSalary) { this.oldSalary = oldSalary; }
    public BigDecimal getNewSalary() { return newSalary; }
    public void setNewSalary(BigDecimal newSalary) { this.newSalary = newSalary; }
    public String getOldLocation() { return oldLocation; }
    public void setOldLocation(String oldLocation) { this.oldLocation = oldLocation; }
    public String getNewLocation() { return newLocation; }
    public void setNewLocation(String newLocation) { this.newLocation = newLocation; }
    public String getReasonCode() { return reasonCode; }
    public void setReasonCode(String reasonCode) { this.reasonCode = reasonCode; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
}
