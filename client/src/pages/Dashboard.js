import React from 'react';
import useDashboardData from '../hooks/useDashboardData';
import { FiUsers, FiBook, FiBookmark, FiTrendingUp } from 'react-icons/fi';
import './Dashboard.css';

function Dashboard() {
  const { stats, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) return null;

  const overview = {
    totalUsers: stats.users || 0,
    totalBookmarks: stats.bookmarks || 0,
    totalThemes: stats.themes || 0,
    totalShloks: stats.shloks || 0,
  };

  const recentUsers = stats.recent || [];

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe' }}>
            <FiUsers size={24} color="#0369a1" />
          </div>
          <div className="stat-content">
            <h3>{overview.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <FiBook size={24} color="#92400e" />
          </div>
          <div className="stat-content">
            <h3>{overview.totalShloks}</h3>
            <p>Total Shloks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ddd6fe' }}>
            <FiBookmark size={24} color="#5b21b6" />
          </div>
          <div className="stat-content">
            <h3>{overview.totalBookmarks}</h3>
            <p>Total Bookmarks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#d1fae5' }}>
            <FiTrendingUp size={24} color="#065f46" />
          </div>
          <div className="stat-content">
            <h3>{overview.totalThemes}</h3>
            <p>Unique Themes</p>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card">
        <h3 className="card-title">Recent Users</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.name || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
