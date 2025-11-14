import AsyncStorage from '@react-native-async-storage/async-storage';
// or use expo-secure-store for more sensitive data:
// import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://notes.astute-cat.shop'; // Configure this

export async function login(username, password) {
  try {
    // First, get CSRF token if needed (some backends provide this via a GET endpoint)
    const csrfToken = await getCSRFToken();
    
    const response = await fetch(`${API_BASE_URL}/api/account/login/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Still include this
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    // Extract and store session/CSRF tokens from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      await storeSessionData(setCookieHeader);
    }

    // Also store CSRF from response headers if provided
    const csrfFromResponse = response.headers.get('x-csrftoken');
    if (csrfFromResponse) {
      await AsyncStorage.setItem('csrftoken', csrfFromResponse);
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function logout(navigation) {
  try {
    const csrfToken = await AsyncStorage.getItem('csrftoken');
    const sessionId = await AsyncStorage.getItem('sessionid');

    await fetch(`${API_BASE_URL}/api/account/logout/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json',
        'Cookie': `sessionid=${sessionId}; csrftoken=${csrfToken}`,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear stored tokens
    await AsyncStorage.multiRemove(['csrftoken', 'sessionid']);
    
    // Navigate to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
}

// Helper to extract and store session data
async function storeSessionData(setCookieHeader) {
  // Parse Set-Cookie header (simplified - you may need a library like 'cookie' for complex cases)
  const cookies = setCookieHeader.split(',');
  
  for (const cookie of cookies) {
    if (cookie.includes('sessionid=')) {
      const sessionId = cookie.split('sessionid=')[1].split(';')[0];
      await AsyncStorage.setItem('sessionid', sessionId);
    }
    if (cookie.includes('csrftoken=')) {
      const csrfToken = cookie.split('csrftoken=')[1].split(';')[0];
      await AsyncStorage.setItem('csrftoken', csrfToken);
    }
  }
}

async function getCSRFToken() {
  // Try to get existing token
  let token = await AsyncStorage.getItem('csrftoken');
  
  if (!token) {
    // Fetch CSRF token from your backend's CSRF endpoint
    const response = await fetch(`${API_BASE_URL}/api/account/csrf/`, {
      method: 'GET',
    });
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      await storeSessionData(setCookieHeader);
      token = await AsyncStorage.getItem('csrftoken');
    }
  }
  
  return token || '';
}