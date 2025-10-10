// frontend/src/components/Layout/Sidebar.js
import React from 'react';
import SidebarIcon from '../SidebarIcon';

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'db_entry_management', label: 'DB Entry Management', icon: 'db_entry_management' },
    { key: 'user_management', label: 'User Management', icon: 'user_management' },
    { key: 'role_management', label: 'Role Access Control', icon: 'role_management' },
    { key: 'activity_log', label: 'Activity Logs', icon: 'activity_log' },
    { key: 'db_config', label: 'DB Configuration', icon: 'db_config' },
    { key: 'alert_system', label: 'Alert System', icon: 'alert_system' },
    { key: 'website_admin', label: 'Website Admin', icon: 'website_admin' },
    { key: 'help', label: 'Help / Docs', icon: 'help' },
  ];

  return (
    <div className="sidebar">
      <h1>DBA Console</h1>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map(item => (
            <li key={item.key}>
              <button 
                className={currentPage === item.key ? 'active' : ''} 
                onClick={() => setCurrentPage(item.key)}
              >
                <SidebarIcon type={item.icon} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom-anchor" id="sidebar-bottom-anchor"></div>
      </nav>
    </div>
  );
};

export default Sidebar;