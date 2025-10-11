import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import userManagementIcon from '../assets/user-management-icon.svg';

// Inline styles for status badges
const statusBadgeStyle = {
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase'
};

const activeStatusStyle = {
  ...statusBadgeStyle,
  backgroundColor: '#10b981',
  color: 'white'
};

const inactiveStatusStyle = {
  ...statusBadgeStyle,
  backgroundColor: '#ef4444',
  color: 'white'
};

const availableStatusStyle = {
  ...statusBadgeStyle,
  backgroundColor: '#3b82f6',
  color: 'white'
};

const usedStatusStyle = {
  ...statusBadgeStyle,
  backgroundColor: '#6b7280',
  color: 'white'
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [uniqueCodes, setUniqueCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [newCodeData, setNewCodeData] = useState({ role: 'user', expiresInDays: 7, note: '' });
  const [codeGenerationLoading, setCodeGenerationLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState({ username: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
    fetchUniqueCodes();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        setError(data.message || 'Failed to fetch users.');
      }
    } catch (err) {
      setError('Network error fetching users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniqueCodes = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/unique-codes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUniqueCodes(data);
      } else if (response.status === 404) {
        // API endpoint not yet implemented
        setUniqueCodes([]);
        console.log('Unique codes API endpoint not yet available');
      } else {
        const data = await response.json();
        console.error('Failed to fetch unique codes:', data.message);
        setUniqueCodes([]);
      }
    } catch (err) {
      console.error('Network error fetching unique codes:', err);
      setUniqueCodes([]);
    }
  };

  const handleCreateUser = async () => {
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setNewUser({ username: '', password: '', role: 'user' });
        fetchUsers();
      } else {
        setError(data.message || 'Failed to create user.');
      }
    } catch (err) {
      setError('Network error creating user.');
    }
  };

  const handleGenerateUniqueCode = async () => {
    setCodeGenerationLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/generate-unique-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCodeData),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Unique code generated successfully: ${data.code}`);
        setNewCodeData({ role: 'user', expiresInDays: 7, note: '' });
        fetchUniqueCodes();
      } else if (response.status === 404) {
        setError('Unique code generation API is not yet available. Please update the backend to the latest version.');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to generate unique code.');
      }
    } catch (err) {
      setError('Network error generating unique code. Please check if the backend server is running and up to date.');
    } finally {
      setCodeGenerationLoading(false);
    }
  };

  const handleDeleteCode = async (codeId) => {
    if (!window.confirm('Are you sure you want to permanently delete this code? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/delete-unique-code`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ codeId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Unique code deleted successfully');
        fetchUniqueCodes();
      } else if (response.status === 404) {
        setError('Unique code deletion API is not yet available. Please update the backend to the latest version.');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete code.');
      }
    } catch (err) {
      setError('Network error deleting code. Please check if the backend server is running and up to date.');
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setEditingUser({ username: user.username, role: user.role });
  };

  const handleUpdateUser = async () => {
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/update-user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          userId: editingUserId, 
          username: editingUser.username,
          role: editingUser.role
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'User updated successfully');
        setEditingUserId(null);
        setEditingUser({ username: '', role: 'user' });
        fetchUsers();
      } else {
        setError(data.message || 'Failed to update user.');
      }
    } catch (err) {
      setError('Network error updating user.');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUser({ username: '', role: 'user' });
  };

  const handleToggleUserStatus = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;
    
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/toggle-user-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || `User ${action}d successfully`);
        fetchUsers();
      } else {
        setError(data.message || `Failed to ${action} user.`);
      }
    } catch (err) {
      setError(`Network error ${action}ing user.`);
    }
  };

  if (loading) return <div className="card"><p>Loading users...</p></div>;
  if (error) return <div className="card"><p className="error">{error}</p></div>;

  return (
    <div className="card">
      <h3>Create New User</h3>
      <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); return false; }} className="form-group-inline">
        <div className="form-group">
          <label>Username:</label>
          <input 
            type="text" 
            value={newUser.username} 
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleCreateUser();
                return false;
              }
            }}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password" 
            value={newUser.password} 
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleCreateUser();
                return false;
              }
            }}
          />
        </div>
        <div className="form-group">
          <label>Role:</label>
          <select 
            value={newUser.role} 
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleCreateUser();
                return false;
              }
            }}
          >
            <option value="user">User</option>
            <option value="dba">DBA</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </form>
      <button 
        type="button" 
        className="button primary" 
        onClick={handleCreateUser}
        style={{ 
          backgroundColor: '#000000', 
          color: '#ffffff',
          border: '1px solid #000000'
        }}
      >
        Create User
      </button>

      {/* Unique Code Generation Section */}
      <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #e5e7eb' }}>
        <h3>Generate Registration Codes</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Generate unique codes for new user registration. These codes are required during the sign-up process.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); return false; }} className="form-group-inline">
          <div className="form-group">
            <label>Role for New Users:</label>
            <select 
              value={newCodeData.role} 
              onChange={(e) => setNewCodeData({ ...newCodeData, role: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGenerateUniqueCode();
                  return false;
                }
              }}
            >
              <option value="user">User</option>
              <option value="dba">DBA</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Expires In (Days):</label>
            <input 
              type="number" 
              min="1"
              max="365"
              value={newCodeData.expiresInDays} 
              onChange={(e) => setNewCodeData({ ...newCodeData, expiresInDays: parseInt(e.target.value) || 7 })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGenerateUniqueCode();
                  return false;
                }
              }}
            />
          </div>
          <div className="form-group">
            <label>Note (Optional):</label>
            <input 
              type="text" 
              placeholder="e.g., For new team members"
              value={newCodeData.note} 
              onChange={(e) => setNewCodeData({ ...newCodeData, note: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGenerateUniqueCode();
                  return false;
                }
              }}
            />
          </div>
        </form>
        <button 
          type="button" 
          className="button success" 
          onClick={handleGenerateUniqueCode}
          disabled={codeGenerationLoading}
          style={{ 
            backgroundColor: '#000000', 
            color: '#ffffff',
            border: '1px solid #000000'
          }}
        >
          {codeGenerationLoading ? 'Generating...' : 'Generate Unique Code'}
        </button>

        {/* Active Unique Codes Table */}
        <h4 style={{ marginTop: '30px' }}>Active Registration Codes</h4>
        <table style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Role</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Note</th>
              <th>Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueCodes.map(code => (
              <tr key={code.id}>
                <td style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
                  {code.code}
                </td>
                <td>{code.role}</td>
                <td>{new Date(code.createdAt).toLocaleDateString()}</td>
                <td>{new Date(code.expiresAt).toLocaleDateString()}</td>
                <td>{code.note || '-'}</td>
                <td>
                  <span style={code.isUsed ? usedStatusStyle : availableStatusStyle}>
                    {code.isUsed ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                      type="button" 
                      className="button danger small"
                      onClick={() => handleDeleteCode(code.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {uniqueCodes.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280' }}>
                  No active registration codes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3>Existing Users</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>
                {editingUserId === user.id ? (
                  <input 
                    type="text" 
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUpdateUser();
                        return false;
                      }
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                ) : (
                  user.username
                )}
              </td>
              <td>
                {editingUserId === user.id ? (
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUpdateUser();
                        return false;
                      }
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="user">User</option>
                    <option value="dba">DBA</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>
                <span style={user.isActive ? activeStatusStyle : inactiveStatusStyle}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                {editingUserId === user.id ? (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button type="button" className="button success small" onClick={handleUpdateUser}>
                      Save
                    </button>
                    <button type="button" className="button secondary small" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button type="button" className="button secondary small" onClick={() => handleEditUser(user)}>
                      Edit
                    </button>
                    <button type="button" className={`button ${user.isActive ? 'danger' : 'success'} small`} onClick={() => handleToggleUserStatus(user)}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagementPage;