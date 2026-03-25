import React, { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        navigate(`/employees?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, navigate]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>HRMS</h2>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/employees">Employees</NavLink>
          <NavLink to="/leave">Leave</NavLink>
          <NavLink to="/payroll">Payroll</NavLink>
          <NavLink to="/performance">Performance</NavLink>
        </nav>
        <div className="sidebar-footer">
          <small>{user?.name}</small>
        </div>
      </aside>
      <div className="main-content">
        <header className="top-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <div className="user-area">
            <span data-testid="notification-badge">0</span>
            <div data-testid="user-profile-menu">
              <span>{user?.name}</span>
            </div>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
