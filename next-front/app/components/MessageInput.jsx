'use client'

import { useState, useCallback, useRef } from 'react';
import { Form, Button } from 'react-bootstrap';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import FileUploadComponent from './FileUploadComponent';

export default function MessageInput({ listSlug, onNoteSaved }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

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
    const fileName = url.split("/").pop(); // Get filename from URL
    const markdownLink = `[${fileName}](${url})`;
    setText(
        (prevText) => prevText + (prevText ? "\n" : "") + markdownLink
    );
};

  // const handleFileUpload = (url) => {
  //   setText(prevText => prevText + (prevText ? '\n' : '') + url);
  // };

  return (
    <div dir="ltr">
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
          <div className="d-flex align-items-center">
            <Form.Control
              as="textarea"
              id="message_text"
              dir="auto"
              placeholder="Say something..."
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleEnter}
              onPaste={handlePaste}
              ref={textareaRef}
              disabled={uploading}
            />
            <input type="hidden" name="replyTo" id="replyTo" value="" />
            <FileUploadComponent
              onFileUploaded={handleFileUpload}
              initialText={text}
              onTextChange={setText}
            />
            <Button type="submit" variant="primary" className="mr-2 ml-1" disabled={uploading}>
              Send
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}