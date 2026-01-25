'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { Container, ListGroup, Button, Modal, Form, Dropdown, Badge, Card, Row, Col, Alert } from 'react-bootstrap';
import { NoteListContext, WorkspaceContext, ToastContext } from '../../layout';
import { fetchWithAuth } from '../../../lib/api';

export default function WorkspaceDetail({ params }) {
  const [workspace, setWorkspace] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const noteLists = useContext(NoteListContext);
  const workspaces = useContext(WorkspaceContext);
  const showToast = useContext(ToastContext);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const workspaceSlug = params.slug;
        const foundWorkspace = workspaces.find(w => w.slug === workspaceSlug);

        if (foundWorkspace) {
          setWorkspace(foundWorkspace);

          // Get categories not in this workspace
          const workspaceCategoryIds = foundWorkspace.categories.map(c => c.id);
          const available = noteLists.filter(list =>
            !workspaceCategoryIds.includes(list.id)
          );
          setAvailableCategories(available);
        }
      } catch (error) {
        console.error('Error loading workspace:', error);
        showToast('Error', 'Failed to load workspace', 3000, 'danger');
      } finally {
        setLoading(false);
      }
    };

    if (workspaces.length > 0 && noteLists.length > 0) {
      loadWorkspace();
    }
  }, [params.slug, workspaces, noteLists, showToast]);

  const handleApiCall = async (apiCall, successMessage, errorMessage) => {
    try {
      window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: { title: 'Waiting for server response' } }));
      const response = await apiCall();
      if (!response.ok) throw new Error(errorMessage);
      window.dispatchEvent(new Event('hideWaitingModal'));
      window.dispatchEvent(new Event('updateWorkspaces'));
      if (successMessage) showToast('Success', successMessage, 3000, 'success');
      return response;
    } catch (err) {
      window.dispatchEvent(new Event('hideWaitingModal'));
      showToast('Error', errorMessage, 3000, 'danger');
      throw err;
    }
  };

  const addCategoriesToWorkspace = async () => {
    if (selectedCategories.length === 0) return;

    try {
      await handleApiCall(
        () => fetchWithAuth(`/api/note/workspaces/${workspace.id}/categories/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_ids: selectedCategories }),
        }),
        'Categories added to workspace',
        'Failed to add categories'
      );
      setShowAddCategoryModal(false);
      setSelectedCategories([]);
    } catch (error) {
      // Error already handled in handleApiCall
    }
  };

  const removeCategoryFromWorkspace = async (categoryId) => {
    try {
      await handleApiCall(
        () => fetchWithAuth(`/api/note/workspaces/${workspace.id}/categories/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_ids: [categoryId] }),
        }),
        'Category removed from workspace',
        'Failed to remove category'
      );
    } catch (error) {
      // Error already handled in handleApiCall
    }
  };

  const setDefaultCategory = async (categoryId) => {
    try {
      await handleApiCall(
        () => fetchWithAuth(`/api/note/workspaces/${workspace.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ default_category: categoryId }),
        }),
        'Default category updated',
        'Failed to update default category'
      );
    } catch (error) {
      // Error already handled in handleApiCall
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading workspace...</div>
      </Container>
    );
  }

  if (!workspace) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Workspace not found</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2>{workspace.name}</h2>
        {workspace.description && (
          <p className="text-muted">{workspace.description}</p>
        )}
        {workspace.is_default && (
          <Badge bg="success">Default Workspace</Badge>
        )}
      </div>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Categories in this Workspace ({workspace.categories.length})</h4>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowAddCategoryModal(true)}
                  disabled={availableCategories.length === 0}
                >
                  Add Categories
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {workspace.categories.length === 0 ? (
                <p className="text-muted">No categories in this workspace yet.</p>
              ) : (
                <ListGroup variant="flush">
                  {workspace.categories.map((category) => (
                    <ListGroup.Item
                      key={category.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <Link href={`/list/${category.slug}/`} className="text-decoration-none">
                          {category.name}
                        </Link>
                        {workspace.default_category === category.id && (
                          <Badge bg="primary" pill>Default</Badge>
                        )}
                      </div>
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setDefaultCategory(category.id)}>
                            <Form.Check
                              type="radio"
                              checked={workspace.default_category === category.id}
                              onChange={() => {}}
                              label="Set as default"
                              className="mb-0"
                              readOnly
                            />
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            onClick={() => removeCategoryFromWorkspace(category.id)}
                            className="text-danger"
                          >
                            Remove from workspace
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Workspace Info</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Categories:</strong> {workspace.categories.length}</p>
              <p><strong>Created:</strong> {new Date(workspace.created_at).toLocaleDateString()}</p>
              {workspace.default_category_name && (
                <p><strong>Default Category:</strong> {workspace.default_category_name}</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Categories Modal */}
      <Modal show={showAddCategoryModal} onHide={() => setShowAddCategoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Categories to Workspace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select categories to add to this workspace:</p>
          {availableCategories.length === 0 ? (
            <Alert variant="info">All available categories are already in this workspace.</Alert>
          ) : (
            <Form>
              {availableCategories.map((category) => (
                <div key={category.id} className="d-flex align-items-center mb-2">
                  <Form.Check
                    type="checkbox"
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      }
                    }}
                    className="me-2"
                  />
                  <label htmlFor={`category-${category.id}`} className="form-check-label flex-grow-1">
                    {category.name}
                  </label>
                </div>
              ))}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddCategoryModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={addCategoriesToWorkspace}
            disabled={selectedCategories.length === 0}
          >
            Add Selected Categories
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}