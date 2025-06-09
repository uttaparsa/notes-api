'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import { isRTL } from '../utils/stringUtils';
import FileUploadComponent from './FileUploadComponent';
import SendButton from './SendButton';
import RtlToggleButton from './buttons/RtlToggleButton';
import PreviewToggleButton from './buttons/PreviewToggleButton';
import NoteTextRenderer from './notecard/markdown/NoteTextRenderer';

export default function MessageInput({ listSlug, onNoteSaved }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.dir = isRTL(text) ? "rtl" : "ltr";
      }, 200);
    }
  }, [isExpanded, text]);

  const handleEnter = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Creating note' }));

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
      onNoteSaved(responseData);
    } catch (err) {
      console.error('Error sending message:', err);
      handleApiError(err);
    }
    window.dispatchEvent(new CustomEvent('hideWaitingModal'));
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
  };

  const handleCollapse = () => {
    if (!text.trim()) {
      setIsExpanded(false);
      setIsPreviewMode(false);
    }
  };

  const handleMinimizedClick = () => {
    handleExpand();
  };

  if (!isExpanded) {
    return (
      <Button
      onClick={handleMinimizedClick}
      className="shadow-lg"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1050,
        borderRadius: '50px',
        padding: '12px 20px',
        fontSize: '16px',
        fontWeight: '500',
      }}
      >
      <svg style={{
      }} width="32px" height="32px" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 6L19 8M14 5.5H5.5V19.5H19.5V11M9 16L9.5 13.5L19 4L21 6L11.5 15.5L9 16Z" stroke="currentColor" stroke-width="1.2"/>
  </svg>
      </Button>
    );
  }

  return (
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
      }}
    >
      <Card className="shadow-lg">
        <Card.Header className="d-flex justify-content-between align-items-center py-2 px-3">
          <h6 className="mb-0 fw-medium">New Note</h6>
          <div className="d-flex align-items-center">
            <Button 
              variant="link"
              className="p-1"
              onClick={handleCollapse}
              disabled={!!text.trim()}
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
              disabled={!!text.trim()}
            >
              Cancel
            </Button>
            <SendButton 
              onClick={sendMessage}
              disabled={uploading || !text.trim()}
              uploading={uploading}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}