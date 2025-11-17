import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../_layout';
import { colors, typography, spacing, borderRadius, commonStyles } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_URL } from '../../config';

export default function SettingsPage() {
  const { setIsAuthenticated } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Get tokens for the request
      const sessionid = await AsyncStorage.getItem('sessionid');
      const csrftoken = await AsyncStorage.getItem('csrftoken');

      // Call backend logout endpoint
      try {
        await fetch(`${API_URL}/api/account/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken || '',
            'Cookie': `sessionid=${sessionid}; csrftoken=${csrftoken}`,
          },
          credentials: 'include',
        });
      } catch (backendError) {
        console.error('Backend logout error:', backendError);
        // Continue with local logout even if backend fails
      }

      // Clear stored tokens
      await AsyncStorage.removeItem('sessionid');
      await AsyncStorage.removeItem('csrftoken');
      
      // Update auth state
      setIsAuthenticated(false);
      
      // Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonIcon}>🚪</Text>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.error || '#EF4444',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutButtonIcon: {
    fontSize: 20,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
