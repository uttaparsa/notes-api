'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { Container, ListGroup, Button, Modal, Form, Dropdown, Badge, Card, Row, Col } from 'react-bootstrap';
import { NoteListContext, WorkspaceContext, ToastContext, SelectedWorkspaceContext } from '../layout';
import { fetchWithAuth } from '../../lib/api';

export default function CategoryList() {
  const [newListName, setNewListName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [renameListName, setRenameListName] = useState('');
  
  // Workspace related state
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showWorkspaceRenameModal, setShowWorkspaceRenameModal] = useState(false);
  const [showWorkspaceDeleteModal, setShowWorkspaceDeleteModal] = useState(false);
  const [localSelectedWorkspace, setLocalSelectedWorkspace] = useState(null);
  const [renameWorkspaceName, setRenameWorkspaceName] = useState('');
  const [renameWorkspaceDescription, setRenameWorkspaceDescription] = useState('');
  
  const noteLists = useContext(NoteListContext);
  const workspaces = useContext(WorkspaceContext);
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const showToast = useContext(ToastContext);

  const filteredNoteLists = selectedWorkspace && !selectedWorkspace.is_default ? noteLists.filter(lst => lst.workspaces.some(ws => ws.id === selectedWorkspace.id)) : noteLists;

  useEffect(() => {
    window.dispatchEvent(new Event('updateNoteLists'));
    window.dispatchEvent(new Event('updateWorkspaces'));
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
    () => fetchWithAuth(`/api/note/list/${selectedList.id}/delete`, {
      method: 'DELETE',
    }),
    'List deleted',
    'Failed to delete list'
  ).then(() => {
    setShowDeleteModal(false);
    setSelectedList(null);
  });

  // Workspace functions
  const createWorkspace = () => handleApiCall(
    () => fetchWithAuth('/api/note/workspaces/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newWorkspaceName,
        description: newWorkspaceDescription 
      }),
    }),
    'Workspace created',
    'Failed to create workspace'
  ).then(() => {
    setShowWorkspaceModal(false);
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
  });

  const renameWorkspace = () => handleApiCall(
    () => fetchWithAuth(`/api/note/workspaces/${localSelectedWorkspace.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: renameWorkspaceName,
        description: renameWorkspaceDescription 
      }),
    }),
    'Workspace renamed',
    'Failed to rename workspace'
  ).then(() => {
    setShowWorkspaceRenameModal(false);
    setRenameWorkspaceName('');
    setRenameWorkspaceDescription('');
  });

  const openWorkspaceRenameModal = (workspace) => {
    setLocalSelectedWorkspace(workspace);
    setRenameWorkspaceName(workspace.name);
    setRenameWorkspaceDescription(workspace.description || '');
    setShowWorkspaceRenameModal(true);
  };

  const openWorkspaceDeleteModal = (workspace) => {
    setLocalSelectedWorkspace(workspace);
    setShowWorkspaceDeleteModal(true);
  };

  const deleteWorkspace = () => handleApiCall(
    () => fetchWithAuth(`/api/note/workspaces/${localSelectedWorkspace.id}/`, {
      method: 'DELETE',
    }),
    'Workspace deleted',
    'Failed to delete workspace'
  ).then(() => {
    setShowWorkspaceDeleteModal(false);
    setLocalSelectedWorkspace(null);
  });

  return (
    <Container className="py-4">
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Categories</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {filteredNoteLists.map((lst, lst_idx) => (
                  <React.Fragment key={lst.id}>
                    <ListGroup.Item 
                      className="d-flex justify-content-between align-items-center mb-2"
                      variant="secondary"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <Link href={`/list/${lst.slug}/`} className="text-decoration-none">
                          {lst.name}
                        </Link>
                        {lst.workspaces && lst.workspaces.length > 0 && (
                          <Badge bg="info" pill>
                            {lst.workspaces.length} WS
                          </Badge>
                        )}
                      </div>
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openRenameModal(lst)}>
                            Rename
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
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                  Create New Category
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Workspaces</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {workspaces.map((workspace) => (
                  <ListGroup.Item 
                    key={workspace.id}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <div>
                      <div className="fw-bold">
                        <Link href={`/workspace/${workspace.slug}/`} className="text-decoration-none">
                          {workspace.name}
                        </Link>
                        {workspace.is_default && (
                          <Badge bg="success" className="ms-2">Default</Badge>
                        )}
                      </div>
                      {workspace.description && (
                        <small className="text-muted">{workspace.description}</small>
                      )}
                      <div className="mt-1">
                        <small className="text-muted">
                          {workspace.categories.length} categories
                        </small>
                      </div>
                    </div>
                    <Dropdown align="end">
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => openWorkspaceRenameModal(workspace)}>
                          Rename
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          onClick={() => openWorkspaceDeleteModal(workspace)}
                          className="text-danger"
                        >
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="text-center mt-4">
                <Button variant="success" size="sm" onClick={() => setShowWorkspaceModal(true)}>
                  Create New Workspace
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
          <Modal.Title>Delete Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the category "{selectedList?.name}"?</p>
          <p className="text-danger">This action cannot be undone. The category must be empty to be deleted.</p>
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

      {/* Workspace Modals */}
      <Modal show={showWorkspaceModal} onHide={() => setShowWorkspaceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Workspace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Workspace Name</Form.Label>
            <Form.Control
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={newWorkspaceDescription}
              onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              placeholder="Enter workspace description"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkspaceModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={createWorkspace}>
            Create Workspace
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showWorkspaceRenameModal} onHide={() => setShowWorkspaceRenameModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rename Workspace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Workspace Name</Form.Label>
            <Form.Control
              type="text"
              value={renameWorkspaceName}
              onChange={(e) => setRenameWorkspaceName(e.target.value)}
              placeholder="Enter new workspace name"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={renameWorkspaceDescription}
              onChange={(e) => setRenameWorkspaceDescription(e.target.value)}
              placeholder="Enter workspace description"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkspaceRenameModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={renameWorkspace}>
            Rename Workspace
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showWorkspaceDeleteModal} onHide={() => setShowWorkspaceDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Workspace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the workspace "{localSelectedWorkspace?.name}"?</p>
          <p className="text-danger">This action cannot be undone. Categories in this workspace will remain but won't be associated with any workspace.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkspaceDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteWorkspace}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}