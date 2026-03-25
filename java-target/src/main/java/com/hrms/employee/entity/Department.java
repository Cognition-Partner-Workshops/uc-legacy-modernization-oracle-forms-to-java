package com.hrms.employee.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "DEPARTMENTS", schema = "HRMS")
public class Department {
    @Id
    @Column(name = "DEPT_ID")
    private Long deptId;

    @Column(name = "DEPT_CODE", unique = true, nullable = false, length = 20)
    private String deptCode;

    @Column(name = "DEPT_NAME", nullable = false, length = 100)
    private String deptName;

    @Column(name = "PARENT_DEPT_ID")
    private Long parentDeptId;

    @Column(name = "COST_CENTER", length = 20)
    private String costCenter;

    @Column(name = "MANAGER_EMP_ID")
    private Long managerEmpId;

    @Column(name = "LOCATION_CODE", length = 10)
    private String locationCode;

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

    public Department() {}

    public Long getDeptId() { return deptId; }
    public void setDeptId(Long deptId) { this.deptId = deptId; }
    public String getDeptCode() { return deptCode; }
    public void setDeptCode(String deptCode) { this.deptCode = deptCode; }
    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }
    public Long getParentDeptId() { return parentDeptId; }
    public String getCostCenter() { return costCenter; }
    public Long getManagerEmpId() { return managerEmpId; }
    public String getLocationCode() { return locationCode; }
    public void setLocationCode(String locationCode) { this.locationCode = locationCode; }
    public String getActiveFlag() { return activeFlag; }
    public void setActiveFlag(String activeFlag) { this.activeFlag = activeFlag; }
}
