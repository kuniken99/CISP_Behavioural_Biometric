import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import AlertSystemIcon from '../assets/alert-system-icon.svg';
import EyeIcon from '../assets/eye-icon.svg';
import AddTaskIcon from '../assets/add-task-icon.svg';
import DropdownIcon from '../assets/dropdown-icon.svg';
import SearchIcon from '../assets/search-icon.svg';
import FilterIcon from '../assets/filter-icon.svg';
import RedCrossIcon from '../assets/red-cross-icon.svg';
import GreenCheckIcon from '../assets/green-check-icon.svg';
import ResolveIcon from '../assets/resolve-icon.svg';
import SeverityIcon from '../assets/severity-icon.svg';
import ToggleIcon from '../assets/toggle-icon.svg';

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

  const getTotalAlerts = () => alerts.length + 8; // Adding to existing alerts for demo
  const getActiveAlerts = () => alerts.filter(alert => alert.status === 'Active').length + 2;
  const getResolvedAlerts = () => alerts.filter(alert => alert.status === 'Resolved').length + 3;

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

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchTerm === '' || 
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All Types' || alert.type === filterType;
    const matchesSeverity = filterSeverity === 'All Severities' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'All Statuses' || alert.status === filterStatus;
    
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      {/* Card 1: Alert Summary */}
      <div style={{ display: 'flex', gap: '20px'}}>
        <div className="card" style={{ 
          flex: '1', 
          padding: '12px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>Total Alerts</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{getTotalAlerts()}</div>
          </div>
          <img src={AlertSystemIcon} alt="Total" style={{ width: '40px', height: '40px', opacity: 0.7 }} />
        </div>
        
        <div className="card" style={{ 
          flex: '1', 
          padding: '12px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>Active</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{getActiveAlerts()}</div>
          </div>
          <img src={RedCrossIcon} alt="Active" style={{ width: '40px', height: '40px', opacity: 0.7 }} />
        </div>
        
        <div className="card" style={{ 
          flex: '1', 
          padding: '12px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>Resolved</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{getResolvedAlerts()}</div>
          </div>
          <img src={GreenCheckIcon} alt="Resolved" style={{ width: '40px', height: '40px', opacity: 0.7 }} />
        </div>
      </div>

      {/* Card 2: Search and Filters */}
      <div className="card">
        <h2>Filter</h2>
        {/* Search and Filter Section */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
          {/* Search Section */}
          <div className="search-input-wrapper" style={{ flex: '2', minWidth: '400px' }}>
            <img src={SearchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="activity-search-input"
            />
          </div>
          
          <div style={{ width: '100px' }}></div>
          
          {/* Filters */}
          <div className="filter-wrapper" style={{ flex: '1', minWidth: '150px' }}>
            <img src={FilterIcon} alt="Type" className="filter-icon" style={{ marginRight: '8px' }} />
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)} 
                className="activity-filter"
                style={{ 
                  paddingRight: '40px', 
                  width: '100%',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option>All Types</option>
                <option>Security</option>
                <option>Performance</option>
              </select>
              <img 
                src={DropdownIcon} 
                alt="Dropdown" 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  width: '16px', 
                  height: '16px',
                  pointerEvents: 'none'
                }} 
              />
            </div>
          </div>
          
          <div className="filter-wrapper" style={{ flex: '1', minWidth: '150px' }}>
            <img src={SeverityIcon} alt="Severity" className="filter-icon" style={{ marginRight: '8px' }} />
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <select 
                value={filterSeverity} 
                onChange={(e) => setFilterSeverity(e.target.value)} 
                className="activity-filter"
                style={{ 
                  paddingRight: '40px',
                  width: '100%',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option>All Severities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <img 
                src={DropdownIcon} 
                alt="Dropdown" 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  width: '16px', 
                  height: '16px',
                  pointerEvents: 'none'
                }} 
              />
            </div>
          </div>
          
          <div className="filter-wrapper" style={{ flex: '1', minWidth: '150px' }}>
            <img src={ToggleIcon} alt="Status" className="filter-icon" style={{ marginRight: '8px' }} />
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                className="activity-filter"
                style={{ 
                  paddingRight: '40px',
                  width: '100%',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Resolved</option>
              </select>
              <img 
                src={DropdownIcon} 
                alt="Dropdown" 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  width: '16px', 
                  height: '16px',
                  pointerEvents: 'none'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Results Summary and Clear Button */}
        <div className="results-summary">
          <span>Showing {filteredAlerts.length} of {alerts.length} alerts</span>
          <button 
            type="button" 
            onClick={() => {
              setSearchTerm('');
              setFilterType('All Types');
              setFilterSeverity('All Severities');
              setFilterStatus('All Statuses');
            }} 
            className="clear-filters-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M9 12h6M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Card 3: Alerts Table */}
      <div className="card">
        <h2>Alerts</h2>
        <div className="activity-table-container">
          <table className="activity-table">
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
              {filteredAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.timestamp}</td>
                  <td>
                    <span className={`type-badge ${alert.type.toLowerCase()}`}>
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
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <button 
                        type="button"
                        onClick={() => handleViewAlert(alert)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="View Details"
                      >
                        <img src={EyeIcon} alt="View" style={{ width: '20px', height: '20px' }} />
                      </button>
                      {alert.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => handleResolveAlert(alert)}
                          style={{
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Resolve Alert"
                        >
                          <img src={ResolveIcon} alt="Resolve" style={{ width: '20px', height: '20px' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Panel */}
      {selectedAlert && !showResolveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            minWidth: '500px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#111827' }}>Alert Details</h2>
              <button 
                type="button" 
                onClick={() => setSelectedAlert(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6b7280',
                  borderRadius: '4px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px', marginBottom: '24px' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Alert ID</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>{selectedAlert.id}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Timestamp</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>{selectedAlert.timestamp}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Type</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>{selectedAlert.type}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Severity</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>{selectedAlert.severity}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Status</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>{selectedAlert.status}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Assigned To</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>security_team</div>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Affected System</div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151'
              }}>
                Authentication Service
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Message</div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151'
              }}>
                {selectedAlert.message}
              </div>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Notes</div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151'
              }}>
                Investigating potential brute force attack
              </div>
            </div>
            
            {selectedAlert.status === 'Active' && (
              <button 
                type="button" 
                onClick={() => setShowResolveModal(true)} 
                style={{
                  width: '100%',
                  backgroundColor: '#000000',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <img src={ResolveIcon} alt="Resolve" style={{ width: '16px', height: '16px' }} />
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resolve Alert Modal */}
      {showResolveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Resolve Alert</h3>
              <button
                type="button"
                class="close-btn"
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedAlert(null);
                  setResolutionNotes('');
                }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ marginBottom: '20px', color: '#6b7280' }}>
              Add resolution notes for {selectedAlert?.id}
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter details about how this alert was resolved..."
                rows="4"
                style={{ 
                  width: '95%', 
                  padding: '10px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedAlert(null);
                  setResolutionNotes('');
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkResolved}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <img src={ResolveIcon} alt="Resolve" style={{ width: '16px', height: '16px' }} />
                Resolve Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertSystemPage;