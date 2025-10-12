// frontend/src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import useBiometricTracking from './hooks/useBiometricTracking';
import Footer from './components/Footer';
import CBBAMonitor from './components/CBBAMonitor';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

// Import all page components
import AuthWrapper from './pages/AuthWrapper';
import SetNewPasswordPage from './pages/SetNewPasswordPage';
import VerifyEmailPage from './VerifyEmailPage';
import ResendVerificationPage from './ResendVerificationPage';
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
import './styles/responsive-system.css';
import './styles/App.css';

function App() {
  const {
    isAuthenticated,
    currentUser,
    userRole,
    handleLogin,
    handleLogout
  } = useAuth();

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Temporarily disable biometric tracking to debug auto-refresh issue
  // eslint-disable-next-line no-unused-vars
  // const { cbbaStatus, lastCbbaScore, sessionId } = useBiometricTracking(isAuthenticated, handleLogout);
  const cbbaStatus = "CBBA: Disabled for debugging";
  const lastCbbaScore = 0;
  const sessionId = null;

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  // Scroll to top component every time the user enter the page
  const ScrollToTop = () => {
    const location = useLocation();
    
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [location.pathname]);
    
    return null;
  };

  // Main Dashboard Layout Component
  const DashboardLayout = ({ children }) => (
    <div className="app-container">
      <ScrollToTop />
      <div className="main-app-wrapper">
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={closeMobileMenu}
        />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Header 
            currentUser={currentUser}
            userRole={userRole}
            handleLogout={handleLogout}
            onToggleMobileMenu={toggleMobileMenu}
            isMobileMenuOpen={isMobileMenuOpen}
          />
          <div className="main-content">
            <div style={{ flex: 1, overflow: 'auto' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-backdrop" 
          onClick={closeMobileMenu}
        />
      )}
      <Footer />
      <CBBAMonitor 
        status="Active" 
        riskScore={lastCbbaScore ? Math.round(Math.abs(lastCbbaScore * 100)) : 12}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="app-container">
                <div className="main-content login-mode">
                  <AuthWrapper onLogin={handleLogin} />
                </div>
              </div>
            )
          } 
        />
        <Route 
          path="/reset-password/:token" 
          element={
            <div className="app-container">
              <div className="main-content login-mode">
                <SetNewPasswordPage />
              </div>
            </div>
          } 
        />
        <Route 
          path="/verify-email/:token" 
          element={
            <div className="app-container">
              <div className="main-content login-mode">
                <VerifyEmailPage />
              </div>
            </div>
          } 
        />
        <Route 
          path="/resend-verification" 
          element={
            <div className="app-container">
              <div className="main-content login-mode">
                <ResendVerificationPage />
              </div>
            </div>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/db-management" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DbEntryManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user-management" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/role-management" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RoleBasedAccessControlPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/activity-log" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ActivityLogPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/db-config" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DbConfigurationPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/alerts" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AlertSystemPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/help" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <HelpDocumentationPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/website-admin" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WebsiteAdministrationPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/privacy-policy" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PrivacyPolicyPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/terms-conditions" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TermsOfUsePage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserProfilePage currentUser={currentUser} userRole={userRole} />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          } 
        />
        <Route 
          path="*" 
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;