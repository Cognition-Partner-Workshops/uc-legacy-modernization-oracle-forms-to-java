package com.hrms.employee.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "JOB_GRADES", schema = "HRMS")
public class JobGrade {
    @Id
    @Column(name = "GRADE_ID")
    private Long gradeId;

    @Column(name = "GRADE_CODE", unique = true, nullable = false, length = 10)
    private String gradeCode;

    @Column(name = "GRADE_NAME", nullable = false, length = 50)
    private String gradeName;

    @Column(name = "MIN_SALARY", nullable = false, precision = 12, scale = 2)
    private BigDecimal minSalary;

    @Column(name = "MAX_SALARY", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxSalary;

    @Column(name = "OVERTIME_ELIGIBLE", length = 1)
    private String overtimeEligible;

    @Column(name = "ACTIVE_FLAG", length = 1)
    private String activeFlag = "Y";

    public JobGrade() {}

    public Long getGradeId() { return gradeId; }
    public void setGradeId(Long gradeId) { this.gradeId = gradeId; }
    public String getGradeCode() { return gradeCode; }
    public void setGradeCode(String gradeCode) { this.gradeCode = gradeCode; }
    public String getGradeName() { return gradeName; }
    public void setGradeName(String gradeName) { this.gradeName = gradeName; }
    public BigDecimal getMinSalary() { return minSalary; }
    public void setMinSalary(BigDecimal minSalary) { this.minSalary = minSalary; }
    public BigDecimal getMaxSalary() { return maxSalary; }
    public void setMaxSalary(BigDecimal maxSalary) { this.maxSalary = maxSalary; }
    public String getOvertimeEligible() { return overtimeEligible; }
    public String getActiveFlag() { return activeFlag; }
    public void setActiveFlag(String activeFlag) { this.activeFlag = activeFlag; }
}
