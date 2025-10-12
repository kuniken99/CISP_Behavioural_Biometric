import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import ActivityLogsIcon from '../assets/activity-logs-icon.svg';
import SearchIcon from '../assets/search-icon.svg';
import PersonIcon from '../assets/person-icon.svg';
import FilterIcon from '../assets/filter-icon.svg';
import DropdownIcon from '../assets/dropdown-icon.svg';
import SeverityIcon from '../assets/severity-icon.svg';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([
    {
      timestamp: '9/8/2025, 1:50:55 PM',
      user: 'darrell',
      action: 'VIEW_USERS',
      details: 'Viewed all system users.',
      severity: 'Medium'
    },
    {
      timestamp: '9/8/2025, 1:45:22 PM',
      user: 'darrell',
      action: 'LOGIN',
      details: 'Successfully logged into admin console.',
      severity: 'Medium'
    },
    {
      timestamp: '9/8/2025, 1:35:12 PM',
      user: 'darrell',
      action: 'VIEW_LOGS',
      details: 'Accessed activity logs dashboard.',
      severity: 'Medium'
    },
    {
      timestamp: '9/8/2025, 1:15:29 PM',
      user: 'darrell',
      action: 'VIEW_ALERTS',
      details: 'Reviewed system alert notifications.',
      severity: 'Medium'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('darrell');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [filteredLogs, setFilteredLogs] = useState(logs);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Audit/activity-logs`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          // setLogs(data);
        } else {
          // setError(data.message || 'Failed to fetch activity logs.');
        }
      } catch (err) {
        // setError('Network error fetching activity logs.');
      } finally {
        setLoading(false);
      }
    };
    // fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedUser && selectedUser !== 'All Users') {
      filtered = filtered.filter(log => log.user === selectedUser);
    }
    
    if (selectedAction && selectedAction !== 'All Actions') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }
    
    if (selectedSeverity && selectedSeverity !== 'All Severities') {
      filtered = filtered.filter(log => log.severity === selectedSeverity);
    }
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedUser, selectedAction, selectedSeverity]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUser('');
    setSelectedAction('All Actions');
    setSelectedSeverity('All Severities');
  };

  if (loading) return <p>Loading activity logs...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="activity-logs-container">
      {/* Search and Filter Controls */}
      <div className="activity-controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <img src={SearchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="activity-search-input"
            />
          </div>
        </div>
        
        <div className="filter-section">
          <div className="filter-wrapper">
            <img src={PersonIcon} alt="User" className="filter-icon" />
            <div style={{ position: 'relative', display: 'inline-block', flex: '1' }}>
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)} 
                className="activity-filter"
                style={{ 
                  paddingRight: '40px', 
                  width: '100%',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option>darrell</option>
                <option>All Users</option>
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
          
          <div className="filter-wrapper">
            <img src={FilterIcon} alt="Filter" className="filter-icon" />
            <div style={{ position: 'relative', display: 'inline-block', flex: '1' }}>
              <select 
                value={selectedAction} 
                onChange={(e) => setSelectedAction(e.target.value)} 
                className="activity-filter"
                style={{ 
                  paddingRight: '40px', 
                  width: '100%',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option>All Actions</option>
                <option>LOGIN</option>
                <option>VIEW_USERS</option>
                <option>VIEW_LOGS</option>
                <option>VIEW_ALERTS</option>
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
          
          <div className="filter-wrapper">
            <img src={SeverityIcon} alt="Severity" className="filter-icon" />
            <div style={{ position: 'relative', display: 'inline-block', flex: '1' }}>
              <select 
                value={selectedSeverity} 
                onChange={(e) => setSelectedSeverity(e.target.value)} 
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
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span>Showing {filteredLogs.length} of {logs.length} logs</span>
        <button type="button" onClick={clearFilters} className="clear-filters-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M9 12h6M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Clear All Filters
        </button>
      </div>

      {/* Activity Logs Table */}
      <div className="activity-table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.timestamp}</td>
                <td>{log.user}</td>
                <td>
                  <span className={`action-badge ${log.action.toLowerCase().replace('_', '-')}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.details}</td>
                <td>
                  <span className={`severity-badge ${log.severity.toLowerCase()}`}>
                    {log.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogPage;