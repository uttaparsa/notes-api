'use client'

import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import BootstrapClient from '../components/BootstrapClient'
import TopNavbar from '../components/TopNavbar'
import BackToTop from '../components/BackToTop'
import { fetchWithAuth } from '../lib/api';
import { logout } from '../lib/auth';
import { Toast, ToastContainer } from 'react-bootstrap';
import { handleApiError } from '../utils/errorHandler';
import { Modal, Spinner } from 'react-bootstrap';
import styles from './layout.module.css';
import { ExternalLinkProvider } from '../components/notecard/ExternalLinkModal';


export const NoteListContext = createContext([]);
export const WorkspaceContext = createContext([]);
export const SelectedWorkspaceContext = createContext({ selectedWorkspace: null, selectWorkspace: () => {} });
export const WorkspaceReadyContext = createContext(false);
export const ModalContext = createContext({});
export const ToastContext = createContext({});
export const AuthContext = createContext();


export default function RootLayout({ children }) {
  const NOTE_LISTS_CACHE_KEY = 'cachedNoteLists';
  const WORKSPACES_CACHE_KEY = 'cachedWorkspaces';
  const [noteLists, setNoteLists] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toast, setToast] = useState({ show: false, title: '', body: '', delay: 3000, variant: 'primary' });
  const initialDataRequestedRef = useRef(false);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [router]);

  const applyWorkspaceSelection = useCallback((workspaceData) => {
    const savedWorkspaceSlug = localStorage.getItem('selectedWorkspace');
    const savedWorkspace = savedWorkspaceSlug
      ? workspaceData.find((workspace) => workspace.slug === savedWorkspaceSlug)
      : null;
    const defaultWorkspace = workspaceData.find((workspace) => workspace.is_default) || workspaceData[0] || null;
    const resolvedWorkspace = savedWorkspace || defaultWorkspace;

    setSelectedWorkspace(resolvedWorkspace);

    if (resolvedWorkspace) {
      localStorage.setItem('selectedWorkspace', resolvedWorkspace.slug);
    } else {
      localStorage.removeItem('selectedWorkspace');
    }
  }, []);

  const getLists = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/note/list/');
      if (!response.ok) {
        throw new Error('Failed to fetch note lists');
      }
      const data = await response.json();
      const sortedData = data.sort((a, b) => a.archived - b.archived);
      setNoteLists(sortedData);
      localStorage.setItem(NOTE_LISTS_CACHE_KEY, JSON.stringify(sortedData));
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
    }
  }, [NOTE_LISTS_CACHE_KEY]);

  const getWorkspaces = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/note/workspaces/');
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      const data = await response.json();
      setWorkspaces(data);
      localStorage.setItem(WORKSPACES_CACHE_KEY, JSON.stringify(data));
      applyWorkspaceSelection(data);
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
    } finally {
      setWorkspaceReady(true);
    }
  }, [WORKSPACES_CACHE_KEY, applyWorkspaceSelection]);

  const selectWorkspace = useCallback((workspace) => {
    setSelectedWorkspace(workspace);
    if (workspace) {
      localStorage.setItem('selectedWorkspace', workspace.slug);
    } else {
      localStorage.removeItem('selectedWorkspace');
    }
  }, []);

  const showToast = useCallback((title, body, delay = 3000, variant = 'primary') => {
    setToast({ show: true, title, body, delay, variant });
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    setIsAuthenticated(!!accessToken);

    if (accessToken && !initialDataRequestedRef.current) {
      initialDataRequestedRef.current = true;

      const cachedListsRaw = localStorage.getItem(NOTE_LISTS_CACHE_KEY);
      if (cachedListsRaw) {
        try {
          const cachedLists = JSON.parse(cachedListsRaw);
          if (Array.isArray(cachedLists)) {
            setNoteLists(cachedLists);
          } else {
            getLists();
          }
        } catch {
          getLists();
        }
      } else {
        getLists();
      }

      const cachedWorkspacesRaw = localStorage.getItem(WORKSPACES_CACHE_KEY);
      if (cachedWorkspacesRaw) {
        try {
          const cachedWorkspaces = JSON.parse(cachedWorkspacesRaw);
          if (Array.isArray(cachedWorkspaces) && cachedWorkspaces.length > 0) {
            setWorkspaces(cachedWorkspaces);
            applyWorkspaceSelection(cachedWorkspaces);
            setWorkspaceReady(true);
          } else {
            getWorkspaces();
          }
        } catch {
          getWorkspaces();
        }
      } else {
        getWorkspaces();
      }
    }

    const showWaitingModal = (e) => {
      const title = typeof e.detail === 'string' ? e.detail : e.detail?.title;
      setShowModal(true);
      setModalTitle(title || 'Please wait');
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
    window.addEventListener('updateWorkspaces', getWorkspaces);
    window.addEventListener('showToast', handleShowToast);

    return () => {
      window.removeEventListener('showWaitingModal', showWaitingModal);
      window.removeEventListener('hideWaitingModal', hideWaitingModal);
      window.removeEventListener('updateNoteLists', getLists);
      window.removeEventListener('updateWorkspaces', getWorkspaces);
      window.removeEventListener('showToast', handleShowToast);
    };
  }, [getLists, getWorkspaces, showToast, NOTE_LISTS_CACHE_KEY, WORKSPACES_CACHE_KEY, applyWorkspaceSelection]);

  return (
    <html lang="en" data-bs-theme="light">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Notes</title>
      </head>
      <body>
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
          <NoteListContext.Provider value={noteLists}>
            <WorkspaceReadyContext.Provider value={workspaceReady}>
              <SelectedWorkspaceContext.Provider value={{ selectedWorkspace, selectWorkspace }}>
                <WorkspaceContext.Provider value={workspaces}>
                  <ModalContext.Provider value={{ showModal, setShowModal, modalTitle, setModalTitle }}>
                    <ToastContext.Provider value={showToast}>
                      <ExternalLinkProvider>
                        <TopNavbar isLoggedIn={isAuthenticated} onLogout={handleLogout} workspaces={workspaces} />
                        <div className="h-100" style={{ minHeight: '100vh' }}>
                          {children}
                          <BootstrapClient />
                        </div>
                        <BackToTop />
                      </ExternalLinkProvider>
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
                </WorkspaceContext.Provider>
              </SelectedWorkspaceContext.Provider>
            </WorkspaceReadyContext.Provider>
          </NoteListContext.Provider>
        </AuthContext.Provider>
      </body>
    </html>
  );
}