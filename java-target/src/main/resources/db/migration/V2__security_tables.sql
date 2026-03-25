-- Flyway migration V2: Security tables for authentication and authorization
-- Migrated from: PKG_SECURITY + legacy APP_USERS/APP_ROLES/APP_PERMISSIONS tables
--
-- Key changes from legacy:
-- - PASSWORD_HASH column uses BCrypt instead of MD5 (fixes TD-001)
-- - FAILED_LOGIN_ATTEMPTS and ACCOUNT_LOCKED columns added (fixes TD-002)
-- - Hard-coded encryption key removed; key management externalized (fixes TD-003)
-- - Session table removed; replaced with stateless JWT tokens (ADR-003)

-- Sequences (Oracle-style, portable)
CREATE SEQUENCE IF NOT EXISTS HRMS.SEQ_APP_USER START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS HRMS.SEQ_APP_ROLE START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS HRMS.SEQ_APP_PERMISSION START WITH 1 INCREMENT BY 1;

-- Users table (replaces legacy APP_USERS with security enhancements)
CREATE TABLE IF NOT EXISTS HRMS.APP_USERS (
    USER_ID             BIGINT PRIMARY KEY,
    USERNAME            VARCHAR(100) NOT NULL UNIQUE,
    EMAIL               VARCHAR(150) NOT NULL UNIQUE,
    PASSWORD_HASH       VARCHAR(255) NOT NULL,
    EMP_ID              BIGINT,
    ACCOUNT_LOCKED      BOOLEAN NOT NULL DEFAULT FALSE,
    FAILED_LOGIN_ATTEMPTS INTEGER NOT NULL DEFAULT 0,
    LOCK_EXPIRY_DATE    TIMESTAMP,
    PASSWORD_CHANGED_DATE TIMESTAMP,
    ACTIVE_FLAG         CHAR(1) NOT NULL DEFAULT 'Y',
    CREATED_BY          VARCHAR(100),
    CREATED_DATE        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MODIFIED_BY         VARCHAR(100),
    MODIFIED_DATE       TIMESTAMP,
    CONSTRAINT FK_USER_EMPLOYEE FOREIGN KEY (EMP_ID) REFERENCES HRMS.EMPLOYEES(EMP_ID)
);

-- Roles table
CREATE TABLE IF NOT EXISTS HRMS.APP_ROLES (
    ROLE_ID             BIGINT PRIMARY KEY,
    ROLE_NAME           VARCHAR(50) NOT NULL UNIQUE,
    DESCRIPTION         VARCHAR(255)
);

-- Permissions table (maps to legacy PKG_SECURITY.has_permission module/action pairs)
CREATE TABLE IF NOT EXISTS HRMS.APP_PERMISSIONS (
    PERMISSION_ID       BIGINT PRIMARY KEY,
    PERMISSION_NAME     VARCHAR(100) NOT NULL UNIQUE,
    MODULE              VARCHAR(50) NOT NULL,
    ACTION              VARCHAR(50) NOT NULL,
    DESCRIPTION         VARCHAR(255)
);

-- User-Role join table
CREATE TABLE IF NOT EXISTS HRMS.USER_ROLES (
    USER_ID             BIGINT NOT NULL,
    ROLE_ID             BIGINT NOT NULL,
    PRIMARY KEY (USER_ID, ROLE_ID),
    CONSTRAINT FK_UR_USER FOREIGN KEY (USER_ID) REFERENCES HRMS.APP_USERS(USER_ID),
    CONSTRAINT FK_UR_ROLE FOREIGN KEY (ROLE_ID) REFERENCES HRMS.APP_ROLES(ROLE_ID)
);

-- Role-Permission join table
CREATE TABLE IF NOT EXISTS HRMS.ROLE_PERMISSIONS (
    ROLE_ID             BIGINT NOT NULL,
    PERMISSION_ID       BIGINT NOT NULL,
    PRIMARY KEY (ROLE_ID, PERMISSION_ID),
    CONSTRAINT FK_RP_ROLE FOREIGN KEY (ROLE_ID) REFERENCES HRMS.APP_ROLES(ROLE_ID),
    CONSTRAINT FK_RP_PERM FOREIGN KEY (PERMISSION_ID) REFERENCES HRMS.APP_PERMISSIONS(PERMISSION_ID)
);

-- Seed default roles (matching legacy PKG_SECURITY role definitions)
INSERT INTO HRMS.APP_ROLES (ROLE_ID, ROLE_NAME, DESCRIPTION) VALUES
    (1, 'ADMIN', 'System administrator with full access'),
    (2, 'HR_MANAGER', 'HR manager with employee and leave management access'),
    (3, 'PAYROLL_ADMIN', 'Payroll administrator with payroll processing access'),
    (4, 'MANAGER', 'Department manager with team management access'),
    (5, 'EMPLOYEE', 'Standard employee with self-service access');

-- Seed default permissions (maps to legacy has_permission(emp_id, module, action) calls)
INSERT INTO HRMS.APP_PERMISSIONS (PERMISSION_ID, PERMISSION_NAME, MODULE, ACTION, DESCRIPTION) VALUES
    (1,  'EMPLOYEE_CREATE',   'EMPLOYEE',    'CREATE',  'Create new employee records'),
    (2,  'EMPLOYEE_READ',     'EMPLOYEE',    'READ',    'View employee records'),
    (3,  'EMPLOYEE_UPDATE',   'EMPLOYEE',    'UPDATE',  'Update employee records'),
    (4,  'EMPLOYEE_DELETE',   'EMPLOYEE',    'DELETE',  'Deactivate employee records'),
    (5,  'EMPLOYEE_TRANSFER', 'EMPLOYEE',    'TRANSFER','Transfer employees between departments'),
    (6,  'PAYROLL_CREATE',    'PAYROLL',     'CREATE',  'Create payroll runs'),
    (7,  'PAYROLL_CALCULATE', 'PAYROLL',     'CALCULATE','Calculate payroll'),
    (8,  'PAYROLL_APPROVE',   'PAYROLL',     'APPROVE', 'Approve payroll runs'),
    (9,  'PAYROLL_REVERSE',   'PAYROLL',     'REVERSE', 'Reverse payroll runs'),
    (10, 'LEAVE_SUBMIT',      'LEAVE',       'SUBMIT',  'Submit leave requests'),
    (11, 'LEAVE_APPROVE',     'LEAVE',       'APPROVE', 'Approve leave requests'),
    (12, 'LEAVE_VIEW_TEAM',   'LEAVE',       'VIEW_TEAM','View team leave requests'),
    (13, 'PERFORMANCE_REVIEW','PERFORMANCE', 'REVIEW',  'Submit performance reviews'),
    (14, 'PERFORMANCE_MANAGE','PERFORMANCE', 'MANAGE',  'Manage performance cycles'),
    (15, 'REPORT_VIEW',       'REPORT',      'VIEW',    'View reports'),
    (16, 'REPORT_GENERATE',   'REPORT',      'GENERATE','Generate reports'),
    (17, 'ADMIN_USER_MANAGE', 'ADMIN',       'USER_MANAGE','Manage user accounts'),
    (18, 'ADMIN_ROLE_MANAGE', 'ADMIN',       'ROLE_MANAGE','Manage roles and permissions');

-- Assign permissions to roles
-- ADMIN gets all permissions
INSERT INTO HRMS.ROLE_PERMISSIONS (ROLE_ID, PERMISSION_ID)
    SELECT 1, PERMISSION_ID FROM HRMS.APP_PERMISSIONS;

-- HR_MANAGER gets employee + leave + performance + report permissions
INSERT INTO HRMS.ROLE_PERMISSIONS (ROLE_ID, PERMISSION_ID) VALUES
    (2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
    (2, 10), (2, 11), (2, 12),
    (2, 13), (2, 14),
    (2, 15), (2, 16);

-- PAYROLL_ADMIN gets payroll + employee read + report permissions
INSERT INTO HRMS.ROLE_PERMISSIONS (ROLE_ID, PERMISSION_ID) VALUES
    (3, 2),
    (3, 6), (3, 7), (3, 8), (3, 9),
    (3, 15), (3, 16);

-- MANAGER gets employee read + leave approve + performance + report view
INSERT INTO HRMS.ROLE_PERMISSIONS (ROLE_ID, PERMISSION_ID) VALUES
    (4, 2),
    (4, 10), (4, 11), (4, 12),
    (4, 13),
    (4, 15);

-- EMPLOYEE gets self-service permissions
INSERT INTO HRMS.ROLE_PERMISSIONS (ROLE_ID, PERMISSION_ID) VALUES
    (5, 2),
    (5, 10),
    (5, 13);
