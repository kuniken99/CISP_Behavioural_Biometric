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
    <>
      {/* Metrics Grid - 6 cards in 3x2 layout */}
      {metrics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
          {/* Uptime Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={uptimeIcon} alt="Uptime" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Uptime</span>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#16a34a', 
                backgroundColor: '#dcfce7', 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                SUCCESS
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              {metrics.uptime || '12 days, 3 hours'}
            </div>
          </div>

          {/* CPU Usage Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={cpuIcon} alt="CPU Usage" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>CPU Usage</span>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#16a34a', 
                backgroundColor: '#dcfce7', 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                SUCCESS
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              {metrics.cpuUsage || '21'}%
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Usage</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{metrics.cpuUsage || '21'}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px' }}>
                <div style={{ 
                  width: `${metrics.cpuUsage || 21}%`, 
                  height: '100%', 
                  backgroundColor: '#374151', 
                  borderRadius: '3px' 
                }}></div>
              </div>
            </div>
          </div>

          {/* Memory Usage Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={memoryIcon} alt="Memory Usage" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Memory Usage</span>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#f59e0b', 
                backgroundColor: '#fef3c7', 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                WARNING
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              {metrics.memoryUsage || '1610'} MB
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Usage</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>45%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px' }}>
                <div style={{ 
                  width: '45%', 
                  height: '100%', 
                  backgroundColor: '#374151', 
                  borderRadius: '3px' 
                }}></div>
              </div>
            </div>
          </div>

          {/* Database Size Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={dbEntryManagementIcon} alt="Database Size" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Database Size</span>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#3b82f6', 
                backgroundColor: '#dbeafe', 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                INFO
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
              {metrics.databaseSize || '381'} GB
            </div>
          </div>

          {/* Active Users Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={userManagementIcon} alt="Active Users" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Active Users</span>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#16a34a', 
                backgroundColor: '#dcfce7', 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                SUCCESS
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
              {metrics.activeUsers || '6'}
            </div>
          </div>

          {/* Transactions/Sec Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={transactionsIcon} alt="Transactions/Sec" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Transactions/Sec</span>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#16a34a', 
                backgroundColor: '#dcfce7', 
                padding: '2px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                SUCCESS
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#16a34a', borderRadius: '50%', marginRight: '12px' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '16px', color: '#374151' }}>Database backup completed</span>
              </div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>2 min ago</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', marginRight: '12px' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '16px', color: '#374151' }}>User logged in: admin@example.com</span>
              </div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>5 min ago</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '12px' }}></div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '16px', color: '#374151' }}>High memory usage detected</span>
              </div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>12 min ago</span>
            </div>
          </div>
        </div>
        
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
            System Health
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>Database Connections</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {metrics.systemHealth?.databaseConnections || '45/100'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>Disk Space</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {metrics.systemHealth?.diskSpace || '2.1TB free'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>Network Latency</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {metrics.systemHealth?.networkLatency || '12ms'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>Error Rate</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
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