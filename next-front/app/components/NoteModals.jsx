'use client';

import React, { useState, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';

const NoteModals = () => {
  const [modalNote, setModalNote] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [textInsideDeleteModal, setTextInsideDeleteModal] = useState('');
  const editMessageTextAreaRef = useRef(null);
  const rtlIconRef = useRef(null);
  const ltrIconRef = useRef(null);

  const handleShowEditModal = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const toggleEditorRtl = () => {
    const current = editMessageTextAreaRef.current.dir;
    if (current === 'rtl') {
      rtlIconRef.current.style.display = 'none';
      ltrIconRef.current.style.display = 'block';
    } else if (current === 'ltr') {
      ltrIconRef.current.style.display = 'none';
      rtlIconRef.current.style.display = 'block';
    }
    editMessageTextAreaRef.current.dir = current === 'rtl' ? 'ltr' : 'rtl';
  };

  const handleShowDeleteModal = (note) => {
    const textInModal =
      note.text.length > 30 ? note.text.substring(0, 30) + ' ...' : note.text;
    setTextInsideDeleteModal(textInModal);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <textarea
            ref={editMessageTextAreaRef}
            defaultValue={modalNote}
          />
          <Button onClick={toggleEditorRtl}>
            <span ref={rtlIconRef}>RTL</span>
            <span ref={ltrIconRef} style={{ display: 'none' }}>LTR</span>
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleCloseEditModal}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this note?
          <p>{textInsideDeleteModal}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleCloseDeleteModal}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NoteModals;