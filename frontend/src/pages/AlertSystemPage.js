import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import AlertSystemIcon from '../assets/alert-system-icon.svg';
import EyeIcon from '../assets/eye-icon.svg';
import AddTaskIcon from '../assets/add-task-icon.svg';
import DropdownIcon from '../assets/dropdown-icon.svg';
import SearchIcon from '../assets/search-icon.svg';
import FilterIcon from '../assets/filter-icon.svg';

const AlertSystemPage = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 'ALT-001',
      timestamp: '8/23/2025, 4:55:00 PM',
      type: 'Security',
      message: 'Failed login attempt for "baduser"',
      severity: 'Medium',
      status: 'Active'
    },
    {
      id: 'ALT-002', 
      timestamp: '8/23/2025, 4:40:00 PM',
      type: 'Performance',
      message: 'High CPU usage detected on primary DB server',
      severity: 'Low',
      status: 'Active'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterSeverity, setFilterSeverity] = useState('All Severities');
  const [filterStatus, setFilterStatus] = useState('All Statuses');

  const totalAlerts = 10;
  const activeAlerts = 4;
  const resolvedAlerts = 3;

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Alerts/get-alerts`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          // setAlerts(data);
        } else {
          // setError(data.message || 'Failed to fetch alerts.');
        }
      } catch (err) {
        // setError('Network error fetching alerts.');
      } finally {
        setLoading(false);
      }
    };
    // fetchAlerts();
  }, []);

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
  };

  const handleResolveAlert = (alert) => {
    setSelectedAlert(alert);
    setShowResolveModal(true);
  };

  const handleMarkResolved = () => {
    // In real implementation, this would call an API
    setAlerts(alerts.map(alert => 
      alert.id === selectedAlert.id 
        ? { ...alert, status: 'Resolved' }
        : alert
    ));
    setShowResolveModal(false);
    setSelectedAlert(null);
    setResolutionNotes('');
  };

  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="alert-system-container">
      {/* Alert Stats */}
      <div className="alert-stats">
        <div className="alert-stat-item">
          <div className="stat-number total">{totalAlerts}</div>
          <div className="stat-label">Total Alerts</div>
          <div className="stat-icon">⚠️</div>
        </div>
        <div className="alert-stat-item">
          <div className="stat-number active">{activeAlerts}</div>
          <div className="stat-label">Active</div>
          <div className="stat-icon">❌</div>
        </div>
        <div className="alert-stat-item">
          <div className="stat-number resolved">{resolvedAlerts}</div>
          <div className="stat-label">Resolved</div>
          <div className="stat-icon">✅</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="alert-controls">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <img src={SearchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="alert-search-input"
            />
          </div>
        </div>
        
        <div className="alert-filters">
          <div className="filter-wrapper">
            <img src={FilterIcon} alt="Filter" className="filter-icon" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="alert-filter">
              <option>All Types</option>
              <option>Security</option>
              <option>Performance</option>
            </select>
          </div>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="alert-filter">
            <option>All Severities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="alert-filter">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="alert-actions-bar">
        <button 
          type="button"
          onClick={() => {
            setSearchTerm('');
            setFilterType('All Types');
            setFilterSeverity('All Severities');
            setFilterStatus('All Statuses');
          }} 
          className="clear-filters-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M9 12h6M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Clear All Filters
        </button>
      </div>

      {/* Alerts Table */}
      <div className="alerts-table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Message</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.timestamp}</td>
                <td>
                  <span className={`alert-type ${alert.type.toLowerCase()}`}>
                    {alert.type}
                  </span>
                </td>
                <td>{alert.message}</td>
                <td>
                  <span className={`severity-badge ${alert.severity.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${alert.status.toLowerCase()}`}>
                    {alert.status}
                  </span>
                </td>
                <td>
                  <div className="alert-actions">
                    <button 
                      type="button"
                      onClick={() => handleViewAlert(alert)}
                      className="action-btn view-btn"
                      title="View Details"
                    >
                      <img src={EyeIcon} alt="View" className="action-icon" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleResolveAlert(alert)}
                      className="action-btn resolve-btn"
                      title="Resolve Alert"
                    >
                      <img src={AddTaskIcon} alt="Resolve" className="action-icon" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alert Details Panel */}
      {selectedAlert && !showResolveModal && (
        <div className="alert-details-panel">
          <div className="alert-details-header">
            <h3>Alert Details</h3>
            <button type="button" onClick={() => setSelectedAlert(null)} className="close-btn">✕</button>
          </div>
          <div className="alert-details-content">
            <div className="alert-info-grid">
              <div className="alert-info-item">
                <span className="info-label">Alert ID</span>
                <span className="info-value">{selectedAlert.id}</span>
              </div>
              <div className="alert-info-item">
                <span className="info-label">Timestamp</span>
                <span className="info-value">{selectedAlert.timestamp}</span>
              </div>
              <div className="alert-info-item">
                <span className="info-label">Type</span>
                <span className="info-value">{selectedAlert.type}</span>
              </div>
              <div className="alert-info-item">
                <span className="info-label">Severity</span>
                <span className="info-value">{selectedAlert.severity}</span>
              </div>
              <div className="alert-info-item">
                <span className="info-label">Status</span>
                <span className="info-value">{selectedAlert.status}</span>
              </div>
              <div className="alert-info-item">
                <span className="info-label">Assigned To</span>
                <span className="info-value">security_team</span>
              </div>
            </div>
            
            <div className="alert-affected-system">
              <span className="info-label">Affected System</span>
              <span className="info-value">Authentication Service</span>
            </div>
            
            <div className="alert-message-section">
              <span className="info-label">Message</span>
              <div className="alert-message-box">
                Multiple failed login attempts detected from IP 192.168.1.100
              </div>
            </div>
            
            <div className="alert-notes-section">
              <span className="info-label">Notes</span>
              <div className="alert-notes-box">
                Investigating potential brute force attack
              </div>
            </div>
            
            <div className="alert-actions-bottom">
              <button type="button" onClick={() => setShowResolveModal(true)} className="btn-resolve-alert">
                🔧 Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Alert Modal */}
      {showResolveModal && (
        <div className="modal-overlay">
          <div className="resolve-modal">
            <div className="modal-header">
              <h3>Resolve Alert</h3>
              <button type="button" onClick={() => setShowResolveModal(false)} className="close-btn">✕</button>
            </div>
            <div className="modal-content">
              <p>Add resolution notes for {selectedAlert?.id}</p>
              <div className="resolution-form">
                <label>Resolution Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter details about how this alert was resolved..."
                  rows="4"
                  className="resolution-textarea"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowResolveModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="button" onClick={handleMarkResolved} className="btn-resolve">
                  🔧 Resolve Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertSystemPage;