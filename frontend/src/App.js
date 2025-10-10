// frontend/src/App.js

import React from 'react';
import useAuth from './hooks/useAuth';
import useBiometricTracking from './hooks/useBiometricTracking';
import Footer from './components/Footer';
import CBBAMonitor from './components/CBBAMonitor';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

// Import all page components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DbEntryManagementPage from './pages/DbEntryManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleBasedAccessControlPage from './pages/RoleBasedAccessControlPage';
import ActivityLogPage from './pages/ActivityLogPage';
import DbConfigurationPage from './pages/DbConfigurationPage';
import AlertSystemPage from './pages/AlertSystemPage';
import HelpDocumentationPage from './pages/HelpDocumentationPage';
import WebsiteAdministrationPage from './pages/WebsiteAdministrationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import UserProfilePage from './pages/UserProfilePage';

// Import styles
import './styles/App.css';

function App() {
  const {
    isAuthenticated,
    currentUser,
    userRole,
    currentPage,
    setCurrentPage,
    handleLogin,
    handleLogout
  } = useAuth();

  // eslint-disable-next-line no-unused-vars
  const { cbbaStatus, lastCbbaScore, sessionId } = useBiometricTracking(isAuthenticated, handleLogout);

  // Render page based on current page state
  const renderPage = () => {
    if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'dashboard': 
        return <DashboardPage />;
      case 'db_entry_management': 
        return <DbEntryManagementPage />;
      case 'user_management': 
        return <UserManagementPage />;
      case 'role_management': 
        return <RoleBasedAccessControlPage />;
      case 'activity_log': 
        return <ActivityLogPage />;
      case 'db_config': 
        return <DbConfigurationPage />;
      case 'alert_system': 
        return <AlertSystemPage />;
      case 'help': 
        return <HelpDocumentationPage />;
      case 'website_admin': 
        return <WebsiteAdministrationPage />;
      case 'privacy_policy': 
        return <PrivacyPolicyPage />;
      case 'terms_conditions': 
        return <TermsOfUsePage />;
      case 'user_profile': 
        return <UserProfilePage currentUser={currentUser} userRole={userRole} />;
      default: 
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <div className="main-app-wrapper">
        {isAuthenticated && (
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        )}

        <div className="main-content">
          {isAuthenticated && (
            <Header 
              currentPage={currentPage}
              currentUser={currentUser}
              userRole={userRole}
              handleLogout={handleLogout}
              setCurrentPage={setCurrentPage}
            />
          )}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderPage()}
          </div>
        </div>
      </div>
      
      <Footer onNavigate={setCurrentPage} />
      
      {/* Floating CBBA Monitor */}
      {isAuthenticated && (
        <CBBAMonitor 
          status="Active" 
          riskScore={lastCbbaScore ? Math.round(Math.abs(lastCbbaScore * 100)) : 12}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}

export default App;