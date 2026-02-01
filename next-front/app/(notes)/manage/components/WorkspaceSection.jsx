"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ListGroup,
  Button,
  Modal,
  Form,
  Dropdown,
  Badge,
  Card,
} from "react-bootstrap";
import { fetchWithAuth } from "../../../lib/api";

export default function WorkspaceSection({ workspaces, showToast }) {
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showWorkspaceRenameModal, setShowWorkspaceRenameModal] =
    useState(false);
  const [showWorkspaceDeleteModal, setShowWorkspaceDeleteModal] =
    useState(false);
  const [localSelectedWorkspace, setLocalSelectedWorkspace] = useState(null);
  const [renameWorkspaceName, setRenameWorkspaceName] = useState("");
  const [renameWorkspaceDescription, setRenameWorkspaceDescription] =
    useState("");

  const handleApiCall = async (apiCall, successMessage, errorMessage) => {
    try {
      window.dispatchEvent(
        new CustomEvent("showWaitingModal", {
          detail: { title: "Waiting for server response" },
        }),
      );
      const response = await apiCall();
      if (!response.ok) throw new Error(errorMessage);
      window.dispatchEvent(new Event("hideWaitingModal"));
      window.dispatchEvent(new Event("updateWorkspaces"));
      if (successMessage) showToast("Success", successMessage, 3000, "success");
    } catch (err) {
      window.dispatchEvent(new Event("hideWaitingModal"));
      showToast("Error", errorMessage, 3000, "danger");
    }
  };

  const createWorkspace = () =>
    handleApiCall(
      () =>
        fetchWithAuth("/api/note/workspaces/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newWorkspaceName,
            description: newWorkspaceDescription,
          }),
        }),
      "Workspace created",
      "Failed to create workspace",
    ).then(() => {
      setShowWorkspaceModal(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
    });

  const renameWorkspace = () =>
    handleApiCall(
      () =>
        fetchWithAuth(`/api/note/workspaces/${localSelectedWorkspace.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: renameWorkspaceName,
            description: renameWorkspaceDescription,
          }),
        }),
      "Workspace renamed",
      "Failed to rename workspace",
    ).then(() => {
      setShowWorkspaceRenameModal(false);
      setRenameWorkspaceName("");
      setRenameWorkspaceDescription("");
    });

  const openWorkspaceRenameModal = (workspace) => {
    setLocalSelectedWorkspace(workspace);
    setRenameWorkspaceName(workspace.name);
    setRenameWorkspaceDescription(workspace.description || "");
    setShowWorkspaceRenameModal(true);
  };

  const openWorkspaceDeleteModal = (workspace) => {
    setLocalSelectedWorkspace(workspace);
    setShowWorkspaceDeleteModal(true);
  };

  const deleteWorkspace = () =>
    handleApiCall(
      () =>
        fetchWithAuth(`/api/note/workspaces/${localSelectedWorkspace.id}/`, {
          method: "DELETE",
        }),
      "Workspace deleted",
      "Failed to delete workspace",
    ).then(() => {
      setShowWorkspaceDeleteModal(false);
      setLocalSelectedWorkspace(null);
    });

  return (
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
                  <Link
                    href={`/workspace/${workspace.slug}/`}
                    className="text-decoration-none"
                  >
                    {workspace.name}
                  </Link>
                  {workspace.is_default && (
                    <Badge bg="success" className="ms-2">
                      Default
                    </Badge>
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
                  <Dropdown.Item
                    onClick={() => openWorkspaceRenameModal(workspace)}
                  >
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
          <Button
            variant="success"
            size="sm"
            onClick={() => setShowWorkspaceModal(true)}
          >
            Create New Workspace
          </Button>
        </div>
      </Card.Body>

      <Modal
        show={showWorkspaceModal}
        onHide={() => setShowWorkspaceModal(false)}
      >
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
          <Button
            variant="secondary"
            onClick={() => setShowWorkspaceModal(false)}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={createWorkspace}>
            Create Workspace
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showWorkspaceRenameModal}
        onHide={() => setShowWorkspaceRenameModal(false)}
      >
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
          <Button
            variant="secondary"
            onClick={() => setShowWorkspaceRenameModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={renameWorkspace}>
            Rename Workspace
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showWorkspaceDeleteModal}
        onHide={() => setShowWorkspaceDeleteModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Workspace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the workspace &quot;
            {localSelectedWorkspace?.name}&quot;?
          </p>
          <p className="text-danger">
            This action cannot be undone. Categories in this workspace will
            remain but won&apos;t be associated with any workspace.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowWorkspaceDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteWorkspace}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
