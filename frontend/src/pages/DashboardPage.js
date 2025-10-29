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
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [isTraining, setIsTraining] = useState(false);

  // Check if we should show training modal on mount
  useEffect(() => {
    const shouldShowTraining = localStorage.getItem('showTrainingModal');
    if (shouldShowTraining === 'true') {
      localStorage.removeItem('showTrainingModal');
      setShowTrainingModal(true);
      startAutoTraining();
    }
  }, []);

  const startAutoTraining = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/Biometric/start-auto-training`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numSamples: 1000 })
      });

      if (response.ok) {
        setIsTraining(true);
      }
    } catch (err) {
      console.error('Failed to start auto-training:', err);
    }
  };

  // Poll training progress
  useEffect(() => {
    if (!isTraining) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Biometric/training-progress`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const progress = await response.json();
          setTrainingProgress(progress);

          if (progress.percentComplete === 100 || progress.error) {
            setIsTraining(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Failed to fetch training progress:', err);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [isTraining]);

  const closeTrainingModal = () => {
    setShowTrainingModal(false);
    setTrainingProgress(null);
    setIsTraining(false);
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        
        // If no token, user is being logged out
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/Dashboard/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        // Handle session expiration
        if (response.status === 401) {
          try {
            const data = await response.json();
            if (data.sessionExpired) {
              // Session expired, let SessionManager handle logout
              setLoading(false);
              return;
            }
          } catch (e) {
            // JSON parse error, continue to normal error handling
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
  if (!metrics) return null; // Session expired or logging out

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

      {/* Training Progress Modal */}
      {showTrainingModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') {
            if (!isTraining || trainingProgress?.percentComplete === 100) {
              closeTrainingModal();
            }
          }
        }}>
          <div className="modal-content training-modal">
            <div className="modal-header">
              <h2>Setting Up Your Profile</h2>
              {(!isTraining || trainingProgress?.percentComplete === 100) && (
                <button className="modal-close" onClick={closeTrainingModal}>&times;</button>
              )}
            </div>
            <div className="modal-body">
              {trainingProgress?.error ? (
                <div className="error-message">
                  <p>Training failed: {trainingProgress.error}</p>
                  <button className="btn btn-primary" onClick={closeTrainingModal}>
                    Close
                  </button>
                </div>
              ) : trainingProgress?.percentComplete === 100 ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h3>Profile Setup Complete!</h3>
                  <p>Your behavioral biometric profile has been successfully trained.</p>
                  <p className="text-muted">You can now use the system normally.</p>
                  <button className="btn btn-primary" onClick={closeTrainingModal}>
                    Get Started
                  </button>
                </div>
              ) : (
                <div className="training-in-progress">
                  <div className="training-status">
                    <div className="spinner"></div>
                    <h3>{trainingProgress?.status || 'Initializing...'}</h3>
                    <p className="text-muted">
                      {trainingProgress?.completedSamples || 0} / {trainingProgress?.totalSamples || 1000} samples
                    </p>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${trainingProgress?.percentComplete || 0}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">
                    {trainingProgress?.percentComplete || 0}%
                  </div>
                  <p className="training-info">
                    Please wait while we analyze your behavioral patterns...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
