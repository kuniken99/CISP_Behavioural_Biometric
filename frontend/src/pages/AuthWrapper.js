import React, { useState } from 'react';
import LoginPage from './LoginPage';
import LoginPrivacyPolicy from './LoginPrivacyPolicy';
import LoginTermsAndConditions from './LoginTermsAndConditions';

const AuthWrapper = ({ onLogin }) => {
  const [currentAuthPage, setCurrentAuthPage] = useState('login');

  const renderAuthPage = () => {
    switch (currentAuthPage) {
      case 'login':
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={setCurrentAuthPage} />;
      case 'privacy':
        return <LoginPrivacyPolicy setCurrentAuthPage={setCurrentAuthPage} />;
      case 'terms':
        return <LoginTermsAndConditions setCurrentAuthPage={setCurrentAuthPage} />;
      case 'forgot-password':
        // For now, redirect back to login - can implement forgot password later
        setCurrentAuthPage('login');
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={setCurrentAuthPage} />;
      case 'register':
        // For now, redirect back to login - can implement registration later  
        setCurrentAuthPage('login');
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={setCurrentAuthPage} />;
      default:
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={setCurrentAuthPage} />;
    }
  };

  return renderAuthPage();
};

export default AuthWrapper;