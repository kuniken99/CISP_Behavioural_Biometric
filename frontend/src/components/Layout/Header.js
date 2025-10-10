// frontend/src/components/Layout/Header.js
import React from 'react';
import LogoutIcon from '../../assets/logout-icon.svg';

const Header = ({ currentPage, currentUser, userRole, handleLogout }) => {
  const formatPageName = (page) => {
    return page.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="header">
      <h2>{formatPageName(currentPage)}</h2>
      <div className="user-info">
        <span>Logged in as: <strong>{currentUser}</strong> ({userRole})</span>
        <button 
          className="logout-button" 
          onClick={handleLogout} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <img src={LogoutIcon} alt="Logout" style={{ width: '16px', height: '16px' }} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;