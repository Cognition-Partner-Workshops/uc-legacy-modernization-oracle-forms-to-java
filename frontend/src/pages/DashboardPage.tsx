import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Welcome, {user?.name}</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        HRMS Dashboard — Overview of your HR operations
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">24</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">3</div>
          <div className="stat-label">Pending Leave Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">1</div>
          <div className="stat-label">Active Payroll Runs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">5</div>
          <div className="stat-label">Performance Reviews Due</div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Activity</h3>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Employee</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Leave Request</td>
              <td>Jessica Nguyen</td>
              <td>2024-08-10</td>
              <td><span className="badge badge-pending">PENDING</span></td>
            </tr>
            <tr>
              <td>New Hire</td>
              <td>Michael Chen</td>
              <td>2024-08-09</td>
              <td><span className="badge badge-active">ACTIVE</span></td>
            </tr>
            <tr>
              <td>Payroll Run</td>
              <td>All Employees</td>
              <td>2024-08-01</td>
              <td><span className="badge badge-approved">APPROVED</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
