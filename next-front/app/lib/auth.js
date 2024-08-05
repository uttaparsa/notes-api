export async function login(username, password) {
    const response = await fetch('/api/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
  
    if (!response.ok) {
      throw new Error('Login failed');
    }
  
    const data = await response.json();
    return data;
  }
  
  export async function refreshToken(refreshToken) {
    const response = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
  
    const data = await response.json();
    return data;
  }

  export function logout() {
    // Clear tokens from storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // If you're using cookies, you'd clear them here
    // document.cookie = 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // document.cookie = 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  
    // Optionally, make a call to the backend to invalidate the token
    // This depends on your backend implementation
    // await fetch('http://localhost:8000/api/logout/', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    //   }
    // });
  }
  