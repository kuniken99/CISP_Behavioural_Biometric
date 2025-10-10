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
        const data = await response.json();
        if (response.ok) {
          setMetrics(data);
        } else {
          setError(data.message || 'Failed to fetch dashboard metrics.');
        }
      } catch (err) {
        setError('Network error fetching dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      {metrics ? (
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="icon">
              <img src={uptimeIcon} alt="Uptime" style={{width: '24px', height: '24px'}}/>
            </div>
            <div className="content">
              <h3>{metrics.uptime}</h3>
              <p>Uptime</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">
              <img src={cpuIcon} alt="CPU Usage" style={{width: '24px', height: '24px'}}/>
            </div>
            <div className="content">
              <h3>{metrics.cpuUsage}%</h3>
              <p>CPU Usage</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">
              <img src={memoryIcon} alt="Memory Usage" style={{width: '24px', height: '24px'}}/>
            </div>
            <div className="content">
              <h3>{metrics.memoryUsage} MB</h3>
              <p>Memory Usage</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">
              <img src={dbEntryManagementIcon} alt="Database Size" style={{width: '24px', height: '24px'}}/>
            </div>
            <div className="content">
              <h3>{metrics.databaseSize} GB</h3>
              <p>Database Size</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">
              <img src={userManagementIcon} alt="Active Users" style={{width: '24px', height: '24px'}}/>
            </div>
            <div className="content">
              <h3>{metrics.activeUsers}</h3>
              <p>Active Users</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">
              <img src={transactionsIcon} alt="Transactions/Sec" style={{width: '24px', height: '24px'}}/>
            </div>
            <div className="content">
              <h3>{metrics.transactionsPerSecond}</h3>
              <p>Transactions/Sec</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No metrics available.</p>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="card">
          <h3>
            <img src={activityLogsIcon} alt="Recent Activity" style={{width: '16px', height: '16px', marginRight: '6px'}}/>
            Recent Activity
          </h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">🟢</span>
              <span className="activity-text">Database backup completed</span>
              <span className="activity-time">2 min ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🔵</span>
              <span className="activity-text">User logged in: admin@example.com</span>
              <span className="activity-time">5 min ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🟡</span>
              <span className="activity-text">High memory usage detected</span>
              <span className="activity-time">12 min ago</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3>💊 System Health</h3>
          <div className="health-metrics">
            <div className="health-item">
              <span>Database Connections</span>
              <span className="health-value">45/100</span>
            </div>
            <div className="health-item">
              <span>Disk Space</span>
              <span className="health-value">2.1TB free</span>
            </div>
            <div className="health-item">
              <span>Network Latency</span>
              <span className="health-value">12ms</span>
            </div>
            <div className="health-item">
              <span>Error Rate</span>
              <span className="health-value">0.01%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;