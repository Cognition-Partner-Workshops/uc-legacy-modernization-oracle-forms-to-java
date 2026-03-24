# REST API Design

## API Convention

- Base path: `/api/v1`
- JSON request/response bodies
- Standard HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500)
- JWT Bearer token authentication
- Pagination: `?page=0&size=20&sort=lastName,asc`

## Endpoints

### Authentication (`/api/v1/auth`)

| Method | Path | Description | Legacy Equivalent |
|---|---|---|---|
| POST | `/auth/login` | Authenticate user | PKG_SECURITY.authenticate |
| POST | `/auth/logout` | Invalidate token | PKG_SECURITY.logout |
| POST | `/auth/change-password` | Change password | PKG_SECURITY.change_password |

### Employees (`/api/v1/employees`)

| Method | Path | Description | Legacy Equivalent |
|---|---|---|---|
| GET | `/employees` | List/search employees | PKG_EMPLOYEE.search_employees |
| POST | `/employees` | Create employee | PKG_EMPLOYEE.create_employee |
| GET | `/employees/{id}` | Get employee detail | PKG_EMPLOYEE.get_employee |
| PUT | `/employees/{id}` | Update employee | PKG_EMPLOYEE.update_employee |
| POST | `/employees/{id}/terminate` | Terminate employee | PKG_EMPLOYEE.terminate_employee |
| POST | `/employees/{id}/transfer` | Transfer department | PKG_EMPLOYEE.transfer_employee |
| GET | `/employees/{id}/direct-reports` | Get direct reports | PKG_EMPLOYEE.get_direct_reports |
| GET | `/employees/{id}/org-chart` | Get org chart | PKG_EMPLOYEE.get_org_chart |
| GET | `/employees/{id}/salary-history` | Salary records | SALARY block query |
| GET | `/employees/{id}/history` | Employment history | HISTORY block query |

### Leave (`/api/v1/leave`)

| Method | Path | Description | Legacy Equivalent |
|---|---|---|---|
| GET | `/leave/requests` | List my requests | LEAVE_REQUEST block query |
| POST | `/leave/requests` | Submit request | PKG_LEAVE.submit_leave_request |
| POST | `/leave/requests/{id}/approve` | Approve | PKG_LEAVE.approve_leave_request |
| POST | `/leave/requests/{id}/reject` | Reject | PKG_LEAVE.reject_leave_request |
| POST | `/leave/requests/{id}/cancel` | Cancel | PKG_LEAVE.cancel_leave_request |
| GET | `/leave/balances` | Get my balances | LEAVE_BALANCE block query |
| GET | `/leave/pending-approvals` | Approvals queue | VW_PENDING_APPROVALS |

### Payroll (`/api/v1/payroll`)

| Method | Path | Description | Legacy Equivalent |
|---|---|---|---|
| GET | `/payroll/periods` | List pay periods | PAY_PERIOD block query |
| POST | `/payroll/runs` | Create payroll run | PKG_PAYROLL.create_payroll_run |
| POST | `/payroll/runs/{id}/calculate` | Calculate | PKG_PAYROLL.calculate_payroll |
| POST | `/payroll/runs/{id}/approve` | Approve | PKG_PAYROLL.approve_payroll |
| POST | `/payroll/runs/{id}/reverse` | Reverse | PKG_PAYROLL.reverse_payroll |
| GET | `/payroll/runs/{id}/details` | Pay details | PAYROLL_DETAIL block query |

### Performance (`/api/v1/performance`)

| Method | Path | Description | Legacy Equivalent |
|---|---|---|---|
| GET | `/performance/cycles` | List review cycles | REVIEW_CYCLE block query |
| GET | `/performance/reviews` | My reviews | PERFORMANCE_REVIEW query |
| POST | `/performance/reviews/{id}/self-assessment` | Submit self | PKG_PERFORMANCE.submit_self_assessment |
| POST | `/performance/reviews/{id}/manager-review` | Manager review | PKG_PERFORMANCE.submit_manager_review |
| GET | `/performance/goals` | My goals | PERFORMANCE_GOAL query |
| POST | `/performance/goals` | Add goal | PKG_PERFORMANCE.add_goal |
| PUT | `/performance/goals/{id}/progress` | Update progress | PKG_PERFORMANCE.update_goal_progress |
