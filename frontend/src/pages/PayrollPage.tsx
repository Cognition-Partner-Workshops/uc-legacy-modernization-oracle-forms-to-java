import { useState, useEffect } from 'react';
import * as api from '../services/api';

interface PayrollRun {
  id: number;
  periodId: string;
  runType: string;
  status: string;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  payDetails: PayDetail[];
}

interface PayDetail {
  empNumber: string;
  empName: string;
  basePay: number;
  federalTax: number;
  stateTax: number;
  ficaTax: number;
  medicareTax: number;
  netPay: number;
}

const PAY_PERIODS: Record<string, string> = {
  '1': 'January 2024',
  '2': 'February 2024',
  '3': 'March 2024',
};

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selected, setSelected] = useState<PayrollRun | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [periodId, setPeriodId] = useState('');
  const [runType, setRunType] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const clearMessages = () => { setSuccess(''); setError(''); };

  const fetchRuns = async () => {
    try {
      const data = await api.getPayrollRuns();
      setRuns(data);
    } catch { setRuns([]); }
  };

  useEffect(() => { fetchRuns(); }, []);

  const handleCreate = async () => {
    clearMessages();
    try {
      const result = await api.createPayrollRun({ periodId, runType });
      setRuns([...runs, result]);
      setSelected(result);
      setShowCreate(false);
      setSuccess('Payroll run created successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCalculate = async () => {
    if (!selected) return;
    clearMessages();
    try {
      const result = await api.calculatePayroll(selected.id);
      setSelected(result);
      setRuns(runs.map((r) => (r.id === result.id ? result : r)));
      setSuccess('Payroll calculated successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    clearMessages();
    try {
      const result = await api.approvePayroll(selected.id);
      setSelected(result);
      setRuns(runs.map((r) => (r.id === result.id ? result : r)));
      setSuccess('Payroll run approved');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─── Detail view ───────────────────────────────────────────────────
  if (selected) {
    const selectedDetail = selected.payDetails?.[0];
    return (
      <div>
        <h2>Payroll Run — {PAY_PERIODS[selected.periodId] || selected.periodId}</h2>

        {success && <div className="success-message" data-testid="success-message">{success}</div>}
        {error && <div className="error-message" data-testid="error-message">{error}</div>}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              Status: <span data-testid="run-status" className={`badge badge-${selected.status.toLowerCase()}`}>
                {selected.status}
              </span>
              {' · '}
              Type: {selected.runType}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={() => { setSelected(null); clearMessages(); }}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleCalculate}>Calculate</button>
              <button className="btn btn-success" onClick={handleApprove}>Approve</button>
              <button className="btn btn-danger">Reverse</button>
            </div>
          </div>

          <div className="pay-summary">
            <div className="summary-item">
              <div className="summary-label">Employee Count</div>
              <div className="summary-value" data-testid="employee-count">{selected.employeeCount}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Gross</div>
              <div className="summary-value" data-testid="total-gross">{fmt(selected.totalGross)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Net</div>
              <div className="summary-value" data-testid="total-net">{fmt(selected.totalNet)}</div>
            </div>
          </div>
        </div>

        {selectedDetail && (
          <div className="card">
            <h3>Employee Pay Breakdown</h3>
            <div className="pay-summary">
              <div className="summary-item">
                <div className="summary-label">Base Pay</div>
                <div className="summary-value" data-testid="base-pay">{fmt(selectedDetail.basePay)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Federal Tax</div>
                <div className="summary-value" data-testid="federal-tax">{fmt(selectedDetail.federalTax)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">State Tax</div>
                <div className="summary-value" data-testid="state-tax">{fmt(selectedDetail.stateTax)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">FICA Tax</div>
                <div className="summary-value" data-testid="fica-tax">{fmt(selectedDetail.ficaTax)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Medicare Tax</div>
                <div className="summary-value" data-testid="medicare-tax">{fmt(selectedDetail.medicareTax)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Net Pay</div>
                <div className="summary-value" data-testid="net-pay">{fmt(selectedDetail.netPay)}</div>
              </div>
            </div>
          </div>
        )}

        {selected.payDetails?.length > 0 && (
          <table data-testid="pay-details-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base Pay</th>
                <th>Federal Tax</th>
                <th>State Tax</th>
                <th>FICA</th>
                <th>Medicare</th>
                <th>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {selected.payDetails.map((pd) => (
                <tr key={pd.empNumber} onClick={() => {}}>
                  <td>{pd.empName}</td>
                  <td>{fmt(pd.basePay)}</td>
                  <td>{fmt(pd.federalTax)}</td>
                  <td>{fmt(pd.stateTax)}</td>
                  <td>{fmt(pd.ficaTax)}</td>
                  <td>{fmt(pd.medicareTax)}</td>
                  <td>{fmt(pd.netPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // ─── List view ─────────────────────────────────────────────────────
  return (
    <div>
      <h2>Payroll</h2>

      {success && <div className="success-message" data-testid="success-message">{success}</div>}
      {error && <div className="error-message" data-testid="error-message">{error}</div>}

      <div className="toolbar">
        <button className="btn btn-success" onClick={() => { clearMessages(); setShowCreate(true); }}>
          Create Run
        </button>
      </div>

      {showCreate && (
        <div className="card">
          <h3>New Payroll Run</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="payPeriod">Pay Period</label>
              <select id="payPeriod" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
                <option value="">-- Select --</option>
                {Object.entries(PAY_PERIODS).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="runType">Run Type</label>
              <select id="runType" value={runType} onChange={(e) => setRunType(e.target.value)}>
                <option value="">-- Select --</option>
                <option value="REGULAR">REGULAR</option>
                <option value="BONUS">BONUS</option>
                <option value="CORRECTION">CORRECTION</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleCreate}>Submit</button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table data-testid="payroll-runs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Period</th>
            <th>Type</th>
            <th>Employees</th>
            <th>Total Gross</th>
            <th>Total Net</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} onClick={() => { clearMessages(); setSelected(run); }}>
              <td>{run.id}</td>
              <td>{PAY_PERIODS[run.periodId] || run.periodId}</td>
              <td>{run.runType}</td>
              <td>{run.employeeCount}</td>
              <td>{fmt(run.totalGross)}</td>
              <td>{fmt(run.totalNet)}</td>
              <td><span className={`badge badge-${run.status.toLowerCase()}`}>{run.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
