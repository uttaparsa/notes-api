'use client'

import React, { useState, createContext, useContext, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ExternalLinkContext = createContext(null);

export const useExternalLink = () => {
  const context = useContext(ExternalLinkContext);
  if (!context) {
    throw new Error('useExternalLink must be used within ExternalLinkProvider');
  }
  return context;
};

export const ExternalLinkProvider = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');

  const openExternalLink = useCallback((url) => {
    setPendingUrl(url);
    setShowModal(true);
  }, []);

  const handleConfirm = useCallback(() => {
    window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    setShowModal(false);
    setPendingUrl('');
  }, [pendingUrl]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setPendingUrl('');
  }, []);

  return (
    <ExternalLinkContext.Provider value={{ openExternalLink }}>
      {children}
      <Modal show={showModal} onHide={handleCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>External Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to leave this site and visit:</p>
          <p className="text-break text-primary small bg-body-secondary p-2 rounded">
            {pendingUrl}
          </p>
          <p className="text-muted small mb-0">
            Make sure you trust this link before proceeding.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </ExternalLinkContext.Provider>
  );
};

export default ExternalLinkProvider;
