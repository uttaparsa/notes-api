'use client';

import { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { Button, Modal, Form } from 'react-bootstrap';
import { NoteListContext, ToastContext } from '../layout';
import { fetchWithAuth } from '../../lib/api';

export default function CategoryList() {
  const [newListName, setNewListName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [renameListName, setRenameListName] = useState('');
  const noteLists = useContext(NoteListContext);
  const showToast = useContext(ToastContext);

  useEffect(() => {
    window.dispatchEvent(new Event('updateNoteLists'));
  }, []);

  const archiveTopic = async (topicId) => {
    try {
      window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: { title: 'Waiting for server response' } }));
      const response = await fetchWithAuth(`/api/note/list/${topicId}/archive/`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to archive topic');
      window.dispatchEvent(new Event('hideWaitingModal'));
      window.dispatchEvent(new Event('updateNoteLists'));
    } catch (err) {
      window.dispatchEvent(new Event('hideWaitingModal'));
      showToast('Error', 'Failed to archive topic', 3000, 'danger');
    }
  };

  const unArchiveTopic = async (topicId) => {
    try {
      window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: { title: 'Waiting for server response' } }));
      const response = await fetchWithAuth(`/api/note/list/${topicId}/unarchive/`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to unarchive topic');
      window.dispatchEvent(new Event('hideWaitingModal'));
      window.dispatchEvent(new Event('updateNoteLists'));
    } catch (err) {
      window.dispatchEvent(new Event('hideWaitingModal'));
      showToast('Error', 'Failed to unarchive topic', 3000, 'danger');
    }
  };

  const sendNewListName = async () => {
    try {
      const response = await fetchWithAuth('/api/note/list/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newListName }),
      });
      if (!response.ok) throw new Error('Failed to create new list');
      window.dispatchEvent(new Event('updateNoteLists'));
      setShowModal(false);
      showToast('Success', 'New list created', 3000, 'success');
    } catch (err) {
      showToast('Error', 'Failed to create new list', 3000, 'danger');
    }
  };

  const renameList = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/list/${selectedList.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: renameListName }),
      });
      if (!response.ok) throw new Error('Failed to rename list');
      window.dispatchEvent(new Event('updateNoteLists'));
      setShowRenameModal(false);
      showToast('Success', 'List renamed', 3000, 'success');
    } catch (err) {
      showToast('Error', 'Failed to rename list', 3000, 'danger');
    }
  };

  const openRenameModal = (list) => {
    setSelectedList(list);
    setRenameListName(list.name);
    setShowRenameModal(true);
  };

  return (
    <div className="container">
      <div className="py-4">
        {noteLists.map((lst, lst_idx) => (
          <span key={lst.id}>
            {lst_idx > 0 && lst_idx < (noteLists.length - 1) && lst.archived !== noteLists[lst_idx - 1].archived && (
              <hr />
            )}
            <li className="list-group-item text-light rounded d-flex" style={{ backgroundColor: 'gray' }} dir="ltr">
              <div className="d-flex flex-row align-items-center">
                <Link href={`/list/${lst.slug}/`} className="text-dark">
                  {lst.name}
                </Link>
              </div>
              <div className="ms-auto">
                {lst.archived ? (
                  <Button variant="light" size="sm" onClick={() => unArchiveTopic(lst.id)}>UnArchive</Button>
                ) : (
                  <Button variant="light" size="sm" onClick={() => archiveTopic(lst.id)}>Archive</Button>
                )}
                <Button variant="info" size="sm" className="ml-2" onClick={() => openRenameModal(lst)}>Rename</Button>
              </div>
            </li>
          </span>
        ))}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="d-flex flex-column">
            <Form.Label className="col-form-label align-self-start">List Name</Form.Label>
            <Form.Control
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={sendNewListName}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rename List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="d-flex flex-column">
            <Form.Label className="col-form-label align-self-start">New List Name</Form.Label>
            <Form.Control
              type="text"
              value={renameListName}
              onChange={(e) => setRenameListName(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRenameModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={renameList}>
            Rename
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="text-center m-4">
        <Button variant="primary" className="p-3" onClick={() => setShowModal(true)}>
          Create New List
        </Button>
      </div>
    </div>
  );
}