import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import dashboardIcon from '../assets/dashboard-icon.svg';
import uptimeIcon from '../assets/uptime-icon.svg';
import cpuIcon from '../assets/cpu-icon.svg';
import memoryIcon from '../assets/memory-icon.svg';
import transactionsIcon from '../assets/transactions-icon.svg';
import activityLogsIcon from '../assets/activity-logs-icon.svg';
import userManagementIcon from '../assets/user-management-icon.svg';
import dbEntryManagementIcon from '../assets/db-entry-management-icon.svg';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Dashboard/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        // Handle session expiration
        if (response.status === 401) {
          const data = await response.json();
          if (data.sessionExpired) {
            // Session expired, let SessionManager handle logout
            return;
          }
        }
        
        const data = await response.json();
        if (response.ok) {
          setMetrics(data);
        } else {
          setError(data.message || 'Failed to fetch dashboard metrics.');
        }
      } catch (err) {
        // Only show error if it's not a session timeout issue
        const token = localStorage.getItem('jwt_token');
        if (token) {
          setError('Network error fetching dashboard metrics.');
        }
        // If no token, user is being logged out, don't show error
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      {/* Responsive Metrics Grid */}
      {metrics ? (
        <div className="dashboard-metrics-grid">
          {/* Uptime Card */}
          <div className="card metric-card">
            <div className="metric-header">
              <div className="metric-title">
                <img src={uptimeIcon} alt="Uptime" className="metric-icon" />
                <span>Uptime</span>
              </div>
              <span className="status-badge success">SUCCESS</span>
            </div>
            <div className="metric-value">
              {metrics.uptime || '12 days, 3 hours'}
            </div>
          </div>

          {/* CPU Usage Card */}
          <div className="card metric-card">
            <div className="metric-header">
              <div className="metric-title">
                <img src={cpuIcon} alt="CPU Usage" className="metric-icon" />
                <span>CPU Usage</span>
              </div>
              <span className="status-badge success">SUCCESS</span>
            </div>
            <div className="metric-value">
              {metrics.cpuUsage || '21'}%
            </div>
            <div className="metric-progress">
              <div className="progress-header">
                <span>Usage</span>
                <span>{metrics.cpuUsage || '21'}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ 
                  width: `${metrics.cpuUsage || 21}%`, 
                  height: '100%', 
                  backgroundColor: '#374151', 
                  borderRadius: '3px' 
                }}></div>
              </div>
            </div>
          </div>

          {/* Memory Usage Card */}
          <div className="card metric-card">
            <div className="metric-header">
              <div className="metric-title">
                <img src={memoryIcon} alt="Memory Usage" className="metric-icon" />
                <span>Memory Usage</span>
              </div>
              <span className="status-badge warning">WARNING</span>
            </div>
            <div className="metric-value">
              {metrics.memoryUsage || '1610'} MB
            </div>
            <div className="metric-progress">
              <div className="progress-header">
                <span>Usage</span>
                <span>45%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ 
                  width: '45%', 
                  backgroundColor: '#f59e0b' 
                }}></div>
              </div>
            </div>
          </div>

          {/* Database Size Card */}
          <div className="card metric-card">
            <div className="metric-header">
              <div className="metric-title">
                <img src={dbEntryManagementIcon} alt="Database Size" className="metric-icon" />
                <span>Database Size</span>
              </div>
              <span className="status-badge info">INFO</span>
            </div>
            <div className="metric-value">
              {metrics.databaseSize || '381'} GB
            </div>
          </div>

          {/* Active Users Card */}
          <div className="card metric-card">
            <div className="metric-header">
              <div className="metric-title">
                <img src={userManagementIcon} alt="Active Users" className="metric-icon" />
                <span>Active Users</span>
              </div>
              <span className="status-badge success">SUCCESS</span>
            </div>
            <div className="metric-value">
              {metrics.activeUsers || '6'}
            </div>
          </div>

          {/* Transactions/Sec Card */}
          <div className="card metric-card">
            <div className="metric-header">
              <div className="metric-title">
                <img src={transactionsIcon} alt="Transactions/Sec" className="metric-icon" />
                <span>Transactions/Sec</span>
              </div>
              <span className="status-badge success">SUCCESS</span>
            </div>
            <div className="metric-value">
              {metrics.transactionsPerSecond || '790'}
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <p>No metrics available.</p>
        </div>
      )}
      
      {/* Bottom Section - Recent Activity and System Health */}
      <div className="dashboard-bottom-section">
        <div className="card activity-card">
          <h3 className="section-title">
            Recent Activity
          </h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-indicator successs"></div>
              <div className="activity-content">
                <span>Database backup completed</span>
              </div>
              <span className="activity-time">2 min ago</span>
            </div>
            <div className="activity-item">
              <div className="activity-indicator info"></div>
              <div className="activity-content">
                <span>User logged in: admin@example.com</span>
              </div>
              <span className="activity-time">5 min ago</span>
            </div>
            <div className="activity-item">
              <div className="activity-indicator warning"></div>
              <div className="activity-content">
                <span>High memory usage detected</span>
              </div>
              <span className="activity-time">12 min ago</span>
            </div>
          </div>
        </div>
        
        <div className="card health-card">
          <h3 className="section-title">
            System Health
          </h3>
          <div className="health-list">
            <div className="health-item">
              <span className="health-label">Database Connections</span>
              <span className="health-value">
                {metrics.systemHealth?.databaseConnections || '45/100'}
              </span>
            </div>
            <div className="health-item">
              <span className="health-label">Disk Space</span>
              <span className="health-value">
                {metrics.systemHealth?.diskSpace || '2.1TB free'}
              </span>
            </div>
            <div className="health-item">
              <span className="health-label">Network Latency</span>
              <span className="health-value">
                {metrics.systemHealth?.networkLatency || '12ms'}
              </span>
            </div>
            <div className="health-item">
              <span className="health-label">Error Rate</span>
              <span className="health-value">
                {metrics.systemHealth?.errorRate || '0.01%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;