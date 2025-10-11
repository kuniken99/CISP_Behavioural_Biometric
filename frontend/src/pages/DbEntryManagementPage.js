import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import DbEntryManagementIcon from '../assets/db-entry-management-icon.svg';
import AddTaskIcon from '../assets/add-task-icon.svg';
import EditIcon from '../assets/edit-icon.svg';
import ArrowBackIcon from '../assets/arrow-back-icon.svg';

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
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label>Select Table:</label>
          <select 
            value={selectedTable} 
            onChange={(e) => handleTableSelect(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          >
            <option value="">-- Select a Table --</option>
            {tables.map(table => (
              <option key={table.name} value={table.name}>{table.name}</option>
            ))}
          </select>
        </div>
      </form>

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
                    <button type="button" onClick={() => handleEditEntry(entry)} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '5px' }}>
                      <img src={EditIcon} alt="Edit" style={{ width: '16px', height: '16px' }} />
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteEntry(entry.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>{editingEntryId ? 'Edit Entry' : 'Add New Entry'}</h3>
          <form onSubmit={(e) => e.preventDefault()} className="form-group-inline">
            {entries.length > 0 && Object.keys(entries[0]).filter(k => k !== 'id').map(key => (
              <div key={key} className="form-group">
                <label>{key}:</label>
                <input
                  type="text"
                  value={formatValue(newEntryData[key] || '')}
                  onChange={(e) => setNewEntryData({ ...newEntryData, [key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            ))}
          </form>
          {editingEntryId ? (
            <button type="button" className="button success" onClick={handleUpdateEntry} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={EditIcon} alt="Update" style={{ width: '16px', height: '16px' }} />
              Update Entry
            </button>
          ) : (
            <button type="button" className="button primary" onClick={handleAddEntry} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={AddTaskIcon} alt="Add" style={{ width: '16px', height: '16px' }} />
              Add Entry
            </button>
          )}
           <button type="button" className="button secondary" onClick={() => { setNewEntryData({}); setEditingEntryId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <img src={ArrowBackIcon} alt="Clear" style={{ width: '16px', height: '16px' }} />
             Clear Form
           </button>
        </>
      )}
    </div>
  );
};

export default DbEntryManagementPage;