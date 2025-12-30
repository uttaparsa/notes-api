'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import { Form, Button, Card, Modal } from 'react-bootstrap';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import { isRTL } from '../utils/stringUtils';
import FileUploadComponent from './FileUploadComponent';
import SendButton from './SendButton';
import RtlToggleButton from './buttons/edit_buttons/RtlToggleButton';
import PreviewToggleButton from './buttons/edit_buttons/PreviewToggleButton';
import NoteTextRenderer from './notecard/markdown/NoteTextRenderer';

export default function MessageInput({ listSlug, onNoteSaved }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.dir = isRTL(text) ? "rtl" : "ltr";
        
        // Prevent mobile scroll on focus
        if (textareaRef.current) {
          textareaRef.current.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        }
      }, 200);
    }
  }, [isExpanded, text]);

  // Add effect to lock scroll position when expanded on mobile
  useEffect(() => {
    if (isExpanded && typeof window !== 'undefined') {
      const scrollY = window.scrollY;
    
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isExpanded]);

  const handleEnter = (e) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    if (isCmdOrCtrl && e.key === 'Enter') {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    setSending(true);

    try {
      const response = await fetchWithAuth(`/api/note/${listSlug ? `${listSlug}/` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const responseData = await response.json();
      setText('');
      setIsExpanded(false);
      setIsPreviewMode(false);
      setJustSent(true);
      
      // Reset the success state after animation
      setTimeout(() => setJustSent(false), 2000);
      
      onNoteSaved(responseData);
    } catch (err) {
      console.error('Error sending message:', err);
      handleApiError(err);
    } finally {
      setSending(false);
    }
  };

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        await handleImageUpload(blob);
        break;
      }
    }
  }, []);

  const handleImageUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    
    // Generate a unique name for the image
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
    const uniqueFileName = `pasted_image_${timestamp}.png`;
    
    // Create a new File object with the unique name
    const renamedFile = new File([file], uniqueFileName, { type: file.type });
    
    formData.append('file', renamedFile);

    try {
      const response = await fetchWithAuth('/api/note/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      const imageMarkdown = `![${uniqueFileName}](${url})`;
      setText(prevText => prevText + (prevText ? '\n' : '') + imageMarkdown);
    } catch (err) {
      console.error('Error uploading image:', err);
      handleApiError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (url) => {
    const decodedUrl = decodeURIComponent(url);
    const fileName = decodeURIComponent(decodedUrl.split("/").pop());
    const encodedUrl = encodeURI(decodedUrl);
    const markdownLink = `[${fileName}](${encodedUrl})`;
    
    setText(
        (prevText) => prevText + (prevText ? "\n" : "") + markdownLink
    );
  };

  const toggleEditorRtl = () => {
    if (textareaRef.current) {
      textareaRef.current.dir = textareaRef.current.dir === "rtl" ? "ltr" : "rtl";
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    // Prevent immediate scroll
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 0);
    }
  };

  const handleCollapse = () => {
    if (!text.trim()) {
      setIsExpanded(false);
      setIsPreviewMode(false);
    } else {
      setShowCancelModal(true);
    }
  };

  const handleConfirmCancel = () => {
    setText('');
    setIsExpanded(false);
    setIsPreviewMode(false);
    setShowCancelModal(false);
  };

  const handleCancelModal = () => {
    setShowCancelModal(false);
  };

  const handleMinimizedClick = () => {
    handleExpand();
  };

  if (!isExpanded) {
    return (
      <Button
      onClick={handleMinimizedClick}
      className={`shadow-lg ${justSent ? 'just-sent' : ''}`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1050,
        borderRadius: '50px',
        padding: '12px 20px',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        animation: justSent ? 'successPulse 0.6s ease-out' : 'none',
      }}
      >
      <svg style={{
      }} width="32px" height="32px" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 6L19 8M14 5.5H5.5V19.5H19.5V11M9 16L9.5 13.5L19 4L21 6L11.5 15.5L9 16Z" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
      </Button>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          maxWidth: '800px',
          margin: '0 auto',
          zIndex: 1050,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isExpanded ? 'translateY(0)' : 'translateY(100%)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      >
        <Card className="shadow-lg">
          <Card.Header className="d-flex justify-content-between align-items-center py-2 px-3">
            <h6 className="mb-0 fw-medium" style={{
              transition: 'color 0.3s ease',
              color: justSent ? '#198754' : 'inherit'
            }}>
              {justSent ? '✓ Note Sent!' : 'New Note'}
            </h6>
            <div className="d-flex align-items-center">
              <Button 
                variant="link"
                className="p-1"
                onClick={handleCollapse}
                title="Minimize"
                style={{ fontSize: '16px' }}
              >
                <i className="bi bi-dash-lg"></i>
              </Button>
            </div>
          </Card.Header>
          
          <Card.Body className="p-0">
            {isPreviewMode ? (
              <div 
                className="p-3"
                style={{ 
                  minHeight: '120px', 
                  maxHeight: '300px', 
                  overflow: 'auto',
                }}
              >
                <NoteTextRenderer 
                  note={{ text }} 
                  singleView={true}
                  shouldLoadLinks={false}
                />
              </div>
            ) : (
              <Form.Control
                as="textarea"
                ref={textareaRef}
                dir="auto"
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleEnter}
                onPaste={handlePaste}
                onFocus={(e) => {
                  // Prevent scroll on focus for mobile
                  e.target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
                }}
                disabled={uploading}
                className="border-0"
                style={{
                  minHeight: '120px',
                  maxHeight: '300px',
                  resize: 'vertical',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  padding: '16px',
                  outline: 'none',
                  boxShadow: 'none',
                  WebkitUserSelect: 'text',
                  userSelect: 'text',
                }}
              />
            )}
          </Card.Body>

          <div 
            className="border-top d-flex justify-content-between align-items-center"
            style={{ padding: '12px 16px' }}
          >
            <div className="d-flex align-items-center gap-2">
              <FileUploadComponent
                onFileUploaded={handleFileUpload}
                initialText={text}
                onTextChange={setText}
                size="sm"
              />
              
              <RtlToggleButton 
                onClick={toggleEditorRtl}
                isRTL={isRTL}
                size="sm"
              />
              
              <PreviewToggleButton 
                isPreviewMode={isPreviewMode}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                size="sm"
              />
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleCollapse}
                disabled={sending}
              >
                Cancel
              </Button>
              <SendButton 
                onClick={sendMessage}
                disabled={uploading || !text.trim() || sending}
                uploading={uploading}
                loading={sending}
              />
            </div>
          </div>
        </Card>
        
        <style jsx>{`
          @keyframes successPulse {
            0% {
              transform: scale(1);
              background-color: var(--bs-success);
            }
            50% {
              transform: scale(1.05);
              background-color: var(--bs-success);
            }
            100% {
              transform: scale(1);
              background-color: var(--bs-primary);
            }
          }
        `}</style>
      </div>

      <Modal show={showCancelModal} onHide={handleCancelModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Discard Note?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to discard this note? Your text will be lost.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelModal}>
            Keep Editing
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            Discard
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}