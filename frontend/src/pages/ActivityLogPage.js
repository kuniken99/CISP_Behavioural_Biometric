import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../utils/config';
import ActivityLogsIcon from '../assets/activity-logs-icon.svg';
import SearchIcon from '../assets/search-icon.svg';
import PersonIcon from '../assets/person-icon.svg';
import FilterIcon from '../assets/filter-icon.svg';
import DropdownIcon from '../assets/dropdown-icon.svg';
import SeverityIcon from '../assets/severity-icon.svg';

// Memoize table row component for better rendering performance
const LogRow = React.memo(({ log, index }) => (
  <tr key={index} className="responsive-table-row">
    <td data-label="Timestamp" className="timestamp-cell">
      <div className="mobile-timestamp">{log.timestamp.split(',')[0]}</div>
      <div className="mobile-time tablet-up">{log.timestamp.split(',')[1]}</div>
      <div className="tablet-up full-timestamp">{log.timestamp}</div>
    </td>
    <td data-label="User" className="tablet-up">{log.user}</td>
    <td data-label="Action">
      <span className={`action-badge ${log.action.toLowerCase().replace('_', '-')}`}>
        {log.action}
      </span>
      <div className="mobile-only mobile-meta">
        <small className="mobile-user">👤 {log.user}</small>
      </div>
    </td>
    <td data-label="Details" className="tablet-up details-cell">
      <div className="details-text">{log.details}</div>
    </td>
    <td data-label="Severity">
      <span className={`severity-badge ${log.severity.toLowerCase()}`}>
        {log.severity}
      </span>
      <div className="mobile-only mobile-details">
        <small>{log.details}</small>
      </div>
    </td>
  </tr>
));

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const cacheRef = useRef(new Map()); // Add caching with useRef to avoid dependency loops

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
  const [logsPerPage, setLogsPerPage] = useState(15);

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
    const fetchLogs = async (retryCount = 0) => {
      const cacheKey = `logs-${logsPerPage}`;
      
      // Check cache first for instant loading
      if (cacheRef.current.has(cacheKey)) {
        const cachedData = cacheRef.current.get(cacheKey);
        setLogs(cachedData.logs);
        setTotalLogs(cachedData.totalLogs);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(''); // Clear previous errors
        const token = localStorage.getItem('jwt_token');
        
        // Use fetch with reasonable timeout and optimized headers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        // Fetch enough data to support frontend pagination - get more records
        const fetchLimit = Math.max(logsPerPage * 5, 500); // Fetch 5x the page size or 500, whichever is larger
        const response = await fetch(`${API_BASE_URL}/Audit/activity-logs?limit=${fetchLimit}&page=1`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
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

          // Cache the processed data for faster subsequent loads
          cacheRef.current.set(cacheKey, { 
            logs: transformedLogs, 
            totalLogs: data.totalCount || 0,
            timestamp: Date.now()
          });
          
          // Limit cache size to prevent memory issues (keep last 5 pages)
          if (cacheRef.current.size > 5) {
            const firstKey = cacheRef.current.keys().next().value;
            cacheRef.current.delete(firstKey);
          }
        } else {
          setError(data.message || 'Failed to fetch activity logs.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        
        // Retry logic for network errors (up to 2 retries)
        if (retryCount < 2 && (err.name === 'AbortError' || err.message.includes('NetworkError') || err.message.includes('Failed to fetch'))) {
          console.log(`Retrying request... Attempt ${retryCount + 1}`);
          setTimeout(() => fetchLogs(retryCount + 1), 2000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        // Set appropriate error message
        if (err.name === 'AbortError') {
          setError('Request timed out. The server may be slow. Please try again.');
        } else if (err.message.includes('HTTP 401')) {
          setError('Authentication failed. Please log in again.');
        } else if (err.message.includes('HTTP 403')) {
          setError('Access denied. You do not have permission to view activity logs.');
        } else if (err.message.includes('HTTP 500')) {
          setError('Server error. Please try again later.');
        } else {
          setError(`Network error: ${err.message}. Please check your connection and try again.`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [determineSeverity, logsPerPage]);

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
    const severities = [...new Set(logs.map(log => log.severity))];
    // Custom sort order: Low, Medium, High
    const severityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const sortedSeverities = severities.sort((a, b) => (severityOrder[a] || 99) - (severityOrder[b] || 99));
    return ['All Severities', ...sortedSeverities];
  }, [logs]);

  // Paginate filtered logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentPage, logsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Note: Preloading removed since we now fetch more data upfront and do frontend-only pagination

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedUser('All Users');
    setSelectedAction('All Actions');
    setSelectedSeverity('All Severities');
    setCurrentPage(1);
    cacheRef.current.clear(); // Clear cache when filters change
  }, []);

  // Function to download all activity logs as CSV
  const handleDownloadLogs = useCallback(async (event) => {
    try {
      const token = localStorage.getItem('jwt_token');
      
      // Show loading state on button
      const button = event.target.closest('button');
      const originalText = button.textContent;
      button.textContent = 'Downloading...';
      button.disabled = true;

      // Fetch all logs (use a high limit)
      const response = await fetch(`${API_BASE_URL}/Audit/activity-logs?limit=10000&page=1`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const logsData = data.logs || data;

      // Transform logs with GMT+8 timezone
      const transformedLogs = logsData.map(log => {
        const utcDate = new Date(log.timestamp);
        const gmt8Date = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
        
        return {
          timestamp: gmt8Date.toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
          }),
          user: log.username || 'System',
          action: log.action,
          details: log.details,
          severity: determineSeverity(log.action),
          ipAddress: log.ipAddress || 'N/A'
        };
      });

      // Create CSV content
      const csvHeaders = ['Timestamp', 'User', 'Action', 'Details', 'Severity', 'IP Address'];
      const csvRows = transformedLogs.map(log => [
        `"${log.timestamp}"`,
        `"${log.user}"`,
        `"${log.action}"`,
        `"${log.details.replace(/"/g, '""')}"`, // Escape quotes in details
        `"${log.severity}"`,
        `"${log.ipAddress}"`
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Reset button state
      button.textContent = originalText;
      button.disabled = false;

    } catch (err) {
      console.error('Download error:', err);
      alert(`Failed to download logs: ${err.message}`);
      
      // Reset button state on error
      const button = event.target.closest('button');
      button.textContent = 'Download Logs';
      button.disabled = false;
    }
  }, [determineSeverity]);

  return (
    <>
      {/* Card 1: Filters */}
      <div className="card">
        <h2>Filters</h2>
        
        {/* Responsive Search and Filter Section */}
        <div className="responsive-filters-container">
          {/* Search Section - Full width on mobile, 50% on tablet+ */}
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
          
          {/* Filter Section - Stack on mobile, inline on tablet+ */}
          <div className="filters-section">
            <div className="filter-wrapper">
              <img src={PersonIcon} alt="User" className="filter-icon" />
              <div className="select-wrapper">
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)} 
                  className="activity-filter"
                >
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
                <img src={DropdownIcon} alt="Dropdown" className="dropdown-icon" />
              </div>
            </div>
            
            <div className="filter-wrapper">
              <img src={FilterIcon} alt="Filter" className="filter-icon" />
              <div className="select-wrapper">
                <select 
                  value={selectedAction} 
                  onChange={(e) => setSelectedAction(e.target.value)} 
                  className="activity-filter"
                >
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
                <img src={DropdownIcon} alt="Dropdown" className="dropdown-icon" />
              </div>
            </div>
            
            <div className="filter-wrapper">
              <img src={SeverityIcon} alt="Severity" className="filter-icon" />
              <div className="select-wrapper">
                <select 
                  value={selectedSeverity} 
                  onChange={(e) => setSelectedSeverity(e.target.value)} 
                  className="activity-filter"
                >
                  {uniqueSeverities.map(severity => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>
                <img src={DropdownIcon} alt="Dropdown" className="dropdown-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary and Clear Button */}
        <div className="results-summary">
          <span>
            Showing {Math.min(paginatedLogs.length, logsPerPage)} of {filteredLogs.length} logs
            {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
          </span>
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
        <div className="activity-header">
          <h2>Activity Logs</h2>
          <div className="activity-controls">
            {/* Logs per page selector */}
            <div className="logs-per-page-control">
              <label className="tablet-up">Show:</label>
              <div className="select-wrapper">
                <select 
                  value={logsPerPage} 
                  onChange={(e) => {
                    setLogsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                    cacheRef.current.clear();
                  }}
                  className="logs-per-page-select"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <img src={DropdownIcon} alt="Dropdown" className="dropdown-icon" />
              </div>
            </div>
            
            <button onClick={handleDownloadLogs} className="download-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="tablet-up">Download Logs</span>
              <span className="mobile-only">Download</span>
            </button>
          </div>
        </div>
        <div className="activity-table-container table-container">
          <table className="activity-table responsive-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th className="tablet-up">User</th>
                <th>Action</th>
                <th className="tablet-up">Details</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    fontSize: '16px', 
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    Loading activity logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626',
                    fontSize: '16px'
                  }}>
                    <div>{error}</div>
                    <button 
                      onClick={() => window.location.reload()} 
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    fontSize: '16px', 
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    No activity logs match your current filters.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => (
                  <LogRow key={`${log.timestamp}-${index}`} log={log} index={index} />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Responsive Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
            >
              <span className="mobile-only">‹</span>
              <span className="tablet-up">Previous</span>
            </button>
            
            <div className="pagination-info">
              <span className="tablet-up">
                Page {currentPage} of {totalPages} (showing {paginatedLogs.length} of {filteredLogs.length})
              </span>
              <span className="mobile-only">
                {currentPage}/{totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
            >
              <span className="mobile-only">›</span>
              <span className="tablet-up">Next</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ActivityLogPage;