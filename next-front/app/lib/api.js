export async function fetchWithAuth(url, options = {}, timeout = 5000) {
  const csrfToken = getCookie('csrftoken'); // Helper function to retrieve the CSRF token from cookies

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers = {
    ...options.headers,
    'X-CSRFToken': csrfToken,
  };

  try {
    const response = await fetch(url, { 
      ...options, 
      headers, 
      credentials: 'include',
      signal: controller.signal 
    });

    // Redirect to login if session is expired or unauthorized
    if (response.status === 403) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper function to get the CSRF token from cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
