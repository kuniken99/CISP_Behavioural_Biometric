import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import DbConfigurationIcon from '../assets/db-configuration-icon.svg';

const DbConfigurationPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Config/get-config`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setConfig(data);
        } else {
          setError(data.message || 'Failed to fetch configuration.');
        }
      } catch (err) {
        setError('Network error fetching configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateConfig = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/Config/update-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Configuration updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || 'Failed to update configuration.');
      }
    } catch (err) {
      setError('Network error updating configuration.');
    }
  };

  if (loading) return <p>Loading database configuration...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2>Configuration Settings</h2>
      {success && <p className="success">{success}</p>}
      {config && (
        <div className="form-group-grid">
          {Object.entries(config).map(([key, value]) => (
            <div className="form-group" key={key}>
              <label>{key}:</label>
              {key === 'enableAuditing' ? (
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleConfigChange(key, e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              ) : (
                <input
                  type={typeof value === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                />
              )}
            </div>
          ))}
          
        </div>
      )}
      <button 
            type="button" 
            className="button primary" 
            onClick={handleUpdateConfig}
            style={{ 
              backgroundColor: '#000000', 
              color: '#ffffff',
              border: '1px solid #000000',
              padding: '12px 24px',
              fontSize: '1rem',
            }}
          >
            Update Configuration
          </button>
    </div>
  );
};

export default DbConfigurationPage;