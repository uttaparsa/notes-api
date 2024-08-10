'use client';

import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, ToastContainer, Modal, Spinner } from 'react-bootstrap';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import TopNavbar from '../components/TopNavbar';
import styles from './layout.module.css';

export const NoteListContext = createContext([]);
export const ModalContext = createContext({});
export const ToastContext = createContext({});
export const AuthContext = createContext();

export default function AuthProviderComponent({ children }) {
  const [noteLists, setNoteLists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, title: '', body: '', delay: 3000, variant: 'primary' });
  const router = useRouter();

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  const getLists = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/note/list/');
      if (!response.ok) {
        throw new Error('Failed to fetch note lists');
      }
      const data = await response.json();
      const sortedData = data.sort((a, b) => a.archived - b.archived);
      setNoteLists(sortedData);
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
    }
  }, []);

  const showToast = useCallback((title, body, delay = 3000, variant = 'primary') => {
    setToast({ show: true, title, body, delay, variant });
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      setIsAuthenticated(!!accessToken);
      setIsLoading(false);
    };

    checkAuth();
    // getLists();

    const showWaitingModal = (e) => {
      console.log('showWaitingModal', e.detail);
      setShowModal(true);
      setModalTitle(e.detail.title);
    };

    const hideWaitingModal = () => {
      setShowModal(false);
    };

    const handleShowToast = (event) => {
      const { title, body, delay, variant } = event.detail;
      showToast(title, body, delay, variant);
    };

    window.addEventListener('showWaitingModal', showWaitingModal);
    window.addEventListener('hideWaitingModal', hideWaitingModal);
    window.addEventListener('updateNoteLists', getLists);
    window.addEventListener('showToast', handleShowToast);

    return () => {
      window.removeEventListener('showWaitingModal', showWaitingModal);
      window.removeEventListener('hideWaitingModal', hideWaitingModal);
      window.removeEventListener('updateNoteLists', getLists);
      window.removeEventListener('showToast', handleShowToast);
    };
  }, [getLists, showToast]);

  if (isLoading) {
    return <div>Loading...</div>; // Or any loading indicator
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <NoteListContext.Provider value={noteLists}>
        <ModalContext.Provider value={{ showModal, setShowModal, modalTitle, setModalTitle }}>
          <ToastContext.Provider value={showToast}>
            <TopNavbar isLoggedIn={isAuthenticated} onLogout={logout} />
            <div className="bg-dark h-100" style={{minHeight: '100vh'}}>
              {children}
            </div>
            <ToastContainer position="top-end" className="p-3 position-fixed">
              <Toast 
                onClose={() => setToast(prev => ({ ...prev, show: false }))} 
                show={toast.show} 
                delay={toast.delay} 
                autohide
                bg={toast.variant}
              >
                <Toast.Header>
                  <strong className="me-auto">{toast.title}</strong>
                </Toast.Header>
                <Toast.Body>{toast.body}</Toast.Body>
              </Toast>
            </ToastContainer>
          </ToastContext.Provider>
          <Modal
            show={showModal}
            centered
            backdrop="static"
            keyboard={false}
            className={styles.modalFade}
          >
            <Modal.Header>
              <Modal.Title>{modalTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
              <Spinner animation="border" role="status" style={{ width: '8rem', height: '8rem' }}>
                <span className="sr-only">Loading...</span>
              </Spinner>
            </Modal.Body>
          </Modal>
        </ModalContext.Provider>
      </NoteListContext.Provider>
    </AuthContext.Provider>
  );
}