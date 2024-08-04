import { refreshToken } from './auth';

export async function fetchWithAuth(url, options = {}) {
    const accessToken = localStorage.getItem('accessToken');
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    };
  
    const response = await fetch(url, { ...options, headers });
  
    if (response.status === 401) {
      
      // Token has expired, try to refresh it
      const rt = localStorage.getItem('refreshToken');
      try {
        const newTokens = await refreshToken(rt);
        localStorage.setItem('accessToken', newTokens.access);
        
        // Retry the original request with the new token
        headers['Authorization'] = `Bearer ${newTokens.access}`;
        return fetch(url, { ...options, headers });

      } catch (error) {
        // Refresh token has expired, redirect to login
        
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }


  
    return response;
  }