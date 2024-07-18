import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Dropdown, Modal } from 'react-bootstrap';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';

const Note = ({ note, singleView, hideEdits, onPin, onUnpin, onArchived, onUnarchived, onDeleteNote, onEditNote }) => {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [textInsideDeleteModal, setTextInsideDeleteModal] = useState('');
  const [editedText, setEditedText] = useState(note.text);
  const [isRTL, setIsRTL] = useState(false);
  
  const editMessageTextArea = useRef(null);
  const rtlIcon = useRef(null);
  const ltrIcon = useRef(null);
  
  const router = useRouter();

  useEffect(() => {
    setIsRTL(checkIfRTL(note.text));
  }, [note.text]);

  const checkIfRTL = (text) => {
    // Implement RTL detection logic here
    return false; // Placeholder
  };

  const copyElementTextToClipboard = (element) => {
    // Implement clipboard copy functionality
  };

  const expandNote = () => {
    // Implement note expansion logic
  };

  const moveNote = async (listId) => {
    try {
      // Implement showWaitingModal functionality
      const response = await fetch(`/api/note/message/move/${note.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ list_id: listId }),
      });
      if (response.ok) {
        note.list = listId;
        setShowMoveModal(false);
      }
      // Implement hideWaitingModal functionality
    } catch (err) {
      // Implement error handling
      console.error('Error moving note:', err);
    }
  };

  const editNote = () => {
    onEditNote(note.id, editedText);
    setShowEditModal(false);
  };

  const processNoteText = () => {
    return (singleView || note.text.length < 1000 || note.expand === true) 
      ? note.text 
      : note.text.substring(0, 1000);
  };

  const pinMessage = async () => {
    try {
      // Implement showWaitingModal functionality
      const response = await fetch(`/api/note/message/pin/${note.id}/`);
      if (response.ok) {
        onPin(note.id);
      }
      // Implement hideWaitingModal functionality
    } catch (err) {
      // Implement error handling
      console.error('Error pinning note:', err);
    }
  };

  const unpinMessage = async () => {
    try {
      // Implement showWaitingModal functionality
      const response = await fetch(`/api/note/message/unpin/${note.id}/`);
      if (response.ok) {
        onUnpin(note.id);
      }
      // Implement hideWaitingModal functionality
    } catch (err) {
      // Implement error handling
      console.error('Error unpinning note:', err);
    }
  };

  const archiveMessage = async () => {
    try {
      // Implement showWaitingModal functionality
      const response = await fetch(`/api/note/message/archive/${note.id}/`);
      if (response.ok) {
        onArchived(note.id);
      }
      // Implement hideWaitingModal functionality
    } catch (err) {
      // Implement error handling
      console.error('Error archiving note:', err);
    }
  };

  const unarchiveMessage = async () => {
    try {
      // Implement showWaitingModal functionality
      const response = await fetch(`/api/note/message/unarchive/${note.id}/`);
      if (response.ok) {
        onUnarchived(note.id);
      }
      // Implement hideWaitingModal functionality
    } catch (err) {
      // Implement error handling
      console.error('Error unarchiving note:', err);
    }
  };

  const toggleEditorRtl = () => {
    setIsRTL(!isRTL);
  };

  const updateTextAreaHeight = (target) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleEnter = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      editNote();
    }
  };

  // Helper function to format date (implement as needed)
  const formatDate = (date, format) => {
    // Implement date formatting
    return date;
  };

  return (
    <div className="card rounded bg-secondary mb-2">
      <div className="card-body pb-1">
        <div className="row">
          <div className="col-sm-1">
            <Dropdown>
              <Dropdown.Toggle variant="dark" id="dropdown-basic">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M24 6h-24v-4h24v4zm0 4h-24v4h24v-4zm0 8h-24v4h24v-4z" />
                </svg>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {!hideEdits && <Dropdown.Item onClick={() => setShowMoveModal(true)}>Move</Dropdown.Item>}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => copyElementTextToClipboard(document.getElementById(`text-${note.id}`))}>Copy</Dropdown.Item>
                {!hideEdits && <Dropdown.Item onClick={() => setShowEditModal(true)}>Edit</Dropdown.Item>}
                {!singleView && !hideEdits && (
                  <>
                    {!note.pinned 
                      ? <Dropdown.Item onClick={pinMessage}>Pin</Dropdown.Item>
                      : <Dropdown.Item onClick={unpinMessage}>Unpin</Dropdown.Item>
                    }
                    {!note.archived
                      ? <Dropdown.Item onClick={archiveMessage}>Archive</Dropdown.Item>
                      : <Dropdown.Item onClick={unarchiveMessage}>Unarchive</Dropdown.Item>
                    }
                    <Dropdown.Item onClick={() => setShowDeleteModal(true)}>Delete</Dropdown.Item>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <div className="col-sm-11 pl-md-1">
            <h6 className="card-subtitle mb-2 text-info">{note.sender_name}</h6>
            
            {note.image && (
              <img src={note.image} style={{ maxHeight: '200px' }} alt="..." className="img-thumbnail" />
            )}
            
            {note.file && (
              <a href={note.file}>
                <div className="bg-info float-left p-1 rounded text-dark">
                  {/* SVG for file icon */}
                  <span>{note.file.split('/').pop()}</span>
                </div>
              </a>
            )}
            
            <span
              id={`text-${note.id}`}
              className={`card-text text-light ${isRTL ? 'text-right' : ''}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <ReactMarkdown>{processNoteText()}</ReactMarkdown>
              
              {!singleView && note.text.length > 1000 && !note.expand && (
                <span onClick={expandNote} className='h4 mx-2 px-1 rounded py-0 bg-dark flex-sn-wrap'>
                  <b>...{note.expand}</b>
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-2 mb-0">
          <div className="float-right d-flex">
            <Link href={`/list/${getListSlug()}/`}>
              <a className="my-0 mr-2 text-dark" style={{ fontSize: '2em' }}>{getListName()}</a>
            </Link>
            
            {note.pinned && (
              <span className="text-info">
                {/* SVG for pin icon */}
              </span>
            )}
            
            {note.archived && (
              <span className="text-info mx-2">
                {/* SVG for archive icon */}
              </span>
            )}
            
            <span className="d-md-none">
              {formatDate(note.created_at, 'small')}
            </span>
            <span className="d-none d-md-block">
              {formatDate(note.created_at, 'large')}
            </span>
          </div>

          <span className="ml-2">
            <Link href={`/message/${note.id}/`}>
              <a>
                {/* SVG for link icon */}
              </a>
            </Link>
          </span>
        </div>
      </div>

      {/* Move Modal */}
      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Moving note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Implement list selection for moving note */}
        </Modal.Body>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Are you sure you want to delete this message?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className={isRTL ? 'text-right' : 'text-left'}>{textInsideDeleteModal}</p>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { onDeleteNote(note.id); setShowDeleteModal(false); }}>Delete</button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Editing message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-5 mt-0 px-2">
            <button
              type="button"
              onClick={toggleEditorRtl}
              className="btn btn-outline-dark btn-sm float-right"
            >
              {/* RTL/LTR toggle icons */}
            </button>
          </div>
          <textarea
            ref={editMessageTextArea}
            dir={isRTL ? 'rtl' : 'ltr'}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onKeyDown={handleEnter}
            onInput={(e) => updateTextAreaHeight(e.target)}
            className="w-100"
            style={{ whiteSpace: 'pre-line', maxHeight: '60vh' }}
          />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={editNote}>Save</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Note;