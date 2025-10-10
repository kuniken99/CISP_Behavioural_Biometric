// frontend/src/components/SidebarIcon.js
import React from 'react';

// Import all the SVG icons
import dashboardIcon from '../assets/dashboard-icon.svg';
import dbEntryManagementIcon from '../assets/db-entry-management-icon.svg';
import userManagementIcon from '../assets/user-management-icon.svg';
import roleManagementIcon from '../assets/role-access-control-icon.svg';
import activityLogIcon from '../assets/activity-logs-icon.svg';
import dbConfigIcon from '../assets/db-configuration-icon.svg';
import alertSystemIcon from '../assets/alert-system-icon.svg';
import websiteAdminIcon from '../assets/website-admin-icon.svg';
import helpIcon from '../assets/help-icon.svg';

const SidebarIcon = ({ type }) => {
  const iconMap = {
    dashboard: dashboardIcon,
    db_entry_management: dbEntryManagementIcon,
    user_management: userManagementIcon,
    role_management: roleManagementIcon,
    activity_log: activityLogIcon,
    db_config: dbConfigIcon,
    alert_system: alertSystemIcon,
    website_admin: websiteAdminIcon,
    help: helpIcon,
  };

  const iconSrc = iconMap[type];

  if (!iconSrc) {
    // Fallback if icon not found
    return (
      <div style={{
        width: '20px',
        height: '20px',
        backgroundColor: '#666666',
        borderRadius: '3px',
        flexShrink: 0
      }}></div>
    );
  }

  return (
    <img 
      src={iconSrc} 
      alt={`${type} icon`}
      style={{
        width: '20px',
        height: '20px',
        flexShrink: 0
      }}
    />
  );
};

export default SidebarIcon;
