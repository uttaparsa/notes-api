export async function login(username, password) {
  const response = await fetch('/api/account/login/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include', // Ensure cookies are sent with the request
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response;
}

export async function signup(username, email, password) {
  const response = await fetch('/api/account/signup/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Signup failed');
  }

  return response.json();
}

export function logout() {
  // Make a call to the backend to logout and clear the session
  fetch('/api/account/logout/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  }).then(() => {
    // Redirect to login page after logout
    window.location.href = '/login';
  });
}

// TODO: this is duplicated in api.js
// Helper function to get the CSRF token from cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
