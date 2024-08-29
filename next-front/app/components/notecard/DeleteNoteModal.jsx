import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const DeleteNoteModal = ({ show, onHide, textInsideDeleteModal, onDeleteNote }) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Deleting note</Modal.Title>
      </Modal.Header>
      <Modal.Body>{textInsideDeleteModal}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onDeleteNote}
        >
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteNoteModal;