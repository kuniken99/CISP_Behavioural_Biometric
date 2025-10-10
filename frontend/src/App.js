// frontend/src/App.js

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import Footer from './components/Footer';
import CBBAMonitor from './components/CBBAMonitor';
import SidebarIcon from './components/SidebarIcon';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfUsePage from './pages/TermsOfUsePage';

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
          <div className="metric-item"><strong>Uptime:</strong> {metrics.uptime}</div>
          <div className="metric-item"><strong>CPU Usage:</strong> {metrics.cpuUsage}%</div>
          <div className="metric-item"><strong>Memory Usage:</strong> {metrics.memoryUsage} MB</div>
          <div className="metric-item"><strong>Database Size:</strong> {metrics.databaseSize} GB</div>
          <div className="metric-item"><strong>Active Users:</strong> {metrics.activeUsers}</div>
          <div className="metric-item"><strong>Transactions/Sec:</strong> {metrics.transactionsPerSecond}</div>
        </div>
      ) : (
        <p>No metrics available.</p>
      )}
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
      case 'privacy_policy': return <PrivacyPolicyPage />;
      case 'terms_conditions': return <TermsOfUsePage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <style>{`
        /* Basic CSS for the Admin Console */
        body { margin: 0; font-family: 'Inter', sans-serif; background-color: #ffffff; color: #000000; }
        .app-container { display: flex; flex-direction: column; min-height: 100vh; background-color: #ffffff; }
        .main-app-wrapper { display: flex; flex: 1; }
        .sidebar { width: 250px; background-color: #f8f9fa; color: #000000; padding: 20px; box-shadow: 2px 0 5px rgba(0,0,0,0.1); display: flex; flex-direction: column; border-right: 1px solid #e5e7eb; min-height: 95vh; }
        .sidebar h1 { text-align: center; color: #000000; margin-bottom: 30px; font-size: 1.8em; }
        .sidebar-nav ul { list-style: none; padding: 0; margin: 0; }
        .sidebar-nav li { margin-bottom: 10px; }
        .sidebar-nav { flex: 1; overflow-y: auto; margin-bottom: 10px; }
        .sidebar-nav button {
          background: none;
          border: none;
          color: #000000;
          padding: 12px 16px;
          text-align: left;
          width: 100%;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 500;
          border-radius: 8px;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sidebar-nav button:hover { background-color: #e9ecef; }
        .sidebar-nav button.active { background-color: #007bff; color: #ffffff; }
        .main-content { flex-grow: 1; padding: 25px 30px 20px; background-color: #ffffff; display: flex; flex-direction: column; overflow-y: auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background-color: #ffffff; padding: 20px 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .header h2 { margin: 0; color: #000000; font-size: 1.8rem; font-weight: 600; }
        .user-info { display: flex; align-items: center; }
        .user-info span { margin-right: 15px; font-weight: 600; color: #000000; font-size: 1.1rem; }
        .logout-button { background-color: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: background-color 0.3s ease; font-size: 1rem; font-weight: 500; }
        .logout-button:hover { background-color: #c0392b; }



        .card { background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #000000; }
        .form-group input[type="text"],
        .form-group input[type="password"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: calc(100% - 22px); /* Account for padding */
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1em;
        }
        .form-group-inline { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
        .form-group-inline .form-group { flex: 1; min-width: 200px; }
        .form-group-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }


        .button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          transition: background-color 0.3s ease;
          margin-right: 10px; /* Spacing between buttons */
        }
        .button.primary { background-color: #3498db; color: white; }
        .button.primary:hover { background-color: #2980b9; }
        .button.success { background-color: #2ecc71; color: white; }
        .button.success:hover { background-color: #27ae60; }
        .button.danger { background-color: #e74c3c; color: white; }
        .button.danger:hover { background-color: #c0392b; }
        .button.secondary { background-color: #bdc3c7; color: #000000; }
        .button.secondary:hover { background-color: #95a5a6; }
        .button.small { padding: 5px 10px; font-size: 0.9em; margin-right: 5px; }

        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .error { color: #e74c3c; font-weight: bold; margin-top: 10px; }
        .success { color: #2ecc71; font-weight: bold; margin-top: 10px; }

        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric-item { background-color: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #eee; }

        /* Alert styling */
        .alert-row.critical { background-color: #fce4e4; }
        .alert-row.high { background-color: #ffe0b2; }
        .alert-row.medium { background-color: #fff9c4; }
        .alert-row.low { background-color: #e8f5e9; }

        /* Footer Styles */
        .footer {
          background-color: #f8f9fa;
          border-top: 1px solid #e5e7eb;
          margin-top: auto;
          padding: 40px 0 20px 0;
          width: 100%;
          color: #000000;
          position: relative;
          z-index: 1;
        }
        
        .footer-cbba-container {
          position: absolute;
          bottom: 100%;
          left: 0px;
          margin-bottom: 0px;
          z-index: 10;
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 40px;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }
        }
        
        .footer-section h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #000000;
          margin: 0 0 15px 0;
        }
        
        .footer-section p {
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
          max-width: 400px;
        }
        
        .footer-links {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .footer-link {
          color: #374151;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
          padding: 8px 0;
        }
        
        .footer-link:hover {
          color: #007bff;
          text-decoration: underline;
        }
        
        .footer-divider {
          color: #9ca3af;
          font-weight: 300;
        }
        
        .footer-copyright {
          text-align: center;
          padding: 20px 30px 0;
          border-top: 1px solid #e5e7eb;
          margin-top: 30px;
        }
        
        .footer-copyright p {
          color: #9ca3af;
          font-size: 0.9rem;
          margin: 0;
        }
        
        /* CBBA Monitor - Match sidebar width */
        .cbba-monitor {
          width: 250px !important; /* Same as sidebar width */
        }
        
        /* Responsive adjustments for CBBA Monitor */
        @media (max-width: 768px) {
          .footer-cbba-container {
            left: 0px;
            position: relative;
            bottom: auto;
            margin-bottom: 20px;
          }
          
          .cbba-monitor {
            width: 230px !important; /* Slightly smaller for mobile */
          }
        }
        
        @media (max-width: 480px) {
          .footer-cbba-container {
            left: 0px;
          }
          
          .cbba-monitor {
            width: calc(100vw - 40px) !important;
            max-width: 250px !important;
          }
        }
      `}</style>

      <div className="main-app-wrapper">
        {isAuthenticated && (
          <div className="sidebar">
          <h1>DBA Console</h1>
          <nav className="sidebar-nav">
            <ul>
              <li>
                <button className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>
                  <SidebarIcon type="dashboard" />
                  Dashboard
                </button>
              </li>
              <li>
                <button className={currentPage === 'db_entry_management' ? 'active' : ''} onClick={() => setCurrentPage('db_entry_management')}>
                  <SidebarIcon type="db_entry_management" />
                  DB Entry Management
                </button>
              </li>
              <li>
                <button className={currentPage === 'user_management' ? 'active' : ''} onClick={() => setCurrentPage('user_management')}>
                  <SidebarIcon type="user_management" />
                  User Management
                </button>
              </li>
              <li>
                <button className={currentPage === 'role_management' ? 'active' : ''} onClick={() => setCurrentPage('role_management')}>
                  <SidebarIcon type="role_management" />
                  Role Access Control
                </button>
              </li>
              <li>
                <button className={currentPage === 'activity_log' ? 'active' : ''} onClick={() => setCurrentPage('activity_log')}>
                  <SidebarIcon type="activity_log" />
                  Activity Logs
                </button>
              </li>
              <li>
                <button className={currentPage === 'db_config' ? 'active' : ''} onClick={() => setCurrentPage('db_config')}>
                  <SidebarIcon type="db_config" />
                  DB Configuration
                </button>
              </li>
              <li>
                <button className={currentPage === 'alert_system' ? 'active' : ''} onClick={() => setCurrentPage('alert_system')}>
                  <SidebarIcon type="alert_system" />
                  Alert System
                </button>
              </li>
              <li>
                <button className={currentPage === 'website_admin' ? 'active' : ''} onClick={() => setCurrentPage('website_admin')}>
                  <SidebarIcon type="website_admin" />
                  Website Admin
                </button>
              </li>
              <li>
                <button className={currentPage === 'help' ? 'active' : ''} onClick={() => setCurrentPage('help')}>
                  <SidebarIcon type="help" />
                  Help / Docs
                </button>
              </li>
            </ul>
          </nav>

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
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderPage()}
        </div>
      </div>
      </div>
      
      <Footer onNavigate={setCurrentPage} cbbaComponent={
        isAuthenticated ? (
          <CBBAMonitor 
            status="Active" 
            riskScore={lastCbbaScore ? Math.round(Math.abs(lastCbbaScore * 100)) : 12}
            isAuthenticated={isAuthenticated}
          />
        ) : null
      } />
    </div>
  );
}

export default App;