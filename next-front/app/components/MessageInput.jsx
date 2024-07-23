'use client'

import { useState, useRef } from 'react';
import { Form, Button } from 'react-bootstrap';

export default function MessageInput({ listSlug, onNoteSaved }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleEnter = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    // Implement your showWaitingModal logic here
    // For example: showWaitingModal("Waiting for server response");

    try {
      const obj = { text };
      const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
      const data = new FormData();
      data.append("meta", blob);
      
      if (file) {
        data.append("file", file);
        console.log("file selected");
      } else {
        console.log("no file selected");
      }

      let url = "/api/note/";
      if (listSlug && listSlug.length > 0) {
        url += `${listSlug}/`;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const responseData = await response.json();
      setText('');
      setFile(null);
      onNoteSaved(responseData);
    } catch (err) {
      // Implement your error handling logic here
      console.error('Error sending message:', err);
    }

    // Implement your hideWaitingModal logic here
    // For example: hideWaitingModal();
  };

  const handleInput = (e) => {
    setFile(e.target.files[0]);
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div dir="ltr">
      {file && (
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
            <div className="d-flex py-1">You`ve attached {file.name}</div>
            <div id="uploadPreview" className="mx-2" style={{ width: '30px', height: '35px' }}></div>
            <button type="button" className="ml-2 close" aria-label="Close" onClick={clearFile}>
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
              onClick={() => fileInputRef.current.click()}
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
            <Form.Control
              type="file"
              ref={fileInputRef}
              className="d-none"
              onChange={handleInput}
            />
            <Button type="submit" variant="primary" className="mr-2 ml-1">
              Send
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}