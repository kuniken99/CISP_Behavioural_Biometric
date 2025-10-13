// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../utils/config';

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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        // Call backend logout endpoint to update LastLogoutAt
        await fetch(`${API_BASE_URL}/Auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      // Continue with logout even if backend call fails
      console.warn('Failed to call backend logout endpoint:', error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('current_user');
      localStorage.removeItem('user_role');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole(null);
      // Don't show alert as it might cause navigation issues
      // React Router will automatically redirect to login when isAuthenticated becomes false
    }
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