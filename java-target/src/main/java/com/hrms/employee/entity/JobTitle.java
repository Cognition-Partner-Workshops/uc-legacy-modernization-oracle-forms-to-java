package com.hrms.employee.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "JOB_TITLES", schema = "HRMS")
public class JobTitle {
    @Id
    @Column(name = "JOB_ID")
    private Long jobId;

    @Column(name = "JOB_CODE", unique = true, nullable = false, length = 20)
    private String jobCode;

    @Column(name = "JOB_TITLE", nullable = false, length = 100)
    private String jobTitle;

    @Column(name = "JOB_FAMILY", length = 50)
    private String jobFamily;

    @Column(name = "GRADE_ID", nullable = false)
    private Long gradeId;

    @Column(name = "ACTIVE_FLAG", length = 1)
    private String activeFlag = "Y";

    public JobTitle() {}

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }
    public String getJobCode() { return jobCode; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getJobFamily() { return jobFamily; }
    public Long getGradeId() { return gradeId; }
    public void setGradeId(Long gradeId) { this.gradeId = gradeId; }
    public String getActiveFlag() { return activeFlag; }
    public void setActiveFlag(String activeFlag) { this.activeFlag = activeFlag; }
}
