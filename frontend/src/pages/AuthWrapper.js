import React, { useState } from 'react';
import LoginPage from './LoginPage';
import LoginPrivacyPolicy from './LoginPrivacyPolicy';
import LoginTermsAndConditions from './LoginTermsAndConditions';
import ResetPasswordPage from './ResetPasswordPage';
import RegistrationPage from './RegistrationPage';
import EmailVerificationPage from './EmailVerificationPage';

const AuthWrapper = ({ onLogin }) => {
  const [currentAuthPage, setCurrentAuthPage] = useState('login');
  const [registrationEmail, setRegistrationEmail] = useState('');

  const handleAuthPageChange = (page, data = {}) => {
    if (page === 'verify-email' && data.email) {
      setRegistrationEmail(data.email);
    }
    setCurrentAuthPage(page);
  };

  const renderAuthPage = () => {
    switch (currentAuthPage) {
      case 'login':
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={handleAuthPageChange} />;
      case 'privacy':
        return <LoginPrivacyPolicy setCurrentAuthPage={handleAuthPageChange} />;
      case 'terms':
        return <LoginTermsAndConditions setCurrentAuthPage={handleAuthPageChange} />;
      case 'forgot-password':
        return <ResetPasswordPage setCurrentAuthPage={handleAuthPageChange} />;
      case 'register':
        return <RegistrationPage setCurrentAuthPage={handleAuthPageChange} />;
      case 'verify-email':
        return <EmailVerificationPage setCurrentAuthPage={handleAuthPageChange} email={registrationEmail} />;
      default:
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={handleAuthPageChange} />;
    }
  };

  return renderAuthPage();
};

export default AuthWrapper;