import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import DbEntryManagementIcon from '../assets/db-entry-management-icon.svg';
import AddTaskIcon from '../assets/add-task-icon.svg';
import EditIcon from '../assets/edit-icon.svg';
import ArrowBackIcon from '../assets/arrow-back-icon.svg';
import DropdownIcon from '../assets/dropdown-icon.svg';

const DbEntryManagementPage = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newEntryData, setNewEntryData] = useState({});
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingEntryData, setEditingEntryData] = useState({});

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
    setEditingEntryId(entry.id);
    setEditingEntryData({ ...entry });
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingEntryData({});
  };

  const handleInlineUpdate = async () => {
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/DbManagement/update-entry`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tableName: selectedTable, entryId: editingEntryId, updatedEntry: editingEntryData }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Entry updated successfully');
        setEditingEntryId(null);
        setEditingEntryData({});
        fetchEntries(selectedTable);
      } else {
        setError(data.message || 'Failed to update entry.');
      }
    } catch (err) {
      setError('Network error updating entry.');
    }
  };

  const handleFormEditEntry = (entry) => {
    setNewEntryData({ ...entry });
    setEditingEntryId(entry.id);
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
        setNewEntryData({});
        setEditingEntryId(null);
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
    <>
      {/* Card 1: Table Selection */}
      <div className="card">
        <h2>Select Table</h2>
        <form onSubmit={(e) => { e.preventDefault(); return false; }}>
          <div className="form-group">
            <div style={{ position: 'relative', display: 'inline-block', width: '250px' }}>
              <select 
                value={selectedTable} 
                onChange={(e) => handleTableSelect(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
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
                <option value="">-- Select a Table --</option>
                {tables.map(table => (
                  <option key={table.name} value={table.name}>{table.name}</option>
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

        {loading && <p>Loading entries...</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {/* Card 2: Entries Display */}
      {selectedTable && (
        <div className="card">
          <h2>Entries for {selectedTable}</h2>
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
                      <td key={key}>
                        {editingEntryId === entry.id ? (
                          <input 
                            type="text" 
                            value={editingEntryData[key] || ''}
                            onChange={(e) => setEditingEntryData({ ...editingEntryData, [key]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleInlineUpdate();
                                return false;
                              }
                              if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          formatValue(value)
                        )}
                      </td>
                  ))}
                  <td>
                    {editingEntryId === entry.id ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button type="button" className="button success small" onClick={handleInlineUpdate}>
                          Save
                        </button>
                        <button type="button" className="button secondary small" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button type="button" className="button secondary small" onClick={() => handleEditEntry(entry)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <img src={EditIcon} alt="Edit" style={{ width: '14px', height: '14px' }} />
                          Edit
                        </button>
                        <button type="button" className="button danger small" onClick={() => handleDeleteEntry(entry.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card 3: Add/Edit Entry Form */}
      {selectedTable && (
        <div className="card">
          <h2>{editingEntryId ? 'Edit Entry' : 'Add New Entry'}</h2>
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); return false; }} className="form-group-inline">
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
                      e.stopPropagation();
                      // If user presses Enter, trigger the appropriate action
                      if (editingEntryId) {
                        handleUpdateEntry();
                      } else {
                        handleAddEntry();
                      }
                      return false;
                    }
                  }}
                />
              </div>
            ))}
          </form>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {editingEntryId ? (
              <button type="button" className="button success" onClick={handleUpdateEntry} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                Update Entry
              </button>
            ) : (
              <button type="button" className="button primary" onClick={handleAddEntry} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                Add Entry
              </button>
            )}
            <button type="button" className="button secondary" onClick={() => { setNewEntryData({}); setEditingEntryId(null); }} style={{ backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ccc' }}>
              Clear Form
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DbEntryManagementPage;