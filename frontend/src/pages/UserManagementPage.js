import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import userManagementIcon from '../assets/user-management-icon.svg';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  // const [editingUserId, setEditingUserId] = useState(null); // Future functionality

  useEffect(() => {
    fetchUsers();
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

  if (loading) return <div className="card"><p>Loading users...</p></div>;
  if (error) return <div className="card"><p className="error">{error}</p></div>;

  return (
    <div className="card">
      <h3>Create New User</h3>
      <div className="form-group-inline">
        <div className="form-group">
          <label>Username:</label>
          <input 
            type="text" 
            value={newUser.username} 
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} 
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password" 
            value={newUser.password} 
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
          />
        </div>
        <div className="form-group">
          <label>Role:</label>
          <select 
            value={newUser.role} 
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="dba">DBA</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <button className="button primary" onClick={handleCreateUser}>Create User</button>

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
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Inactive'}</td>
              <td>
                <button className="button secondary small">Edit</button>
                <button className="button danger small">
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagementPage;