import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import ActivityLogsIcon from '../assets/activity-logs-icon.svg';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Audit/activity-logs`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setLogs(data);
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
  }, []);

  if (loading) return <p>Loading activity logs...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={ActivityLogsIcon} alt="Activity History / Audit Logs" style={{ width: '24px', height: '24px' }} />
        Activity History / Audit Logs
      </h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Details</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.username}</td>
              <td>{log.action}</td>
              <td>{log.details}</td>
              <td>{log.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogPage;