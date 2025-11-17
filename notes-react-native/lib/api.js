import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export async function fetchWithAuth(url, options = {}, timeout = 5000, navigation) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const csrfToken = await AsyncStorage.getItem('csrftoken');
    const sessionId = await AsyncStorage.getItem('sessionid');

    const headers = {
      ...options.headers,
      'X-CSRFToken': csrfToken || '',
      'Content-Type': 'application/json',
      // Manually add cookies as header
      'Cookie': `sessionid=${sessionId}; csrftoken=${csrfToken}`,
    };

    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    // Handle unauthorized/session expired
    if (response.status === 403 || response.status === 401) {
      await AsyncStorage.multiRemove(['csrftoken', 'sessionid']);
      
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
      
      throw new Error('Session expired');
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}