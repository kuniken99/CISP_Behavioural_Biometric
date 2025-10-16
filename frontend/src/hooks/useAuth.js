// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../utils/config';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Helper function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      // Decode JWT token (simple base64 decode of payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      return expirationTime <= now;
    } catch (error) {
      return true; // Treat invalid tokens as expired
    }
  };

  // Check for existing token on mount and validate it
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const user = localStorage.getItem('current_user');
    const role = localStorage.getItem('user_role');
    
    if (token && user && role) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Token is expired, clear everything
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('user_role');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserRole(null);
      } else {
        setIsAuthenticated(true);
        setCurrentUser(user);
        setUserRole(role);
      }
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