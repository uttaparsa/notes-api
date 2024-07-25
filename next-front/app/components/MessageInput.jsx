'use client'

import { useState, useRef } from 'react';
import { Form, Button, Modal } from 'react-bootstrap';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';

export default function MessageInput({ listSlug, onNoteSaved }) {
  const [text, setText] = useState('');
  const [fileUrl, setFileUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleEnter = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Creating note' }));

    try {
      const obj = { text, fileUrl };
      const response = await fetchWithAuth(`/api/note/${listSlug ? `${listSlug}/` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const responseData = await response.json();
      setText('');
      setFileUrl(null);
      onNoteSaved(responseData);
    } catch (err) {
      console.error('Error sending message:', err);
      handleApiError(err);
    }
    window.dispatchEvent(new CustomEvent('hideWaitingModal'));
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetchWithAuth('/api/note/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const { url } = await response.json();
      setFileUrl(url);
      // Don't close the modal here, just show the URL
    } catch (err) {
      console.error('Error uploading file:', err);
      handleApiError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div dir="ltr">
      {fileUrl && (
        <div
          style={{
            position: 'fixed',
            bottom: '45px',
            left: 0,
            width: '100vw',
            backgroundColor: '#765285',
            height: '35px',
          }}
          id="status-bar-bottom"
        >
          <div className="d-flex text-light px-2">
            <div className="d-flex py-1">File attached: {fileUrl}</div>
            <button type="button" className="ml-2 close" aria-label="Close" onClick={() => setFileUrl(null)}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
      )}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          display: 'block',
          width: '100vw',
          backgroundColor: 'gray',
          height: '45px',
        }}
      >
        <Form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <div className="d-flex">
            <Form.Control
              as="textarea"
              id="message_text"
              dir="auto"
              placeholder="Say something..."
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleEnter}
            />
            <input type="hidden" name="replyTo" id="replyTo" value="" />
            <Button
              variant="outline-light"
              className="h-80 px-1 shadow-none"
              onClick={() => setShowModal(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="currentColor"
                className="bi bi-paperclip"
                viewBox="0 0 16 16"
              >
                <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z" />
              </svg>
            </Button>
            <Button type="submit" variant="primary" className="mr-2 ml-1">
              Send
            </Button>
          </div>
        </Form>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Choose a file to upload</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
          </Form.Group>
          {fileUrl && (
            <div className="mt-3">
              <strong>Uploaded File URL:</strong>
              <p className="text-break">{fileUrl}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowModal(false);
            setUploadFile(null);
          }}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={handleFileUpload}
            disabled={!uploadFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}