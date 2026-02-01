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

export default function CategorySection({
  noteLists,
  selectedWorkspace,
  showToast,
}) {
  const [newListName, setNewListName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [renameListName, setRenameListName] = useState("");

  const filteredNoteLists =
    selectedWorkspace && !selectedWorkspace.is_default
      ? noteLists.filter((lst) =>
          lst.workspaces.some((ws) => ws.id === selectedWorkspace.id),
        )
      : noteLists;

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
      window.dispatchEvent(new Event("updateNoteLists"));
      if (successMessage) showToast("Success", successMessage, 3000, "success");
    } catch (err) {
      window.dispatchEvent(new Event("hideWaitingModal"));
      showToast("Error", errorMessage, 3000, "danger");
    }
  };

  const sendNewListName = () =>
    handleApiCall(
      () =>
        fetchWithAuth("/api/note/list/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newListName }),
        }),
      "New list created",
      "Failed to create new list",
    ).then(() => {
      setShowModal(false);
      setNewListName("");
    });

  const renameList = () =>
    handleApiCall(
      () =>
        fetchWithAuth(`/api/note/list/${selectedList.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renameListName }),
        }),
      "List renamed",
      "Failed to rename list",
    ).then(() => {
      setShowRenameModal(false);
      setRenameListName("");
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

  const deleteList = () =>
    handleApiCall(
      () =>
        fetchWithAuth(`/api/note/list/${selectedList.id}/delete`, {
          method: "DELETE",
        }),
      "List deleted",
      "Failed to delete list",
    ).then(() => {
      setShowDeleteModal(false);
      setSelectedList(null);
    });

  return (
    <Card className="mb-4">
      <Card.Header>
        <h4 className="mb-0">Categories</h4>
      </Card.Header>
      <Card.Body>
        <ListGroup variant="flush">
          {filteredNoteLists.map((lst) => (
            <ListGroup.Item
              key={lst.id}
              className="d-flex justify-content-between align-items-center mb-2"
              variant="secondary"
            >
              <div className="d-flex align-items-center gap-2">
                <Link
                  href={`/?category=${lst.slug}`}
                  className="text-decoration-none"
                >
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
          ))}
        </ListGroup>

        <div className="text-center mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            Create New Category
          </Button>
        </div>
      </Card.Body>

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
          <p>
            Are you sure you want to delete the category &quot;
            {selectedList?.name}&quot;?
          </p>
          <p className="text-danger">
            This action cannot be undone. The category must be empty to be
            deleted.
          </p>
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
    </Card>
  );
}
