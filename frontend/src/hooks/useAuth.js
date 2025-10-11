// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const user = localStorage.getItem('current_user');
    const role = localStorage.getItem('user_role');
    if (token && user && role) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (token, username, role) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('current_user', username);
    localStorage.setItem('user_role', role);
    setIsAuthenticated(true);
    setCurrentUser(username);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole(null);
    // Don't show alert as it might cause navigation issues
    // React Router will automatically redirect to login when isAuthenticated becomes false
  };

  return {
    isAuthenticated,
    currentUser,
    userRole,
    handleLogin,
    handleLogout
  };
};

export default useAuth;