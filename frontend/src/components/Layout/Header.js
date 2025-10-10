// frontend/src/components/Layout/Header.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LogoutIcon from '../../assets/logout-icon.svg';
import ProfileIcon from '../../assets/profile-icon.svg';
// Page Icons
import DashboardIcon from '../../assets/dashboard-icon.svg';
import DbEntryManagementIcon from '../../assets/db-entry-management-icon.svg';
import UserManagementIcon from '../../assets/user-management-icon.svg';
import RoleAccessControlIcon from '../../assets/role-access-control-icon.svg';
import ActivityLogsIcon from '../../assets/activity-logs-icon.svg';
import DbConfigurationIcon from '../../assets/db-configuration-icon.svg';
import AlertSystemIcon from '../../assets/alert-system-icon.svg';
import HelpIcon from '../../assets/help-icon.svg';
import WebsiteAdminIcon from '../../assets/website-admin-icon.svg';
import ShieldIcon from '../../assets/shield-icon.svg';

const Header = ({ currentUser, userRole, handleLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Map URL paths to display names
  const getPageInfo = (pathname) => {
    const pageMap = {
      '/dashboard': { name: 'Dashboard', key: 'dashboard' },
      '/db-management': { name: 'DB Entry Management', key: 'db_entry_management' },
      '/user-management': { name: 'User Management', key: 'user_management' },
      '/role-management': { name: 'Role Access Control', key: 'role_management' },
      '/activity-log': { name: 'Activity Logs', key: 'activity_log' },
      '/db-config': { name: 'DB Configuration', key: 'db_config' },
      '/alerts': { name: 'Alert System', key: 'alert_system' },
      '/help': { name: 'Help / Docs', key: 'help' },
      '/website-admin': { name: 'Website Admin', key: 'website_admin' },
      '/privacy-policy': { name: 'Privacy Policy', key: 'privacy_policy' },
      '/terms-conditions': { name: 'Terms & Conditions', key: 'terms_conditions' },
      '/profile': { name: 'User Profile', key: 'user_profile' }
    };
    return pageMap[pathname] || { name: 'Dashboard', key: 'dashboard' };
  };

  const getPageIcon = (pageKey) => {
    const iconMap = {
      'dashboard': DashboardIcon,
      'db_entry_management': DbEntryManagementIcon,
      'user_management': UserManagementIcon,
      'role_management': RoleAccessControlIcon,
      'activity_log': ActivityLogsIcon,
      'db_config': DbConfigurationIcon,
      'alert_system': AlertSystemIcon,
      'help': HelpIcon,
      'website_admin': WebsiteAdminIcon,
      'privacy_policy': ShieldIcon,
      'terms_conditions': ShieldIcon,
      'user_profile': ProfileIcon
    };
    return iconMap[pageKey] || DashboardIcon;
  };

  const currentPageInfo = getPageInfo(location.pathname);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="header">
      <div className="header-title">
        <img src={getPageIcon(currentPageInfo.key)} alt={currentPageInfo.name} className="page-icon" />
        <h2>{currentPageInfo.name}</h2>
      </div>
      <div className="user-info">
        <button 
          className="profile-button" 
          onClick={handleProfileClick}
          title="View Profile"
        >
          <img src={ProfileIcon} alt="Profile" className="profile-icon" />
        </button>
        <span>Logged in as: <strong>{currentUser}</strong> ({userRole})</span>
        <button 
          className="logout-button" 
          onClick={handleLogout}
        >
          <img src={LogoutIcon} alt="Logout" className="logout-icon" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;