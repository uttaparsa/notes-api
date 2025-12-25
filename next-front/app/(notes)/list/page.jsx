'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { Container, ListGroup, Button, Modal, Form, Dropdown, Badge } from 'react-bootstrap';
import { NoteListContext, ToastContext } from '../layout';
import { fetchWithAuth } from '../../lib/api';

export default function CategoryList() {
  const [newListName, setNewListName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [renameListName, setRenameListName] = useState('');
  const noteLists = useContext(NoteListContext);
  const showToast = useContext(ToastContext);

  useEffect(() => {
    window.dispatchEvent(new Event('updateNoteLists'));
  }, []);

  const handleApiCall = async (apiCall, successMessage, errorMessage) => {
    try {
      window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: { title: 'Waiting for server response' } }));
      const response = await apiCall();
      if (!response.ok) throw new Error(errorMessage);
      window.dispatchEvent(new Event('hideWaitingModal'));
      window.dispatchEvent(new Event('updateNoteLists'));
      if (successMessage) showToast('Success', successMessage, 3000, 'success');
    } catch (err) {
      window.dispatchEvent(new Event('hideWaitingModal'));
      showToast('Error', errorMessage, 3000, 'danger');
    }
  };

  const toggleShowInFeed = (list) => handleApiCall(
    () => fetchWithAuth(`/api/note/list/${list.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show_in_feed: !list.show_in_feed }),
    }),
    null,
    'Failed to update show in feed setting'
  );

  const toggleDisableRelated = (list) => handleApiCall(
    () => fetchWithAuth(`/api/note/list/${list.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disable_related: !list.disable_related }),
    }),
    null,
    'Failed to update disable related setting'
  );

  const archiveTopic = (topicId) => handleApiCall(
    () => fetchWithAuth(`/api/note/list/${topicId}/archive/`, { method: 'GET' }),
    null,
    'Failed to archive topic'
  );

  const unArchiveTopic = (topicId) => handleApiCall(
    () => fetchWithAuth(`/api/note/list/${topicId}/unarchive/`, { method: 'GET' }),
    null,
    'Failed to unarchive topic'
  );

  const sendNewListName = () => handleApiCall(
    () => fetchWithAuth('/api/note/list/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName }),
    }),
    'New list created',
    'Failed to create new list'
  ).then(() => {
    setShowModal(false);
    setNewListName('');
  });

  const renameList = () => handleApiCall(
    () => fetchWithAuth(`/api/note/list/${selectedList.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameListName }),
    }),
    'List renamed',
    'Failed to rename list'
  ).then(() => {
    setShowRenameModal(false);
    setRenameListName('');
  });

  const openRenameModal = (list) => {
    setSelectedList(list);
    setRenameListName(list.name);
    setShowRenameModal(true);
  };

  const openDeleteModal = (list) => {
    setSelectedList(list);
    setShowDeleteModal(true);
  };

  const deleteList = () => handleApiCall(
    () => fetchWithAuth(`/api/note/list/${selectedList.id}/`, {
      method: 'DELETE',
    }),
    'List deleted',
    'Failed to delete list'
  ).then(() => {
    setShowDeleteModal(false);
    setSelectedList(null);
  });

  return (
    <Container className="py-4">
      <ListGroup>
        {noteLists.map((lst, lst_idx) => (
          <React.Fragment key={lst.id}>
            {lst_idx > 0 && lst_idx < (noteLists.length - 1) && lst.archived !== noteLists[lst_idx - 1].archived && (
              <hr className="my-3" />
            )}
            <ListGroup.Item 
              className="d-flex justify-content-between align-items-center mb-2"
              variant="secondary"
            >
              <div className="d-flex align-items-center gap-2">
                <Link href={`/list/${lst.slug}/`} className="text-decoration-none">
                  {lst.name}
                </Link>
                {lst.show_in_feed && (
                  <Badge bg="secondary" pill>
                    Feed
                  </Badge>
                )}
                {!lst.disable_related && (
                  <Badge bg="primary" pill>
                    Related
                  </Badge>
                )}
              </div>
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  Actions
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => toggleShowInFeed(lst)}>
                    <Form.Check
                      type="checkbox"
                      checked={lst.show_in_feed}
                      onChange={() => {}}
                      label="Show in feed"
                      className="mb-0"
                      readOnly
                    />
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => toggleDisableRelated(lst)}>
                    <Form.Check
                      type="checkbox"
                      checked={!lst.disable_related}
                      onChange={() => {}}
                      label="Show related messages"
                      className="mb-0"
                      readOnly
                    />
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => openRenameModal(lst)}>
                    Rename
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => lst.archived ? unArchiveTopic(lst.id) : archiveTopic(lst.id)}>
                    {lst.archived ? "Unarchive" : "Archive"}
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    onClick={() => openDeleteModal(lst)}
                    className="text-danger"
                  >
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </ListGroup.Item>
          </React.Fragment>
        ))}
      </ListGroup>

      <div className="text-center mt-4">
        <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
          Create New List
        </Button>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>List Name</Form.Label>
            <Form.Control
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter new list name"
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
          <Form.Group>
            <Form.Label>New List Name</Form.Label>
            <Form.Control
              type="text"
              value={renameListName}
              onChange={(e) => setRenameListName(e.target.value)}
              placeholder="Enter new name for the list"
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

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the list "{selectedList?.name}"?</p>
          <p className="text-danger">This action cannot be undone. The list must be empty to be deleted.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteList}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}