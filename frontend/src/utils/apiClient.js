// Utility for making authenticated API calls with session handling
import { API_BASE_URL } from './config';

/**
 * Makes an authenticated API call and handles session expiration
 * @param {string} endpoint - API endpoint (e.g., '/Dashboard/metrics')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<object>} - Response data or throws error
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: defaultHeaders
  });

  // Handle session expiration
  if (response.status === 401) {
    try {
      const data = await response.json();
      if (data.sessionExpired) {
        // Session expired - let SessionManager handle logout
        // Don't throw error, just return null
        return null;
      }
    } catch (e) {
      // If JSON parsing fails, treat as regular 401
    }
  }

  // Handle other HTTP errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Checks if the current session is valid
 * @returns {boolean} - True if session is valid
 */
export const isSessionValid = () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return false;

  try {
    // Decode JWT token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    return Date.now() < expirationTime;
  } catch (error) {
    return false;
  }
};

/**
 * Safely makes an API call and handles session expiration gracefully
 * @param {Function} apiFn - Async function that makes the API call
 * @param {Function} onSuccess - Callback on success
 * @param {Function} onError - Callback on error (optional)
 */
export const safeApiCall = async (apiFn, onSuccess, onError = null) => {
  try {
    const data = await apiFn();
    
    // If data is null, session expired - don't call onSuccess
    if (data === null) {
      return;
    }
    
    if (onSuccess) {
      onSuccess(data);
    }
  } catch (error) {
    // Only call error handler if session is still valid
    // (prevents error messages during logout)
    if (isSessionValid() && onError) {
      onError(error);
    }
  }
};
