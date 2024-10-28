import { refreshToken } from './auth';

export async function fetchWithAuth(url, options = {}) {
  const csrfToken = getCookie('csrftoken'); // Helper function to retrieve the CSRF token from cookies

  const headers = {
    ...options.headers,
    'X-CSRFToken': csrfToken,
  };

  const response = await fetch(url, { ...options, headers, credentials: 'include' });

  // Redirect to login if session is expired or unauthorized
  if (response.status === 403) {
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response;
}

// Helper function to get the CSRF token from cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
