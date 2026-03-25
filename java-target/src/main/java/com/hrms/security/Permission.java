package com.hrms.security;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

/**
 * Permission Entity
 *
 * Migrated from: HRMS.APP_PERMISSIONS table
 * Replaces the module/action permission checks in PKG_SECURITY.has_permission()
 *
 * Permissions follow the pattern: MODULE_ACTION (e.g., EMPLOYEE_CREATE, PAYROLL_APPROVE)
 * This maps directly to the legacy has_permission(emp_id, module, action) function.
 */
@Entity
@Table(name = "APP_PERMISSIONS", schema = "HRMS")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "perm_seq")
    @SequenceGenerator(name = "perm_seq", sequenceName = "SEQ_APP_PERMISSION", allocationSize = 1)
    @Column(name = "PERMISSION_ID")
    private Long permissionId;

    @NotBlank
    @Column(name = "PERMISSION_NAME", unique = true, nullable = false, length = 100)
    private String permissionName;

    @Column(name = "MODULE", nullable = false, length = 50)
    private String module;

    @Column(name = "ACTION", nullable = false, length = 50)
    private String action;

    @Column(name = "DESCRIPTION", length = 255)
    private String description;

    // Getters and setters

    public Long getPermissionId() {
        return permissionId;
    }

    public void setPermissionId(Long permissionId) {
        this.permissionId = permissionId;
    }

    public String getPermissionName() {
        return permissionName;
    }

    public void setPermissionName(String permissionName) {
        this.permissionName = permissionName;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
