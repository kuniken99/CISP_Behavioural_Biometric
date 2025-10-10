import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import AlertSystemIcon from '../assets/alert-system-icon.svg';

const AlertSystemPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Alerts/get-alerts`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setAlerts(data);
        } else {
          setError(data.message || 'Failed to fetch alerts.');
        }
      } catch (err) {
        setError('Network error fetching alerts.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={AlertSystemIcon} alt="Alert System" style={{ width: '24px', height: '24px' }} />
        Alert System
      </h2>
      {alerts.length === 0 ? (
        <p>No active alerts.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Message</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, index) => (
              <tr key={index} className={alert.severity.toLowerCase()}>
                <td>{new Date(alert.timestamp).toLocaleString()}</td>
                <td>{alert.type}</td>
                <td>{alert.message}</td>
                <td>{alert.severity}</td>
                <td>{alert.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AlertSystemPage;