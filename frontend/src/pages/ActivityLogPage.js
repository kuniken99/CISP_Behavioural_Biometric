import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../utils/config';
import ActivityLogsIcon from '../assets/activity-logs-icon.svg';
import SearchIcon from '../assets/search-icon.svg';
import PersonIcon from '../assets/person-icon.svg';
import FilterIcon from '../assets/filter-icon.svg';
import DropdownIcon from '../assets/dropdown-icon.svg';
import SeverityIcon from '../assets/severity-icon.svg';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 15;

  // Helper function to determine severity based on action
  const determineSeverity = useCallback((action) => {
    const highSeverityActions = [
      'FAILED_LOGIN', 'FAILED_TWO_FACTOR_LOGIN', 'DELETE_USER', 'DEACTIVATE_USER', 
      'TOGGLE_USER_STATUS', 'USER_STATUS_CHANGE', 'SECURITY_BREACH', 
      'UNAUTHORIZED_ACCESS', 'PRIVILEGE_ESCALATION', 'DATA_BREACH'
    ];
    const mediumSeverityActions = [
      'TWO_FACTOR_LOGIN_SUCCESS', 'CREATE_USER', 'UPDATE_USER', 'LOGIN', 'LOGOUT', 
      'PASSWORD_CHANGE', 'EMAIL_CHANGE', 'ROLE_CHANGE', 'USER_ACTIVATION', 'USER_DEACTIVATION'
    ];
    const lowSeverityActions = [
      'VIEW_USERS', 'VIEW_LOGS', 'VIEW_ALERTS', 'VIEW_DASHBOARD', 
      'VIEW_CONFIG', 'VIEW_PROFILE', 'SEARCH', 'FILTER'
    ];
    
    if (highSeverityActions.some(act => action.includes(act))) return 'High';
    if (mediumSeverityActions.some(act => action.includes(act))) return 'Medium';
    if (lowSeverityActions.some(act => action.includes(act))) return 'Low';
    return 'Medium'; // Default to Medium for unknown actions
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwt_token');
        // Fetch with faster loading - reduced to 25 items per page
        const response = await fetch(`${API_BASE_URL}/Audit/activity-logs?limit=25&page=${currentPage}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache' // Ensure fresh data
          },
        });
        const data = await response.json();
        if (response.ok) {
          // Pre-calculate severity to avoid repeated calculations
          const severityCache = new Map();
          
          // Handle new paginated response format
          const logsData = data.logs || data; // Support both old and new response formats
          const transformedLogs = logsData.map(log => {
            let severity = severityCache.get(log.action);
            if (!severity) {
              severity = determineSeverity(log.action);
              severityCache.set(log.action, severity);
            }
            
            // Convert UTC timestamp to GMT+8
            const utcDate = new Date(log.timestamp);
            const gmt8Date = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours
            
            return {
              timestamp: gmt8Date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }),
              user: log.username || 'System',
              action: log.action,
              details: log.details,
              severity,
              ipAddress: log.ipAddress || 'N/A'
            };
          });
          setLogs(transformedLogs);
          
          // Set pagination metadata if available
          if (data.totalCount !== undefined) {
            setTotalLogs(data.totalCount);
          }
        } else {
          setError(data.message || 'Failed to fetch activity logs.');
        }
      } catch (err) {
        setError('Network error fetching activity logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [determineSeverity, currentPage]);

  // Memoize filtered logs for better performance
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(lowerSearchTerm) ||
        log.action.toLowerCase().includes(lowerSearchTerm) ||
        log.details.toLowerCase().includes(lowerSearchTerm)
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
    
    return filtered;
  }, [logs, debouncedSearchTerm, selectedUser, selectedAction, selectedSeverity]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedUser, selectedAction, selectedSeverity]);

  // Extract unique users and actions for dynamic filters
  const uniqueUsers = useMemo(() => {
    const users = [...new Set(logs.map(log => log.user))].sort();
    return ['All Users', ...users];
  }, [logs]);

  const uniqueActions = useMemo(() => {
    const actions = [...new Set(logs.map(log => log.action))].sort();
    return ['All Actions', ...actions];
  }, [logs]);

  const uniqueSeverities = useMemo(() => {
    const severities = [...new Set(logs.map(log => log.severity))].sort();
    return ['All Severities', ...severities];
  }, [logs]);

  // Paginate filtered logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentPage, logsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedUser('All Users');
    setSelectedAction('All Actions');
    setSelectedSeverity('All Severities');
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading activity logs...
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#fee2e2', 
        border: '1px solid #fecaca', 
        color: '#dc2626', 
        padding: '12px', 
        borderRadius: '8px', 
        marginTop: '16px' 
      }}>
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Card 1: Filters */}
      <div className="card">
        <h2>Filters</h2>
        
        {/* Search and Filter Section - One Line */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
          {/* Search Section */}
          <div className="search-input-wrapper" style={{ flex: '2', minWidth: '400px' }}>
            <img src={SearchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="activity-search-input"
            />
          </div>
          
          {/* Small gap before filters */}
          <div style={{ width: '100px' }}></div>
        
          {/* Filter Section */}
          <div className="filter-wrapper" style={{ flex: '1', minWidth: '150px' }}>
            <img src={PersonIcon} alt="User" className="filter-icon" />
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
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
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
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
            <img src={FilterIcon} alt="Filter" className="filter-icon" />
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
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
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
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
            <img src={SeverityIcon} alt="Severity" className="filter-icon" />
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
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
                {uniqueSeverities.map(severity => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
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
          <span>Showing {filteredLogs.length} of {logs.length} logs</span>
          <button type="button" onClick={clearFilters} className="clear-filters-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M9 12h6M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Card 2: Activity Logs Table */}
      <div className="card">
        <h2>Activity Logs</h2>
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
              {paginatedLogs.map((log, index) => (
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px',
            marginTop: '20px',
            padding: '10px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === 1 ? '#f3f4f6' : '#000000',
                color: currentPage === 1 ? '#9ca3af' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Page {currentPage} of {totalPages} ({filteredLogs.length} logs)
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#000000',
                color: currentPage === totalPages ? '#9ca3af' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ActivityLogPage;