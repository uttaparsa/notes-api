import React, { createContext, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Modal, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments, Slot } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavbar from '../components/BottomNavbar';
import Toast from '../components/Toast';
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../styles/theme';

export const NoteListContext = createContext([]);
export const ModalContext = createContext({});
export const ToastContext = createContext({});
export const AuthContext = createContext();

export default function RootLayout() {
  const [noteLists, setNoteLists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [toast, setToast] = useState({ 
    show: false, 
    title: '', 
    body: '', 
    duration: 3000, 
    type: 'info' 
  });
  const router = useRouter();
  const segments = useSegments();

  const handleLogout = useCallback(async () => {
    // TODO: Implement logout
    // await logout();
    // await AsyncStorage.removeItem('accessToken');
    // await AsyncStorage.removeItem('refreshToken');
    
    // Temporary mock
    setIsAuthenticated(false);
    console.log('Logout called');
  }, []);

  const getLists = useCallback(async () => {
    // TODO: Fetch note lists from backend
    // try {
    //   const response = await fetchWithAuth('/api/note/list/');
    //   if (!response.ok) {
    //     throw new Error('Failed to fetch note lists');
    //   }
    //   const data = await response.json();
    //   const sortedData = data.sort((a, b) => a.archived - b.archived);
    //   setNoteLists(sortedData);
    // } catch (err) {
    //   console.error(`Error: ${err}`);
    //   handleApiError(err);
    // }
    
    // Temporary mock data
    setNoteLists([
      { id: 1, name: 'Personal Notes', archived: false },
      { id: 2, name: 'Work Notes', archived: false },
      { id: 3, name: 'Old Notes', archived: true },
    ]);
  }, []);

  const showToast = useCallback((title, body, duration = 3000, type = 'info') => {
    setToast({ show: true, title, body, duration, type });
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionId = await AsyncStorage.getItem('sessionid');
        const csrfToken = await AsyncStorage.getItem('csrftoken');
        
        // User is authenticated if both tokens exist
        if (sessionId && csrfToken) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Handle routing based on authentication
  useEffect(() => {
    if (isAuthenticated === null) {
      // Still loading, don't navigate
      return;
    }

    const inAuthGroup = segments[0] === 'login';
    
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and trying to access login
      router.replace('/');
    } else if (isAuthenticated) {
      // Load lists when authenticated
      getLists();
    }
  }, [isAuthenticated, segments]);

  // Show loading screen while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={[styles.container, styles.loadingScreen]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <NoteListContext.Provider value={noteLists}>
        <ModalContext.Provider value={{ showModal, setShowModal, modalTitle, setModalTitle }}>
          <ToastContext.Provider value={showToast}>
            <View style={styles.container}>
              {/* Main content area - Slot renders the current route */}
              <View style={styles.content}>
                <Slot />
              </View>

              {/* Bottom Navigation */}
              {isAuthenticated && (
                <BottomNavbar onLogout={handleLogout} />
              )}

              {/* Loading Modal */}
              <Modal
                visible={showModal}
                transparent={true}
                animationType="fade"
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{modalTitle}</Text>
                    <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
                  </View>
                </View>
              </Modal>

              {/* Toast Notification */}
              {toast.show && (
                <Toast
                  title={toast.title}
                  body={toast.body}
                  duration={toast.duration}
                  type={toast.type}
                  onHide={() => setToast(prev => ({ ...prev, show: false }))}
                />
              )}
            </View>
          </ToastContext.Provider>
        </ModalContext.Provider>
      </NoteListContext.Provider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  content: {
    flex: 1,
  },
  loadingScreen: {
    ...commonStyles.loadingContainer,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    minWidth: 250,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  spinner: {
    transform: [{ scale: 1.5 }],
  },
});