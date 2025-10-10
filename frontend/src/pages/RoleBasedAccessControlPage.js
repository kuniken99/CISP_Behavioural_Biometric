import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import RoleAccessControlIcon from '../assets/role-access-control-icon.svg';

const RoleBasedAccessControlPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('jwt_token');
        const [usersRes, rolesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/UserManagement/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/RoleManagement/roles`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();

        if (usersRes.ok) setUsers(usersData); else setError(usersData.message || 'Failed to fetch users.');
        if (rolesRes.ok) setRoles(rolesData); else setError(rolesData.message || 'Failed to fetch roles.');

      } catch (err) {
        setError('Network error fetching data for roles.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignRole = async () => {
    setError('');
    if (!selectedUser || !selectedRole) {
      setError('Please select both a user and a role.');
      return;
    }
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/RoleManagement/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: selectedUser, roleName: selectedRole }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Re-fetch users to update their roles in the display
        const usersRes = await fetch(`${API_BASE_URL}/UserManagement/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        const usersData = await usersRes.json();
        if (usersRes.ok) setUsers(usersData);
      } else {
        setError(data.message || 'Failed to assign role.');
      }
    } catch (err) {
      setError('Network error assigning role.');
    }
  };

  if (loading) return <p>Loading role management...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <div className="form-group-inline">
        <div className="form-group">
          <label>Select User:</label>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">-- Select User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.username} ({user.role})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Assign Role:</label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="">-- Select Role --</option>
            {roles.map(role => (
              <option key={role.name} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button className="button primary" onClick={handleAssignRole} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <img src={RoleAccessControlIcon} alt="Assign" style={{ width: '16px', height: '16px' }} />
        Assign Role
      </button>
      {error && <p className="error">{error}</p>}

      <h3>Current User Roles</h3>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoleBasedAccessControlPage;