import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import RoleAccessControlIcon from '../assets/role-access-control-icon.svg';
import DropdownIcon from '../assets/dropdown-icon.svg';

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
    <>
      {/* Card 1: Assign Role */}
      <div className="card">
        <h2>Assign Role</h2>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); return false; }} className="form-group-inline">
          <div className="form-group">
            <label>Select User:</label>
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignRole();
                    return false;
                  }
                }}
                style={{ 
                  width: '100%', 
                  paddingRight: '40px',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.username} ({user.role})</option>
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
          <div className="form-group">
            <label>Assign Role:</label>
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignRole();
                    return false;
                  }
                }}
                style={{ 
                  width: '100%', 
                  paddingRight: '40px',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
              >
                <option value="">-- Select Role --</option>
                {roles.map(role => (
                  <option key={role.name} value={role.name}>{role.name}</option>
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
        </form>
        <button 
          type="button" 
          className="button primary" 
          onClick={handleAssignRole} 
          style={{ 
            backgroundColor: '#000000', 
            color: '#ffffff' 
          }}
        >
          Assign Role
        </button>
        {error && <p className="error">{error}</p>}
      </div>

      {/* Card 2: Current User Roles */}
      <div className="card">
        <h2>Current User Roles</h2>
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
                <td>
                  <span style={user.isActive ? activeStatusStyle : inactiveStatusStyle}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default RoleBasedAccessControlPage;