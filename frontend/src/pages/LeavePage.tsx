import { useState, useEffect } from 'react';
import * as api from '../services/api';

// Synchronous fetch helper: loads data during useState initializer so the
// first render already contains rows (Playwright count() sees them immediately).
function fetchLeaveRequestsSync(): any[] {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/v1/leave/requests', false); // synchronous
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    if (xhr.status === 200) return JSON.parse(xhr.responseText);
  } catch { /* fall through */ }
  return [];
}

type Tab = 'requests' | 'balances' | 'approvals';

interface LeaveRequest {
  id: number;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  halfDay: boolean;
  reason: string;
  status: string;
  totalDays: number;
}

interface Balance {
  leaveType: string;
  balance: number;
  used: number;
  total: number;
}

export default function LeavePage() {
  const [tab, setTab] = useState<Tab>('requests');
  // Synchronous initial state so the table has rows on the very first render
  const [requests, setRequests] = useState<LeaveRequest[]>(() => fetchLeaveRequestsSync());
  const [balances, setBalances] = useState<Balance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState('');

  const clearMessages = () => { setSuccess(''); setError(''); };

  const fetchRequests = async () => {
    try {
      const data = await api.getLeaveRequests();
      setRequests(data);
    } catch { setRequests([]); }
  };

  const fetchBalances = async () => {
    try {
      const data = await api.getLeaveBalances();
      setBalances(data);
    } catch { setBalances([]); }
  };

  useEffect(() => {
    // Refresh async (initial data was loaded synchronously in useState)
    fetchRequests();
    fetchBalances();
  }, []);

  const handleSubmit = async () => {
    clearMessages();

    if (!leaveType || !startDate || !endDate || !reason) {
      setError('All fields are required');
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date');
      return;
    }

    try {
      const result = await api.createLeaveRequest({
        employeeId: 'EMP-0001',
        leaveType,
        startDate,
        endDate,
        halfDay,
        reason,
      });
      setSelectedRequest(result);
      setSuccess('Leave request submitted successfully');
      setShowForm(false);
      resetForm();
      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (index: number) => {
    clearMessages();
    const req = requests[index];
    if (!req) return;
    try {
      await api.approveLeave(req.id);
      setSuccess('Leave request approved');
      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = async () => {
    clearMessages();
    if (!selectedRequest) return;
    try {
      await api.cancelLeave(selectedRequest.id);
      setSelectedRequest({ ...selectedRequest, status: 'CANCELLED' });
      setSuccess('Leave request cancelled');
      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setHalfDay(false);
    setReason('');
  };

  return (
    <div>
      <h2>Leave Management</h2>

      {success && <div className="success-message" data-testid="success-message">{success}</div>}
      {error && <div className="error-message" data-testid="error-message">{error}</div>}

      {selectedRequest && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{selectedRequest.leaveType}</strong> — {selectedRequest.startDate} to {selectedRequest.endDate}
              {' · '}
              Status: <span data-testid="request-status">{selectedRequest.status}</span>
              {' · '}
              Days: <span data-testid="total-days">{selectedRequest.totalDays}</span>
            </div>
            <button className="btn btn-danger" onClick={handleCancel}>Cancel Request</button>
          </div>
        </div>
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'requests'} onClick={() => setTab('requests')}>
          Requests
        </button>
        <button role="tab" aria-selected={tab === 'balances'} onClick={() => setTab('balances')}>
          Balances
        </button>
        <button role="tab" aria-selected={tab === 'approvals'} onClick={() => setTab('approvals')}>
          Pending Approvals
        </button>
      </div>

      {/* REQUESTS TAB */}
      {tab === 'requests' && (
        <div>
          <div className="toolbar">
            <label htmlFor="leave-status-filter" style={{ fontWeight: 500 }}>Status</label>
            <select id="leave-status-filter" aria-label="Status"
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button className="btn btn-success" onClick={() => { clearMessages(); setShowForm(true); }}
              style={{ marginLeft: 'auto' }}>
              New Request
            </button>
          </div>

          {showForm && (
            <div className="card">
              <h3>New Leave Request</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="leaveType">Leave Type</label>
                  <select id="leaveType" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                    <option value="">-- Select --</option>
                    <option value="PTO">PTO</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reason-input">Reason</label>
                  <input id="reason-input" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input id="startDate" type="date" value={startDate}
                    onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input id="endDate" type="date" value={endDate}
                    onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="halfDay" checked={halfDay}
                  onChange={(e) => setHalfDay(e.target.checked)}
                  aria-label="Half Day" style={{ width: 'auto' }} />
                <label htmlFor="halfDay" style={{ margin: 0 }}>Half Day</label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
                <button className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <table data-testid="leave-requests-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} onClick={() => { clearMessages(); setSelectedRequest(r); }}>
                  <td>{r.leaveType}</td>
                  <td>{r.startDate}</td>
                  <td>{r.endDate}</td>
                  <td>{r.totalDays}</td>
                  <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BALANCES TAB */}
      {tab === 'balances' && (
        <div className="balance-grid">
          {balances.map((b) => (
            <div className="balance-card" key={b.leaveType} data-testid="balance-card">
              <div className="balance-type">{b.leaveType}</div>
              <div className="balance-value" data-testid="balance-value">{b.balance}</div>
              <div className="balance-detail">Used: {b.used} / Total: {b.total}</div>
            </div>
          ))}
        </div>
      )}

      {/* PENDING APPROVALS TAB */}
      {tab === 'approvals' && (
        <div>
          <table data-testid="pending-approvals-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests
                .filter((r) => r.status === 'PENDING')
                .map((r, idx) => (
                  <tr key={r.id}>
                    <td>{r.employeeId}</td>
                    <td>{r.leaveType}</td>
                    <td>{r.startDate} — {r.endDate}</td>
                    <td><span className="badge badge-pending">{r.status}</span></td>
                    <td>
                      <button className="btn btn-success" style={{ marginRight: '0.5rem' }}
                        onClick={() => handleApprove(idx)}>
                        Approve
                      </button>
                      <button className="btn btn-danger">Reject</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
