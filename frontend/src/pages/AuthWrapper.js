import React, { useState } from 'react';
import LoginPage from './LoginPage';
import LoginPrivacyPolicy from './LoginPrivacyPolicy';
import LoginTermsAndConditions from './LoginTermsAndConditions';
import ResetPasswordPage from './ResetPasswordPage';
import RegistrationPage from './RegistrationPage';
import EmailVerificationPage from './EmailVerificationPage';

const AuthWrapper = ({ onLogin }) => {
  const [currentAuthPage, setCurrentAuthPage] = useState('login');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationContext, setVerificationContext] = useState('registration'); // 'registration' or 'login'

  const handleAuthPageChange = (page, data = {}) => {
    if (page === 'verify-email' && data.email) {
      setVerificationEmail(data.email);
      setVerificationContext(data.context || 'registration');
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
        return <EmailVerificationPage setCurrentAuthPage={handleAuthPageChange} email={verificationEmail} context={verificationContext} />;
      default:
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={handleAuthPageChange} />;
    }
  };

  return renderAuthPage();
};

export default AuthWrapper;