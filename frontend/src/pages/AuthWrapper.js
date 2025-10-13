import React, { useState } from 'react';
import LoginPage from './LoginPage';
import LoginPrivacyPolicy from './LoginPrivacyPolicy';
import LoginTermsAndConditions from './LoginTermsAndConditions';
import ResetPasswordPage from './ResetPasswordPage';
import RegistrationPage from './RegistrationPage';
import EmailVerificationPage from './EmailVerificationPage';
import TwoFactorSetupPage from '../TwoFactorSetupPage';
import TwoFactorLoginPage from '../TwoFactorLoginPage';

const AuthWrapper = ({ onLogin }) => {
  const [currentAuthPage, setCurrentAuthPage] = useState('login');
  const [previousAuthPage, setPreviousAuthPage] = useState('login'); // Track where user came from
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationContext, setVerificationContext] = useState('registration'); // 'registration' or 'login'
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  
  // Persistent registration form data
  const [registrationFormData, setRegistrationFormData] = useState({
    username: '',
    email: '',
    role: 'User',
    uniqueCode: '',
    password: '',
    confirmPassword: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleAuthPageChange = (page, data = {}) => {
    // Store the current page as previous before switching
    setPreviousAuthPage(currentAuthPage);
    
    // Clear registration form when navigating from login to register (fresh start)
    if (page === 'register' && currentAuthPage === 'login') {
      setRegistrationFormData({
        username: '',
        email: '',
        role: 'User',
        uniqueCode: '',
        password: '',
        confirmPassword: ''
      });
      setAgreedToTerms(false);
    }
    
    if (page === 'verify-email' && data.email) {
      setVerificationEmail(data.email);
      setVerificationContext(data.context || 'registration');
      
      // If coming from registration, clear the form data since registration was successful
      if (data.context === 'registration') {
        setRegistrationFormData({
          username: '',
          email: '',
          role: 'User',
          uniqueCode: '',
          password: '',
          confirmPassword: ''
        });
        setAgreedToTerms(false);
      }
    }
    if ((page === 'twofa-setup' || page === 'twofa-login') && data.email) {
      setTwoFactorEmail(data.email);
    }
    setCurrentAuthPage(page);
  };

  const renderAuthPage = () => {
    switch (currentAuthPage) {
      case 'login':
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={handleAuthPageChange} />;
      case 'privacy':
        return <LoginPrivacyPolicy setCurrentAuthPage={handleAuthPageChange} previousPage={previousAuthPage} />;
      case 'terms':
        return <LoginTermsAndConditions setCurrentAuthPage={handleAuthPageChange} previousPage={previousAuthPage} />;
      case 'forgot-password':
        return <ResetPasswordPage setCurrentAuthPage={handleAuthPageChange} />;
      case 'register':
        return <RegistrationPage 
          setCurrentAuthPage={handleAuthPageChange} 
          initialFormData={registrationFormData}
          onFormDataChange={setRegistrationFormData}
          initialAgreedToTerms={agreedToTerms}
          onAgreedToTermsChange={setAgreedToTerms}
        />;
      case 'verify-email':
        return <EmailVerificationPage setCurrentAuthPage={handleAuthPageChange} email={verificationEmail} context={verificationContext} />;
      case 'twofa-setup':
        return <TwoFactorSetupPage 
          setCurrentAuthPage={handleAuthPageChange} 
          email={twoFactorEmail} 
          onSetupComplete={(token, user) => {
            // Use the actual user data from 2FA setup response
            if (user && token) {
              onLogin(token, user.username, user.role);
            } else {
              // Fallback - try to extract from stored token
              const storedToken = localStorage.getItem('jwt_token');
              if (storedToken) {
                onLogin(storedToken, 'user', 'user');
              }
            }
          }}
        />;
      case 'twofa-login':
        return <TwoFactorLoginPage 
          setCurrentAuthPage={handleAuthPageChange} 
          email={twoFactorEmail} 
          onLogin={onLogin}
        />;
      default:
        return <LoginPage onLogin={onLogin} setCurrentAuthPage={handleAuthPageChange} />;
    }
  };

  return renderAuthPage();
};

export default AuthWrapper;