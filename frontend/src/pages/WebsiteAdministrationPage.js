import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import WebsiteAdminIcon from '../assets/website-admin-icon.svg';

const WebsiteAdministrationPage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Content/get-website-content`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setContent(data.content);
        } else {
          setError(data.message || 'Failed to fetch website content.');
        }
      } catch (err) {
        setError('Network error fetching website content.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleUpdateContent = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/Content/update-website-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Website content updated successfully!');
      } else {
        setError(data.message || 'Failed to update website content.');
      }
    } catch (err) {
      setError('Network error updating website content.');
    }
  };

  if (loading) return <p>Loading website content...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      {success && <p className="success">{success}</p>}
      <div className="form-group">
        <label>Website Content/Metadata (Markdown supported):</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="10"
          style={{ width: '100%' }}
        ></textarea>
      </div>
      <button className="button primary" onClick={handleUpdateContent} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <img src={WebsiteAdminIcon} alt="Update" style={{ width: '16px', height: '16px' }} />
        Update Content
      </button>
    </div>
  );
};

export default WebsiteAdministrationPage;