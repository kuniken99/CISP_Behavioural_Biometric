// frontend/src/components/Layout/Header.js
import React from 'react';
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

const Header = ({ currentPage, currentUser, userRole, handleLogout, setCurrentPage }) => {
  const formatPageName = (page) => {
    return page.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPageIcon = (page) => {
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
    return iconMap[page] || DashboardIcon;
  };

  const handleProfileClick = () => {
    setCurrentPage('user_profile');
  };

  return (
    <div className="header">
      <div className="header-title">
        <img src={getPageIcon(currentPage)} alt={formatPageName(currentPage)} className="page-icon" />
        <h2>{formatPageName(currentPage)}</h2>
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