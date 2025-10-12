// frontend/src/components/Layout/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarIcon from '../SidebarIcon';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    // Close mobile menu on navigation
    if (onClose) onClose();
  };

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { key: 'db_entry_management', label: 'DB Entry Management', icon: 'db_entry_management', path: '/db-management' },
    { key: 'user_management', label: 'User Management', icon: 'user_management', path: '/user-management' },
    { key: 'role_management', label: 'Role Access Control', icon: 'role_management', path: '/role-management' },
    { key: 'activity_log', label: 'Activity Logs', icon: 'activity_log', path: '/activity-log' },
    { key: 'db_config', label: 'DB Configuration', icon: 'db_config', path: '/db-config' },
    { key: 'alert_system', label: 'Alert System', icon: 'alert_system', path: '/alerts' },
    { key: 'website_admin', label: 'Website Admin', icon: 'website_admin', path: '/website-admin' },
    { key: 'help', label: 'Help / Docs', icon: 'help', path: '/help' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <h1>DBA Console</h1>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map(item => (
            <li key={item.key}>
              <button 
                className={location.pathname === item.path ? 'active' : ''} 
                onClick={() => handleNavigation(item.path)}
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