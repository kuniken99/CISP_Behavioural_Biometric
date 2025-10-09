// frontend/src/App.js

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

// Assets (icons and images)
import dashboardIcon from './assets/dashboard-icon.svg';


const API_BASE_URL = 'http://localhost:5000/api'; // Your ASP.NET Core API base URL
// const API_BASE_URL_SSL = 'https://localhost-5000.vscodessl-api.net/api';

const COLLECTION_INTERVAL_MS = 5000; // Send data every 5 seconds for a more active console

// --- BEGIN Placeholder Components for DBA Functions ---

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/Auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          const data = await response.json();
          onLogin(data.token, data.username, data.role);
        } else {
          // Handle non-ok responses
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            setError(errorData.message || 'Login failed');
          } catch {
            setError(errorText || 'Login failed');
          }
        }
      } catch (err) {
        setError('Network error during login.');
        console.error(err); // Log the actual error for debugging
      }
    };

  return (
    <div className="card">
      <h2>DBA Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button primary">Login</button>
      </form>
    </div>
  );
};

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Dashboard/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setMetrics(data);
        } else {
          setError(data.message || 'Failed to fetch dashboard metrics.');
        }
      } catch (err) {
        setError('Network error fetching dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h2>Dashboard 📊</h2>
      {metrics ? (
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="icon">⏰</div>
            <div className="content">
              <h3>{metrics.uptime}</h3>
              <p>Uptime</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">⚙️</div>
            <div className="content">
              <h3>{metrics.cpuUsage}%</h3>
              <p>CPU Usage</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">💾</div>
            <div className="content">
              <h3>{metrics.memoryUsage} MB</h3>
              <p>Memory Usage</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">🗄️</div>
            <div className="content">
              <h3>{metrics.databaseSize} GB</h3>
              <p>Database Size</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">👤</div>
            <div className="content">
              <h3>{metrics.activeUsers}</h3>
              <p>Active Users</p>
            </div>
          </div>
          <div className="metric-item">
            <div className="icon">📈</div>
            <div className="content">
              <h3>{metrics.transactionsPerSecond}</h3>
              <p>Transactions/Sec</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No metrics available.</p>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div className="card">
          <h3>📋 Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">🟢</span>
              <span className="activity-text">Database backup completed</span>
              <span className="activity-time">2 min ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🔵</span>
              <span className="activity-text">User logged in: admin@example.com</span>
              <span className="activity-time">5 min ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🟡</span>
              <span className="activity-text">High memory usage detected</span>
              <span className="activity-time">12 min ago</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3>💊 System Health</h3>
          <div className="health-metrics">
            <div className="health-item">
              <span>Database Connections</span>
              <span className="health-value">45/100</span>
            </div>
            <div className="health-item">
              <span>Disk Space</span>
              <span className="health-value">2.1TB free</span>
            </div>
            <div className="health-item">
              <span>Network Latency</span>
              <span className="health-value">12ms</span>
            </div>
            <div className="health-item">
              <span>Error Rate</span>
              <span className="health-value">0.01%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DbEntryManagementPage = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newEntryData, setNewEntryData] = useState({});
  const [editingEntryId, setEditingEntryId] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/DbManagement/tables`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setTables(data);
        } else {
          setError(data.message || 'Failed to fetch tables.');
        }
      } catch (err) {
        setError('Network error fetching tables.');
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const fetchEntries = async (tableName) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/DbManagement/entries?tableName=${tableName}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setEntries(data);
        setNewEntryData({}); // Clear new entry data
        setEditingEntryId(null); // Clear editing state
      } else {
        setError(data.message || 'Failed to fetch entries.');
      }
    } catch (err) {
      setError('Network error fetching entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    if (tableName) {
      fetchEntries(tableName);
    } else {
      setEntries([]);
    }
  };

  const handleAddEntry = async () => {
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/DbManagement/add-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tableName: selectedTable, entry: newEntryData }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchEntries(selectedTable);
      } else {
        setError(data.message || 'Failed to add entry.');
      }
    } catch (err) {
      setError('Network error adding entry.');
    }
  };

  const handleEditEntry = (entry) => {
    setNewEntryData({ ...entry }); // Populate form with entry data
    setEditingEntryId(entry.id); // Set ID for editing
  };

  const handleUpdateEntry = async () => {
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/DbManagement/update-entry`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tableName: selectedTable, entryId: editingEntryId, updatedEntry: newEntryData }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchEntries(selectedTable);
      } else {
        setError(data.message || 'Failed to update entry.');
      }
    } catch (err) {
      setError('Network error updating entry.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm(`Are you sure you want to delete entry ${entryId}?`)) return;
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/DbManagement/delete-entry`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tableName: selectedTable, entryId: entryId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchEntries(selectedTable);
      } else {
        setError(data.message || 'Failed to delete entry.');
      }
    } catch (err) {
      setError('Network error deleting entry.');
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      // For arrays, join them with a comma. For objects, stringify them.
      return Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
    }
    return value.toString();
  };

  return (
    <div className="card">
      <h2>Database Entry Management 🗄️</h2>
      <div className="form-group">
        <label>Select Table:</label>
        <select value={selectedTable} onChange={(e) => handleTableSelect(e.target.value)}>
          <option value="">-- Select a Table --</option>
          {tables.map(table => (
            <option key={table.name} value={table.name}>{table.name}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading entries...</p>}
      {error && <p className="error">{error}</p>}

      {selectedTable && (
        <>
          <h3>Entries for {selectedTable}</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                {entries.length > 0 && Object.keys(entries[0]).filter(k => k !== 'id').map(key => <th key={key}>{key}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.id}</td>
                  {Object.entries(entry)
                    .filter(([key]) => key !== 'id')
                    .map(([key, value]) => (
                      <td key={key}>{formatValue(value)}</td>
                  ))}
                  <td>
                    {/* ... buttons ... */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>{editingEntryId ? 'Edit Entry' : 'Add New Entry'}</h3>
          <div className="form-group-inline">
            {entries.length > 0 && Object.keys(entries[0]).filter(k => k !== 'id').map(key => (
              <div key={key} className="form-group">
                <label>{key}:</label>
                <input
                  type="text"
                  value={formatValue(newEntryData[key] || '')}
                  onChange={(e) => setNewEntryData({ ...newEntryData, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          {editingEntryId ? (
            <button className="button success" onClick={handleUpdateEntry}>Update Entry</button>
          ) : (
            <button className="button primary" onClick={handleAddEntry}>Add Entry</button>
          )}
           <button className="button secondary" onClick={() => { setNewEntryData({}); setEditingEntryId(null); }}>Clear Form</button>
        </>
      )}
    </div>
  );
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [editingUserId, setEditingUserId] = useState(null);

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

  const handleEditUser = (user) => {
    setNewUser({ username: user.username, password: '', role: user.role });
    setEditingUserId(user.id);
  };

  const handleUpdateUser = async () => {
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/update-user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: editingUserId, ...newUser }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setNewUser({ username: '', password: '', role: 'user' });
        setEditingUserId(null);
        fetchUsers();
      } else {
        setError(data.message || 'Failed to update user.');
      }
    } catch (err) {
      setError('Network error updating user.');
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/UserManagement/toggle-user-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        setError(data.message || 'Failed to update user status.');
      }
    } catch (err) {
      setError('Network error updating user status.');
    }
  };

  return (
    <div className="card">
      <h2>User Management 👥</h2>
      {loading && <p>Loading users...</p>}
      {error && <p className="error">{error}</p>}

      <h3>{editingUserId ? 'Edit User' : 'Create New User'}</h3>
      <div className="form-group-inline">
        <div className="form-group">
          <label>Username:</label>
          <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
        </div>
        {!editingUserId && ( // Password only for creation
          <div className="form-group">
            <label>Password:</label>
            <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          </div>
        )}
        <div className="form-group">
          <label>Role:</label>
          <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="user">User</option>
            <option value="dba">DBA</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      {editingUserId ? (
        <button className="button success" onClick={handleUpdateUser}>Update User</button>
      ) : (
        <button className="button primary" onClick={handleCreateUser}>Create User</button>
      )}
      <button className="button secondary" onClick={() => { setNewUser({ username: '', password: '', role: 'user' }); setEditingUserId(null); }}>Clear Form</button>


      <h3>Existing Users</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Yes' : 'No'}</td>
              <td>
                <button className="button small" onClick={() => handleEditUser(user)}>Edit</button>
                <button
                  className={`button small ${user.isActive ? 'danger' : 'success'}`}
                  onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                >
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
      <h2>Role-Based Access Control 🔒</h2>
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
      <button className="button primary" onClick={handleAssignRole}>Assign Role</button>
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
      <h2>Activity History / Audit Logs 📜</h2>
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
      <h2>Database Configuration ⚙️</h2>
      {success && <p className="success">{success}</p>}
      {config && (
        <div className="form-group-grid">
          {Object.entries(config).map(([key, value]) => (
            <div className="form-group" key={key}>
              <label>{key}:</label>
              <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => handleConfigChange(key, e.target.value)}
              />
            </div>
          ))}
          <button className="button primary" onClick={handleUpdateConfig}>Update Configuration</button>
        </div>
      )}
    </div>
  );
};

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
      <h2>Alert System 🚨</h2>
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

const HelpDocumentationPage = () => (
  <div className="card">
    <h2>Help / Documentation 📖</h2>
    <h3>Dashboard</h3>
    <p>Provides a quick overview of database health and performance metrics.</p>
    <h3>Database Entry Management</h3>
    <p>Allows DBAs to view, add, edit, and delete records within selected database tables. Use with caution!</p>
    <h3>User Management</h3>
    <p>Create, modify, activate, or deactivate user accounts, including setting initial passwords and roles.</p>
    <h3>Role-Based Access Control</h3>
    <p>Assign specific roles (e.g., 'DBA', 'User', 'Admin') to users to manage their privileges across the system.</p>
    <h3>Activity History / Audit Logs</h3>
    <p>View a chronological record of all significant actions performed by users and the system.</p>
    <h3>Database Configuration</h3>
    <p>Update critical database parameters directly from the web interface. Requires extreme caution and understanding of the impact.</p>
    <h3>Alert System</h3>
    <p>Displays real-time alerts for security incidents (like anomalous behavior detected by CBBA) or critical performance issues.</p>
    <h3>Website Administration</h3>
    <p>Manage static content or metadata of this administration website.</p>
  </div>
);

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
      <h2>Website Administration ⚙️</h2>
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
      <button className="button primary" onClick={handleUpdateContent}>Update Content</button>
    </div>
  );
};


// --- END Placeholder Components for DBA Functions ---


function App() {
  const [biometricEvents, setBiometricEvents] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [cbbaStatus, setCbbaStatus] = useState('CBBA Monitoring started...');
  const [lastCbbaScore, setLastCbbaScore] = useState(null);
  const isSendingCbba = useRef(false);

  // Authentication & Navigation State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard'); // Default page after login

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const user = localStorage.getItem('current_user');
    const role = localStorage.getItem('user_role');
    if (token && user && role) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      setUserRole(role);
      // Re-initialize session ID for CBBA
      setSessionId(uuidv4());
    } else {
      setCurrentPage('login');
    }
  }, []);

  const handleLogin = (token, username, role) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('current_user', username);
    localStorage.setItem('user_role', role);
    setIsAuthenticated(true);
    setCurrentUser(username);
    setUserRole(role);
    setSessionId(uuidv4()); // Start new CBBA session
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole(null);
    setBiometricEvents([]); // Clear CBBA data
    setSessionId('');
    setCbbaStatus('CBBA Monitoring stopped.');
    setLastCbbaScore(null);
    setCurrentPage('login');
    alert('Logged out successfully.');
  };


  // --- CBBA Event Listeners (Same as before, modified slightly for App.js structure) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // Generate a new session ID when component mounts or user logs in
    setSessionId(uuidv4());

    const handleKeyPress = (event) => {
      const newEvent = { type: 'key_press', key: event.key, time: Date.now() / 1000 };
      setBiometricEvents((prev) => [...prev, newEvent]);
    };

    const handleKeyRelease = (event) => {
      const newEvent = { type: 'key_release', key: event.key, time: Date.now() / 1000 };
      setBiometricEvents((prev) => [...prev, newEvent]);
    };

    const handleMouseMove = (event) => {
      const newEvent = { type: 'mouse_move', x: event.clientX, y: event.clientY, time: Date.now() / 1000 };
      setBiometricEvents((prev) => [...prev, newEvent]);
    };

    const handleMouseDown = (event) => {
      const newEvent = { type: 'mouse_click', button: event.button, pressed: true, x: event.clientX, y: event.clientY, time: Date.now() / 1000 };
      setBiometricEvents((prev) => [...prev, newEvent]);
    };

    const handleMouseUp = (event) => {
      const newEvent = { type: 'mouse_click', button: event.button, pressed: false, x: event.clientX, y: event.clientY, time: Date.now() / 1000 };
      setBiometricEvents((prev) => [...prev, newEvent]);
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyRelease);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isAuthenticated]);


  useEffect(() => {
    if (!isAuthenticated || !sessionId) return; // Only send if authenticated

    const interval = setInterval(async () => {
      if (biometricEvents.length === 0 || isSendingCbba.current) {
        return;
      }

      isSendingCbba.current = true;
      const currentEvents = [...biometricEvents];
      setBiometricEvents([]); // Clear the buffer after copying

      try {
        setCbbaStatus('Sending CBBA data...');
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Biometric/collect-biometrics?sessionId=${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Send JWT token with CBBA data
          },
          body: JSON.stringify(currentEvents),
        });

        if (response.ok) {
          const data = await response.json();
          setLastCbbaScore(data.score);
          if (response.status === 200) {
            setCbbaStatus(`CBBA: Normal behavior. Score: ${data.score.toFixed(4)}`);
          } else if (response.status === 403) {
            setCbbaStatus(`!!! CBBA ANOMALY DETECTED !!! Score: ${data.score.toFixed(4)} - Session Locked!`);
            // Trigger actual logout/lock
            handleLogout();
            alert('Security Anomaly Detected! Your session has been terminated.');
          }
        } else {
          const errorData = await response.json();
          setCbbaStatus(`CBBA Error: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('CBBA Network or API error:', error);
        setCbbaStatus(`CBBA Network Error: ${error.message}`);
      } finally {
        isSendingCbba.current = false;
      }
    }, COLLECTION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [biometricEvents, sessionId, isAuthenticated]); // Rerun if these change

  // --- Render based on authentication and current page ---
  const renderPage = () => {
    if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'db_entry_management': return <DbEntryManagementPage />;
      case 'user_management': return <UserManagementPage />;
      case 'role_management': return <RoleBasedAccessControlPage />;
      case 'activity_log': return <ActivityLogPage />;
      case 'db_config': return <DbConfigurationPage />;
      case 'alert_system': return <AlertSystemPage />;
      case 'help': return <HelpDocumentationPage />;
      case 'website_admin': return <WebsiteAdministrationPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <style>{`
        /* Clean White Background Admin Console Theme */
        body { margin: 0; font-family: 'Inter', sans-serif; background-color: #ffffff; color: #000000; }
        .app-container { display: flex; min-height: 100vh; background-color: #f8f9fa; }
        .sidebar { width: 250px; background-color: #ffffff; color: #000000; padding: 20px; box-shadow: 2px 0 10px rgba(0,0,0,0.1); display: flex; flex-direction: column; border-right: 1px solid #e0e0e0; }
        .sidebar h1 { text-align: center; color: #000000; margin-bottom: 30px; font-size: 1.8em; font-weight: 600; }
        .sidebar-nav ul { list-style: none; padding: 0; margin: 0; }
        .sidebar-nav li { margin-bottom: 8px; }
        .sidebar-nav button {
          background: none;
          border: none;
          padding: 12px 15px;
          text-align: left;
          width: 100%;
          cursor: pointer;
          font-size: 1.0em;
          border-radius: 8px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }
        .sidebar-nav button:hover { background-color: #f8f9fa; color: #000000; }
        .sidebar-nav button.active { background-color: #e3f2fd; color: #1976d2; font-weight: 500; }
        .main-content { flex-grow: 1; padding: 24px; background-color: #f8f9fa; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background-color: #ffffff; padding: 16px 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e0e0e0; }
        .header h2 { margin: 0; color: #000000; font-weight: 600; }
        .user-info { display: flex; align-items: center; }
        .user-info span { margin-right: 16px; font-weight: 500; color: #6c757d; }
        .logout-button { background-color: #dc3545; color: #ffffff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease; font-weight: 500; }
        .logout-button:hover { background-color: #c82333; }

        .cbba-monitoring {
            background-color: #f8f9fa;
            color: #000000;
            padding: 16px;
            border-radius: 8px;
            font-size: 0.9em;
            margin-top: auto; /* Pushes it to the bottom of the sidebar */
            border: 1px solid #e0e0e0;
        }
        .cbba-monitoring h3 {
            margin: 0 0 12px 0;
            font-size: 1em;
            font-weight: 600;
            color: #000000;
        }
        .cbba-status-item, .cbba-risk-score {
            margin-bottom: 8px;
        }
        .cbba-monitoring span.normal { color: #28a745; font-weight: 600; }
        .cbba-monitoring span.anomaly { color: #dc3545; font-weight: 600; }
        
        /* Icon spacing for sidebar navigation */
        .sidebar-nav button {
          justify-content: flex-start;
          gap: 8px;
        }

        .card { background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #000000; }
        .form-group input[type="text"],
        .form-group input[type="password"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: calc(100% - 24px); /* Account for padding */
          padding: 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 1em;
          background-color: #ffffff;
          color: #000000;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .form-group input[type="text"]:focus,
        .form-group input[type="password"]:focus,
        .form-group input[type="number"]:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
        }
        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #6c757d;
        }
        .form-group-inline { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
        .form-group-inline .form-group { flex: 1; min-width: 200px; }
        .form-group-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }


        .button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-right: 12px; /* Spacing between buttons */
        }
        .button.primary { background-color: #1976d2; color: #ffffff; }
        .button.primary:hover { background-color: #1565c0; }
        .button.success { background-color: #28a745; color: #ffffff; }
        .button.success:hover { background-color: #218838; }
        .button.danger { background-color: #dc3545; color: #ffffff; }
        .button.danger:hover { background-color: #c82333; }
        .button.secondary { background-color: #6c757d; color: #ffffff; }
        .button.secondary:hover { background-color: #5a6268; }
        .button.small { padding: 5px 10px; font-size: 0.9em; margin-right: 5px; }

        table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
        th, td { border: none; border-bottom: 1px solid #e0e0e0; padding: 12px 16px; text-align: left; color: #000000; }
        th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:nth-child(odd) { background-color: #ffffff; }
        tr:hover { background-color: #e3f2fd; }
        .error { color: #dc3545; font-weight: 500; margin-top: 10px; }
        .success { color: #28a745; font-weight: 500; margin-top: 10px; }

        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 24px; }
        .metric-item { 
          background-color: #ffffff; 
          padding: 20px; 
          border-radius: 12px; 
          border: 1px solid #e0e0e0; 
          color: #000000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
        }
        .metric-item .icon { 
          margin-right: 16px; 
          font-size: 1.5em; 
          padding: 12px; 
          border-radius: 8px; 
          background-color: #f8f9fa;
        }
        .metric-item .content h3 { 
          margin: 0 0 4px 0; 
          font-size: 1.8em; 
          font-weight: 600; 
          color: #000000;
        }
        .metric-item .content p { 
          margin: 0; 
          color: #6c757d; 
          font-size: 0.9em;
        }

        /* Alert styling - Clean colors for white background */
        .alert-row.critical, tr.critical { background-color: #ffeaea; border-left: 4px solid #dc3545; }
        .alert-row.high, tr.high { background-color: #fff3cd; border-left: 4px solid #fd7e14; }
        .alert-row.medium, tr.medium { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .alert-row.low, tr.low { background-color: #d1edff; border-left: 4px solid #28a745; }
        
        /* Status indicators */
        .status-active { color: #fd7e14; font-weight: 500; }
        .status-resolved { color: #28a745; font-weight: 500; }
        .status-dismissed { color: #6c757d; font-weight: 500; }
        
        /* Dashboard Activity and Health sections */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .activity-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .activity-item:last-child {
          border-bottom: none;
        }
        .activity-icon {
          margin-right: 12px;
          font-size: 0.8em;
        }
        .activity-text {
          flex: 1;
          color: #000000;
        }
        .activity-time {
          font-size: 0.85em;
          color: #6c757d;
        }
        
        .health-metrics {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .health-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        .health-item span:first-child {
          color: #000000;
        }
        .health-value {
          font-weight: 600;
          color: #1976d2;
        }
      `}</style>

      {isAuthenticated && (
        <div className="sidebar">
          <h1>DBA Console</h1>
          <nav className="sidebar-nav">
            <ul>
              <li><button className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}><img src={dashboardIcon} alt="Dashboard"/>Dashboard</button></li>
              <li><button className={currentPage === 'db_entry_management' ? 'active' : ''} onClick={() => setCurrentPage('db_entry_management')}>📋 DB Entry Management</button></li>
              <li><button className={currentPage === 'user_management' ? 'active' : ''} onClick={() => setCurrentPage('user_management')}>👥 User Management</button></li>
              <li><button className={currentPage === 'role_management' ? 'active' : ''} onClick={() => setCurrentPage('role_management')}>🛡️ Role Access Control</button></li>
              <li><button className={currentPage === 'activity_log' ? 'active' : ''} onClick={() => setCurrentPage('activity_log')}>📋 Activity Logs</button></li>
              <li><button className={currentPage === 'db_config' ? 'active' : ''} onClick={() => setCurrentPage('db_config')}>⚙️ DB Configuration</button></li>
              <li><button className={currentPage === 'alert_system' ? 'active' : ''} onClick={() => setCurrentPage('alert_system')}>⚠️ Alert System</button></li>
              <li><button className={currentPage === 'website_admin' ? 'active' : ''} onClick={() => setCurrentPage('website_admin')}>🌐 Website Admin</button></li>
              <li><button className={currentPage === 'help' ? 'active' : ''} onClick={() => setCurrentPage('help')}>❓ Help / Docs</button></li>
            </ul>
          </nav>
          <div className="cbba-monitoring">
            <h3>🔬 CBBA Monitoring</h3>
            <div className="cbba-status-item">
              <span>⚡ Status: <span className={lastCbbaScore !== null && lastCbbaScore < 0 ? 'anomaly' : 'normal'}>
                        {cbbaStatus}
                      </span></span>
            </div>
            <div className="cbba-risk-score">
              <span>📈 Risk Score: 
                <span className={lastCbbaScore !== null && lastCbbaScore < 0 ? 'anomaly' : 'normal'}>
                  {lastCbbaScore !== null ? ` ${lastCbbaScore.toFixed(2)}%` : ' N/A'}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {isAuthenticated && (
          <div className="header">
            <h2>{currentPage.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h2>
            <div className="user-info">
              <span>Logged in as: <strong>{currentUser}</strong> ({userRole})</span>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        )}
        {renderPage()}
      </div>
    </div>
  );
}

export default App;