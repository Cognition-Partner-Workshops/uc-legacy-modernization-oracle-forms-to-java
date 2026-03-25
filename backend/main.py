"""
HRMS Backend — FastAPI mock server for Playwright E2E testing.
Provides REST endpoints matching the HRMS modernized application API design.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
import uuid

app = FastAPI(title="HRMS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory data stores ────────────────────────────────────────────────────

USERS = {
    "james.richardson@company.com": {
        "password": "test_password_123",
        "name": "James Richardson",
        "role": "ADMIN",
        "token": None,
    },
    "sarah.manager@company.com": {
        "password": "manager_pass_123",
        "name": "Sarah Manager",
        "role": "MANAGER",
        "token": None,
    },
    "john.employee@company.com": {
        "password": "employee_pass_123",
        "name": "John Employee",
        "role": "EMPLOYEE",
        "token": None,
    },
}

employee_counter = 1000

def _make_emp(num, first, last, email, hire, dept, job, mgr, loc, etype, gender, salary, status="ACTIVE"):
    return {
        "empNumber": num, "firstName": first, "lastName": last,
        "email": email, "hireDate": hire, "departmentId": dept,
        "jobTitle": job, "managerId": mgr, "locationId": loc,
        "employmentType": etype, "gender": gender, "salary": salary,
        "status": status, "activeFlag": "Y" if status == "ACTIVE" else "N",
    }

# Seed employees: Richardson, Nguyen, and TESTSMITH (needed by parallel tests)
EMPLOYEES: dict[str, dict] = {
    "EMP-0001": _make_emp("EMP-0001", "JAMES", "RICHARDSON",
        "james.richardson@company.com", "2020-01-15", "30",
        "HR Director", None, "1", "FULL_TIME", "M", 120000),
    "EMP-0002": _make_emp("EMP-0002", "JESSICA", "NGUYEN",
        "jessica.nguyen@company.com", "2021-03-01", "31",
        "Software Engineer", "EMP-0001", "1", "FULL_TIME", "F", 95000),
    "EMP-0003": _make_emp("EMP-0003", "JANE", "TESTSMITH",
        "jane.testsmith@company.com", "2024-06-01", "31",
        "Software Engineer", "EMP-0001", "CHI", "FULL_TIME", "F", 75000),
    "EMP-0004": _make_emp("EMP-0004", "DAVID", "MARTINEZ",
        "david.martinez@company.com", "2022-06-15", "32",
        "Marketing Manager", "EMP-0001", "1", "FULL_TIME", "M", 88000),
    "EMP-0005": _make_emp("EMP-0005", "EMILY", "WILLIAMS",
        "emily.williams@company.com", "2023-02-01", "33",
        "Financial Analyst", "EMP-0001", "1", "FULL_TIME", "F", 78000),
    "EMP-0006": _make_emp("EMP-0006", "ROBERT", "BROWN",
        "robert.brown@company.com", "2019-11-01", "34",
        "Operations Lead", "EMP-0001", "NYC", "FULL_TIME", "M", 92000,
        status="TERMINATED"),
}

# Seed leave requests so "display in list" and "approve" tests work in parallel
LEAVE_REQUESTS: list[dict] = [
    {
        "id": 1,
        "employeeId": "EMP-0002",
        "leaveType": "PTO",
        "startDate": "2024-07-01",
        "endDate": "2024-07-05",
        "halfDay": False,
        "reason": "Family vacation",
        "status": "PENDING",
        "totalDays": 5,
    },
]
leave_counter = 1

# Seed payroll runs so calculate/detail/approve/validation tests work in parallel
_seed_active = [e for e in [
    _make_emp("EMP-0001", "JAMES", "RICHARDSON", "", "", "30", "", None, "1", "", "M", 120000),
    _make_emp("EMP-0002", "JESSICA", "NGUYEN", "", "", "31", "", None, "1", "", "F", 95000),
    _make_emp("EMP-0003", "JANE", "TESTSMITH", "", "", "31", "", None, "1", "", "F", 75000),
    _make_emp("EMP-0004", "DAVID", "MARTINEZ", "", "", "32", "", None, "1", "", "M", 88000),
    _make_emp("EMP-0005", "EMILY", "WILLIAMS", "", "", "33", "", None, "1", "", "F", 78000),
]]

def _build_pay_details(emps):
    details = []
    tg = tn = 0
    for e in emps:
        ms = e["salary"] / 12
        ft = ms * 0.22; st = ms * 0.05; fi = ms * 0.062; mc = ms * 0.0145
        net = ms - ft - st - fi - mc
        details.append({
            "empNumber": e["empNumber"],
            "empName": f"{e['firstName'].title()} {e['lastName'].title()}",
            "basePay": round(ms, 2), "federalTax": round(ft, 2),
            "stateTax": round(st, 2), "ficaTax": round(fi, 2),
            "medicareTax": round(mc, 2), "netPay": round(net, 2),
        })
        tg += ms; tn += net
    return details, round(tg, 2), round(tn, 2)

_seed_details, _seed_gross, _seed_net = _build_pay_details(_seed_active)

PAYROLL_RUNS: list[dict] = [
    {
        "id": 1,
        "periodId": "1",
        "runType": "REGULAR",
        "status": "CALCULATED",
        "employeeCount": len(_seed_active),
        "totalGross": _seed_gross,
        "totalNet": _seed_net,
        "payDetails": _seed_details,
    },
]
payroll_counter = 1

TOKENS: dict[str, str] = {}  # token -> email


# ─── Models ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    name: str
    role: str


class EmployeeCreate(BaseModel):
    firstName: str
    lastName: str
    email: str
    hireDate: str
    departmentId: str
    jobTitle: str
    managerId: Optional[str] = None
    locationId: Optional[str] = "1"
    employmentType: Optional[str] = "FULL_TIME"
    gender: Optional[str] = None
    salary: float


class TransferRequest(BaseModel):
    newDeptId: str
    effectiveDate: str
    reason: str


class TerminateRequest(BaseModel):
    terminationDate: str
    reason: str
    notes: Optional[str] = None


class LeaveRequestCreate(BaseModel):
    employeeId: str
    leaveType: str
    startDate: str
    endDate: str
    halfDay: Optional[bool] = False
    reason: str


class PayrollRunCreate(BaseModel):
    periodId: str
    runType: str


# ─── Auth helpers ─────────────────────────────────────────────────────────────

def get_current_user(token: str = "") -> str:
    """Validate token and return email. Simplified for testing."""
    if token in TOKENS:
        return TOKENS[token]
    return "james.richardson@company.com"  # Default for testing


# ─── Auth endpoints ──────────────────────────────────────────────────────────

@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user = USERS.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = str(uuid.uuid4())
    TOKENS[token] = req.email
    user["token"] = token
    return LoginResponse(token=token, name=user["name"], role=user["role"])


@app.post("/api/v1/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}


# ─── Employee endpoints ──────────────────────────────────────────────────────

@app.get("/api/v1/employees")
async def list_employees(search: Optional[str] = None, status: Optional[str] = None):
    results = list(EMPLOYEES.values())
    if search:
        search_upper = search.upper()
        results = [
            e for e in results
            if search_upper in e["firstName"].upper()
            or search_upper in e["lastName"].upper()
            or search_upper in e["email"].upper()
        ]
    if status:
        results = [e for e in results if e["status"] == status]
    return results


@app.post("/api/v1/employees", status_code=201)
async def create_employee(emp: EmployeeCreate):
    global employee_counter
    # Validation
    if not emp.firstName:
        raise HTTPException(status_code=400, detail="First name is required")
    if emp.email and "@" not in emp.email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    if emp.salary < 0:
        raise HTTPException(status_code=400, detail="Salary must be positive")

    # Deduplicate: if employee with same firstName+lastName exists, update it
    fn_upper = emp.firstName.upper()
    ln_upper = emp.lastName.upper()
    for existing in EMPLOYEES.values():
        if existing["firstName"] == fn_upper and existing["lastName"] == ln_upper:
            existing["email"] = emp.email
            existing["hireDate"] = emp.hireDate
            existing["departmentId"] = emp.departmentId
            existing["jobTitle"] = emp.jobTitle
            existing["managerId"] = emp.managerId
            existing["locationId"] = emp.locationId
            existing["employmentType"] = emp.employmentType
            existing["gender"] = emp.gender
            existing["salary"] = emp.salary
            existing["status"] = "ACTIVE"
            existing["activeFlag"] = "Y"
            return existing

    employee_counter += 1
    emp_number = f"EMP-{employee_counter:04d}"
    employee = {
        "empNumber": emp_number,
        "firstName": fn_upper,
        "lastName": ln_upper,
        "email": emp.email,
        "hireDate": emp.hireDate,
        "departmentId": emp.departmentId,
        "jobTitle": emp.jobTitle,
        "managerId": emp.managerId,
        "locationId": emp.locationId,
        "employmentType": emp.employmentType,
        "gender": emp.gender,
        "salary": emp.salary,
        "status": "ACTIVE",
        "activeFlag": "Y",
    }
    EMPLOYEES[emp_number] = employee
    return employee


@app.get("/api/v1/employees/{emp_id}")
async def get_employee(emp_id: str):
    emp = EMPLOYEES.get(emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@app.post("/api/v1/employees/{emp_id}/transfer")
async def transfer_employee(emp_id: str, req: TransferRequest):
    emp = EMPLOYEES.get(emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp["departmentId"] = req.newDeptId
    return {"message": "Employee transferred successfully", "employee": emp}


@app.post("/api/v1/employees/{emp_id}/terminate")
async def terminate_employee(emp_id: str, req: TerminateRequest):
    emp = EMPLOYEES.get(emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp["status"] = "TERMINATED"
    emp["activeFlag"] = "N"
    return {"message": "Employee terminated successfully", "employee": emp}


# ─── Leave endpoints ─────────────────────────────────────────────────────────

@app.get("/api/v1/leave/requests")
async def list_leave_requests():
    return LEAVE_REQUESTS


@app.post("/api/v1/leave/requests", status_code=201)
async def create_leave_request(req: LeaveRequestCreate):
    global leave_counter
    if not req.leaveType or not req.startDate or not req.endDate or not req.reason:
        raise HTTPException(status_code=400, detail="All fields are required")
    start = datetime.strptime(req.startDate, "%Y-%m-%d")
    end = datetime.strptime(req.endDate, "%Y-%m-%d")
    if end < start:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")

    days = (end - start).days + 1
    if req.halfDay:
        days = days * 0.5

    leave_counter += 1
    leave_request = {
        "id": leave_counter,
        "employeeId": req.employeeId,
        "leaveType": req.leaveType,
        "startDate": req.startDate,
        "endDate": req.endDate,
        "halfDay": req.halfDay,
        "reason": req.reason,
        "status": "PENDING",
        "totalDays": days,
    }
    LEAVE_REQUESTS.append(leave_request)
    return leave_request


@app.post("/api/v1/leave/requests/{request_id}/approve")
async def approve_leave(request_id: int):
    for lr in LEAVE_REQUESTS:
        if lr["id"] == request_id:
            lr["status"] = "APPROVED"
            return {"message": "Leave request approved", "request": lr}
    raise HTTPException(status_code=404, detail="Leave request not found")


@app.post("/api/v1/leave/requests/{request_id}/cancel")
async def cancel_leave(request_id: int):
    for lr in LEAVE_REQUESTS:
        if lr["id"] == request_id:
            lr["status"] = "CANCELLED"
            return {"message": "Leave request cancelled", "request": lr}
    raise HTTPException(status_code=404, detail="Leave request not found")


@app.get("/api/v1/leave/balances")
async def get_leave_balances():
    return [
        {"leaveType": "PTO", "balance": 15, "used": 5, "total": 20},
        {"leaveType": "Sick Leave", "balance": 8, "used": 2, "total": 10},
        {"leaveType": "Personal", "balance": 3, "used": 0, "total": 3},
    ]


# ─── Payroll endpoints ───────────────────────────────────────────────────────

@app.get("/api/v1/payroll/runs")
async def list_payroll_runs():
    return PAYROLL_RUNS


@app.post("/api/v1/payroll/runs", status_code=201)
async def create_payroll_run(req: PayrollRunCreate):
    global payroll_counter
    payroll_counter += 1
    run = {
        "id": payroll_counter,
        "periodId": req.periodId,
        "runType": req.runType,
        "status": "PENDING",
        "employeeCount": 0,
        "totalGross": 0,
        "totalNet": 0,
        "payDetails": [],
    }
    PAYROLL_RUNS.append(run)
    return run


@app.post("/api/v1/payroll/runs/{run_id}/calculate")
async def calculate_payroll(run_id: int):
    for run in PAYROLL_RUNS:
        if run["id"] == run_id:
            # Simulate payroll calculation for all active employees
            active_emps = [e for e in EMPLOYEES.values() if e["status"] == "ACTIVE"]
            pay_details = []
            total_gross = 0
            total_net = 0
            for emp in active_emps:
                monthly_salary = emp["salary"] / 12
                federal_tax = monthly_salary * 0.22
                state_tax = monthly_salary * 0.05
                fica_tax = monthly_salary * 0.062
                medicare_tax = monthly_salary * 0.0145
                total_deductions = federal_tax + state_tax + fica_tax + medicare_tax
                net = monthly_salary - total_deductions
                pay_details.append({
                    "empNumber": emp["empNumber"],
                    "empName": f"{emp['firstName'].title()} {emp['lastName'].title()}",
                    "basePay": round(monthly_salary, 2),
                    "federalTax": round(federal_tax, 2),
                    "stateTax": round(state_tax, 2),
                    "ficaTax": round(fica_tax, 2),
                    "medicareTax": round(medicare_tax, 2),
                    "netPay": round(net, 2),
                })
                total_gross += monthly_salary
                total_net += net

            run["status"] = "CALCULATED"
            run["employeeCount"] = len(active_emps)
            run["totalGross"] = round(total_gross, 2)
            run["totalNet"] = round(total_net, 2)
            run["payDetails"] = pay_details
            return run
    raise HTTPException(status_code=404, detail="Payroll run not found")


@app.post("/api/v1/payroll/runs/{run_id}/approve")
async def approve_payroll(run_id: int):
    for run in PAYROLL_RUNS:
        if run["id"] == run_id:
            run["status"] = "APPROVED"
            return run
    raise HTTPException(status_code=404, detail="Payroll run not found")


# ─── Performance endpoints ───────────────────────────────────────────────────

@app.get("/api/v1/performance/cycles")
async def list_cycles():
    return [
        {"id": 1, "name": "2024 Annual Review", "status": "ACTIVE", "startDate": "2024-01-01", "endDate": "2024-12-31"},
    ]


@app.get("/api/v1/performance/reviews")
async def list_reviews():
    return []


@app.post("/api/v1/performance/reviews")
async def submit_review(data: dict):
    return {"message": "Review submitted", **data}


@app.get("/api/v1/performance/goals")
async def list_goals():
    return []


@app.post("/api/v1/performance/goals")
async def add_goal(data: dict):
    return {"message": "Goal added", "id": 1, **data}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
