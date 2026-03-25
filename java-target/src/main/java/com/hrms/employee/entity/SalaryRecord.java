package com.hrms.employee.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "SALARY_RECORDS", schema = "HRMS")
public class SalaryRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sal_seq")
    @SequenceGenerator(name = "sal_seq", sequenceName = "SEQ_SALARY", allocationSize = 1)
    @Column(name = "SALARY_ID")
    private Long salaryId;

    @Column(name = "EMP_ID", nullable = false)
    private Long empId;
    @Column(name = "EFFECTIVE_DATE", nullable = false)
    private LocalDate effectiveDate;
    @Column(name = "END_DATE")
    private LocalDate endDate;
    @Column(name = "BASE_SALARY", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseSalary;
    @Column(name = "CURRENCY_CODE", length = 3)
    private String currencyCode = "USD";
    @Column(name = "PAY_FREQUENCY", length = 20)
    private String payFrequency = "MONTHLY";
    @Column(name = "SALARY_BASIS", length = 20)
    private String salaryBasis = "ANNUAL";
    @Column(name = "CHANGE_REASON", length = 50)
    private String changeReason;
    @Column(name = "CHANGE_PCT", precision = 5, scale = 2)
    private BigDecimal changePct;
    @Column(name = "APPROVED_BY")
    private Long approvedBy;
    @Column(name = "APPROVAL_DATE")
    private LocalDate approvalDate;
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

    public SalaryRecord() {}

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        if (activeFlag == null) activeFlag = "Y";
    }
    @PreUpdate
    protected void onUpdate() { modifiedDate = LocalDateTime.now(); }

    public Long getSalaryId() { return salaryId; }
    public void setSalaryId(Long salaryId) { this.salaryId = salaryId; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }
    public String getCurrencyCode() { return currencyCode; }
    public String getPayFrequency() { return payFrequency; }
    public String getSalaryBasis() { return salaryBasis; }
    public String getChangeReason() { return changeReason; }
    public void setChangeReason(String changeReason) { this.changeReason = changeReason; }
    public BigDecimal getChangePct() { return changePct; }
    public void setChangePct(BigDecimal changePct) { this.changePct = changePct; }
    public String getActiveFlag() { return activeFlag; }
    public void setActiveFlag(String activeFlag) { this.activeFlag = activeFlag; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }
}
