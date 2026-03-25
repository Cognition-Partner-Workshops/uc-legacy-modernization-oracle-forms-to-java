import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../services/api';

type ViewMode = 'list' | 'create' | 'detail';

interface Employee {
  empNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  hireDate: string;
  departmentId: string;
  jobTitle: string;
  managerId: string | null;
  locationId: string;
  employmentType: string;
  gender: string | null;
  salary: number;
  status: string;
  activeFlag: string;
}

const DEPARTMENTS: Record<string, string> = {
  '30': 'Human Resources',
  '31': 'Engineering',
  '32': 'Marketing',
  '33': 'Finance',
  '34': 'Operations',
};

const JOB_TITLES: Record<string, string> = {
  '50': 'Software Engineer',
  '51': 'Senior Engineer',
  '52': 'HR Specialist',
  '53': 'Marketing Manager',
  '54': 'Financial Analyst',
};

const TERMINATION_REASONS = ['VOLUNTARY', 'INVOLUNTARY', 'RETIREMENT', 'LAYOFF', 'OTHER'];

export default function EmployeesPage() {
  const [searchParams] = useSearchParams();
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState('');

  // Transfer dialog state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferDept, setTransferDept] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Terminate dialog state
  const [showTerminate, setShowTerminate] = useState(false);
  const [termDate, setTermDate] = useState('');
  const [termReason, setTermReason] = useState('');
  const [termNotes, setTermNotes] = useState('');

  // Create form state
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', hireDate: '',
    departmentId: '31', jobTitle: '50', managerId: '',
    locationId: '1', employmentType: 'FULL_TIME', gender: '', salary: '',
  });

  const clearMessages = () => { setSuccess(''); setErrors(''); };

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await api.getEmployees({});
      setAllEmployees(data);
    } catch {
      setAllEmployees([]);
    }
  }, []);

  useEffect(() => {
    const initial = searchParams.get('search') || undefined;
    if (initial) setSearchTerm(initial);
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reactive client-side filtering so table updates synchronously with searchTerm
  const employees = allEmployees.filter((e) => {
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      if (!e.firstName.toUpperCase().includes(term) &&
          !e.lastName.toUpperCase().includes(term) &&
          !e.email.toUpperCase().includes(term)) {
        return false;
      }
    }
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const handleSearch = () => {
    clearMessages();
    // filtering is reactive via searchTerm state, but also refresh from server
    fetchEmployees();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleCreate = async () => {
    clearMessages();
    const validationErrors: string[] = [];
    if (!form.firstName) validationErrors.push('First name is required');
    if (form.email && !form.email.includes('@')) validationErrors.push('Invalid email format');
    if (Number(form.salary) < 0) validationErrors.push('Salary must be positive');

    if (validationErrors.length > 0) {
      setErrors(validationErrors.join('. '));
      return;
    }

    try {
      const result = await api.createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        hireDate: form.hireDate,
        departmentId: form.departmentId,
        jobTitle: JOB_TITLES[form.jobTitle] || form.jobTitle,
        managerId: form.managerId || null,
        locationId: form.locationId,
        employmentType: form.employmentType,
        gender: form.gender || null,
        salary: Number(form.salary),
      });
      setSelected(result);
      setView('detail');
      setSuccess('Employee created successfully');
      fetchEmployees();
    } catch (err: any) {
      setErrors(err.message);
    }
  };

  const handleTransfer = async () => {
    if (!selected) return;
    clearMessages();
    try {
      await api.transferEmployee(selected.empNumber, {
        newDeptId: transferDept,
        effectiveDate: transferDate,
        reason: transferReason,
      });
      setSuccess('Employee transferred successfully');
      setShowTransfer(false);
      if (selected) {
        selected.departmentId = transferDept;
        setSelected({ ...selected });
      }
    } catch (err: any) {
      setErrors(err.message);
    }
  };

  const handleTerminate = async () => {
    if (!selected) return;
    clearMessages();
    try {
      const result = await api.terminateEmployee(selected.empNumber, {
        terminationDate: termDate,
        reason: termReason,
        notes: termNotes || undefined,
      });
      setSelected({ ...selected, status: 'TERMINATED', activeFlag: 'N' });
      setSuccess('Employee terminated');
      setShowTerminate(false);
      fetchEmployees();
    } catch (err: any) {
      setErrors(err.message);
    }
  };

  const selectEmployee = (emp: Employee) => {
    clearMessages();
    setSelected(emp);
    setView('detail');
  };

  // ─── LIST VIEW ─────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div>
        <h2>Employees</h2>
        <div className="toolbar">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          <label htmlFor="status-filter" style={{ marginLeft: '1rem', fontWeight: 500 }}>Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            aria-label="Status"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
          <label htmlFor="dept-filter" style={{ marginLeft: '1rem', fontWeight: 500 }}>Department</label>
          <select
            id="dept-filter"
            aria-label="Department"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="">All Departments</option>
            {Object.entries(DEPARTMENTS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <button
            className="btn btn-success"
            onClick={() => { clearMessages(); setView('create'); }}
            style={{ marginLeft: 'auto' }}
          >
            Add Employee
          </button>
        </div>

        {success && <div className="success-message" data-testid="success-message">{success}</div>}
        {errors && <div className="validation-errors" data-testid="validation-errors">{errors}</div>}

        <table data-testid="employee-table">
          <thead>
            <tr>
              <th>Emp #</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.empNumber} onClick={() => selectEmployee(emp)}>
                <td>{emp.empNumber}</td>
                <td>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); selectEmployee(emp); }}
                    role="link"
                  >
                    {emp.firstName} {emp.lastName}
                  </a>
                </td>
                <td>{emp.email}</td>
                <td>{DEPARTMENTS[emp.departmentId] || emp.departmentId}</td>
                <td data-testid="status-cell">
                  <span className={`badge badge-${emp.status.toLowerCase()}`}>{emp.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ─── CREATE VIEW ───────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div>
        <h2>Add Employee</h2>
        {errors && <div className="validation-errors" data-testid="validation-errors">{errors}</div>}

        <div className="card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input id="firstName" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input id="lastName" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email-field">Email</label>
              <input id="email-field" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="hireDate">Hire Date</label>
              <input id="hireDate" type="date" value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="workPhone">Work Phone</label>
              <input id="workPhone" type="tel" />
            </div>
            <div className="form-group">
              <label htmlFor="mobilePhone">Mobile Phone</label>
              <input id="mobilePhone" type="tel" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <select id="department" value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                {Object.entries(DEPARTMENTS).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <select id="jobTitle" value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}>
                {Object.entries(JOB_TITLES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="manager">Manager</label>
              <select id="manager" value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                <option value="">-- None --</option>
                <option value="EMP-0001">James Richardson</option>
                <option value="31">EMP-31</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <select id="location" value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
                <option value="1">Headquarters</option>
                <option value="CHI">Chicago</option>
                <option value="NYC">New York</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employmentType">Employment Type</label>
              <select id="employmentType" value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">-- Select --</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="startingSalary">Starting Salary</label>
            <input id="startingSalary" type="number" value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleCreate}>Save</button>
            <button className="btn btn-secondary" onClick={() => { clearMessages(); setView('list'); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DETAIL VIEW ───────────────────────────────────────────────────
  return (
    <div>
      {success && <div className="success-message" data-testid="success-message">{success}</div>}
      {errors && <div className="error-message" data-testid="error-message">{errors}</div>}

      {selected && (
        <>
          <div className="detail-header">
            <div>
              <div className="detail-title">{selected.firstName} {selected.lastName}</div>
              <div style={{ color: '#64748b' }}>
                <span data-testid="emp-number">{selected.empNumber}</span>
                {' · '}
                <span data-testid="employment-status">{selected.status}</span>
                {' · '}
                <span data-testid="active-flag">{selected.activeFlag}</span>
              </div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-outline" onClick={() => { clearMessages(); setView('list'); }}>
                Back
              </button>
              <button className="btn btn-primary" onClick={() => {}}>Edit</button>
              <button className="btn btn-secondary" onClick={() => setShowTransfer(true)}>Transfer</button>
              <button className="btn btn-danger" onClick={() => setShowTerminate(true)}>Terminate</button>
            </div>
          </div>

          <div className="card">
            <div className="detail-grid">
              <div className="detail-field">
                <div className="field-label">Email</div>
                <div className="field-value"><input type="text" readOnly value={selected.email} style={{ border: 'none', background: 'transparent', width: '100%', color: 'inherit', fontSize: 'inherit' }} /></div>
              </div>
              <div className="detail-field">
                <div className="field-label">Hire Date</div>
                <div className="field-value">{selected.hireDate}</div>
              </div>
              <div className="detail-field">
                <div className="field-label">Department</div>
                <div className="field-value">{DEPARTMENTS[selected.departmentId] || selected.departmentId}</div>
              </div>
              <div className="detail-field">
                <div className="field-label">Job Title</div>
                <div className="field-value">{selected.jobTitle}</div>
              </div>
              <div className="detail-field">
                <div className="field-label">Employment Type</div>
                <div className="field-value">{selected.employmentType}</div>
              </div>
              <div className="detail-field">
                <div className="field-label">Salary</div>
                <div className="field-value">${selected.salary?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="tabs" role="tablist">
            <button role="tab" aria-selected="true">Salary History</button>
            <button role="tab" aria-selected="false">Employment History</button>
            <button role="tab" aria-selected="false">Direct Reports</button>
          </div>
          <div className="card">
            <p style={{ color: '#94a3b8' }}>No records to display.</p>
          </div>
        </>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Transfer Employee</h3>
            <div className="form-group">
              <label htmlFor="newDept">New Department</label>
              <select id="newDept" value={transferDept} onChange={(e) => setTransferDept(e.target.value)}>
                <option value="">-- Select --</option>
                {Object.entries(DEPARTMENTS).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="effectiveDate">Effective Date</label>
              <input id="effectiveDate" type="date" value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="transferReason">Reason</label>
              <input id="transferReason" value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowTransfer(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleTransfer}>Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminate && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Terminate Employee</h3>
            <div className="form-group">
              <label htmlFor="terminationDate">Termination Date</label>
              <input id="terminationDate" type="date" value={termDate}
                onChange={(e) => setTermDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="terminationReason">Termination Reason</label>
              <select id="terminationReason" value={termReason}
                onChange={(e) => setTermReason(e.target.value)}>
                <option value="">-- Select --</option>
                {TERMINATION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="terminationNotes">Notes</label>
              <textarea id="terminationNotes" value={termNotes}
                onChange={(e) => setTermNotes(e.target.value)} rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowTerminate(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleTerminate}>Confirm Termination</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
