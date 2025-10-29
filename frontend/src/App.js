// frontend/src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { CBBAProvider, useCBBAContext } from './context/CBBAContext';
import Footer from './components/Footer';
import CBBAMonitor from './components/CBBAMonitor';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import SessionManager from './components/security/SessionManager';
import StepUpAuth from './components/security/StepUpAuth';
import SessionLock from './components/security/SessionLock';

// Import all page components
import AuthWrapper from './pages/AuthWrapper';
import SetNewPasswordPage from './pages/SetNewPasswordPage';
import VerifyEmailPage from './VerifyEmailPage';
import ResendVerificationPage from './ResendVerificationPage';
import TrainingProgressPage from './pages/TrainingProgressPage';
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

  // CBBA Risk Detection Handler (defined in App, passed to provider)
  const [showStepUpAuth, setShowStepUpAuth] = React.useState(false);
  const [showSessionLock, setShowSessionLock] = React.useState(false);
  const [detectedRiskScore, setDetectedRiskScore] = React.useState(0);

  // Check session risk state on mount/refresh to prevent bypass
  useEffect(() => {
    const checkSessionRiskState = async () => {
      if (!isAuthenticated) return;

      try {
        const token = localStorage.getItem('jwt_token');
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        
        const response = await fetch(`${API_BASE_URL}/biometric/session-risk-state`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include' // Important for session cookies
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[CBBA] Session risk state on page load:', data);

          if (data.success) {
            setDetectedRiskScore(data.riskScore);
            
            // Check for session lock (80%+ risk)
            if (data.isLocked) {
              console.log('[CBBA] Session is locked - showing SessionLock modal');
              setShowSessionLock(true);
            }
            // Check for auth requirement (50-79% risk)
            else if (data.requiresAuth && !data.authCompleted) {
              console.log('[CBBA] Auth required - showing StepUpAuth modal');
              setShowStepUpAuth(true);
            }
          }
        }
      } catch (error) {
        console.error('[CBBA] Error checking session risk state:', error);
      }
    };

    checkSessionRiskState();
  }, [isAuthenticated]);

  const handleRiskDetected = React.useCallback((action, riskScore) => {
    console.log(`[APP] handleRiskDetected called - Action: ${action}, Risk: ${riskScore}%`);
    setDetectedRiskScore(riskScore);
    if (action === 'challenge') {
      // Moderate risk (50-79%) - Show Google Authenticator modal (StepUpAuth)
      if (riskScore >= 50 && riskScore < 80) {
        console.log('[APP] Setting showStepUpAuth = true');
        setShowStepUpAuth(true);
      } 
      // High risk (80%+) - Show 15-minute account lockout (SessionLock)
      else if (riskScore >= 80) {
        console.log('[APP] Setting showSessionLock = true');
        setShowSessionLock(true);
      }
    } else if (action === 'lock') {
      console.log('[APP] Action is lock - Setting showSessionLock = true');
      setShowSessionLock(true);
    }
  }, []);

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  // Scroll to top component only when the actual route path changes
  const ScrollToTop = () => {
    const location = useLocation();
    const prevPathRef = React.useRef(location.pathname);
    
    useEffect(() => {
      // Only scroll if the path actually changed (not just a re-render)
      if (prevPathRef.current !== location.pathname) {
        window.scrollTo(0, 0);
        prevPathRef.current = location.pathname;
      }
    }, [location.pathname]);
    
    return null;
  };

  // Main Dashboard Layout Component
  const DashboardLayout = ({ children }) => {
    const { riskScore, riskLevel, cbbaStatus } = useCBBAContext();
    
    return (
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
          status={cbbaStatus}
          riskScore={riskScore}
          riskLevel={riskLevel}
          isAuthenticated={isAuthenticated}
        />
        {/* Session timeout manager - only active when authenticated */}
        {isAuthenticated && <SessionManager />}
        
        {/* StepUpAuth - Moderate Risk (50-79%) Google Authenticator Modal */}
        {showStepUpAuth && (
          <StepUpAuth
            show={showStepUpAuth}
            riskScore={detectedRiskScore}
            username={currentUser}
            onVerify={(success, data) => {
              if (success) {
                console.log('[CBBA] StepUp authentication successful:', data);
                setShowStepUpAuth(false);
                // Optionally reset risk score or update session
              }
            }}
            onCancel={() => {
              // User failed verification multiple times or cancelled
              console.log('[CBBA] StepUp authentication cancelled - logging out');
              setShowStepUpAuth(false);
              handleLogout(); // Force logout for security
            }}
          />
        )}
        
        {/* SessionLock - High Risk (80%+) 15-Minute Account Lockout */}
        {showSessionLock && (
          <SessionLock
            show={showSessionLock}
            onLockExpired={() => {
              setShowSessionLock(false);
              handleLogout(); // Force logout after lockout expires
            }}
            riskScore={detectedRiskScore}
            username={currentUser}
          />
        )}
      </div>
    );
  };

  return (
    <CBBAProvider 
      isAuthenticated={isAuthenticated}
      currentUser={currentUser}
      onRiskDetected={handleRiskDetected}
    >
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
          path="/training-progress" 
          element={
            <div className="app-container">
              <div className="main-content login-mode">
                <TrainingProgressPage />
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
    </CBBAProvider>
  );
}export default App;