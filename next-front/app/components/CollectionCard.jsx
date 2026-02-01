"use client";

import React, { useState, useContext } from "react";
import { Dropdown, Modal, Button, Card, Row, Col } from "react-bootstrap";
import { NoteListContext, ToastContext } from "../(notes)/layout";
import { SelectedWorkspaceContext } from "../(notes)/layout";
import { copyTextToClipboard } from "../utils/clipboardUtils";
import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";
import NoteCardBottomBar from "./notecard/NoteCardBottomBar";
import { useRouter } from "next/navigation";

const CollectionCard = ({
  collection,
  onDeleteCollection,
  refreshCollections,
}) => {
  const router = useRouter();
  const showToast = useContext(ToastContext);
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const noteLists = useContext(NoteListContext);
  const [showOtherCategories, setShowOtherCategories] = useState(false);

  const workspaceCategories = selectedWorkspace?.is_default
    ? noteLists
    : noteLists.filter((list) =>
        selectedWorkspace?.category_ids?.includes(list.id),
      );

  const otherCategories = noteLists.filter(
    (list) => !selectedWorkspace?.category_ids?.includes(list.id),
  );

  const handleMoveCollection = async (newListId) => {
    try {
      await fetchWithAuth(`/api/note/collections/${collection.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ list: newListId }),
      });
      showToast("Collection moved successfully", "success");
      setShowMoveModal(false);
      if (refreshCollections) refreshCollections();
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/collection/${collection.id}`;
    copyTextToClipboard(link);
    showToast("Link copied to clipboard", "success");
  };

  const handleDeleteCollection = async () => {
    try {
      await fetchWithAuth(`/api/note/collections/${collection.id}/`, {
        method: "DELETE",
      });
      showToast("Collection deleted", "success");
      setShowDeleteModal(false);
      if (onDeleteCollection) onDeleteCollection(collection.id);
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const handleArchive = async () => {
    try {
      await fetchWithAuth(`/api/note/collections/${collection.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived: !collection.archived }),
      });
      showToast(
        collection.archived ? "Collection unarchived" : "Collection archived",
        "success",
      );
      if (refreshCollections) refreshCollections();
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const handleIncreaseImportance = async () => {
    if (collection.importance < 4) {
      try {
        await fetchWithAuth(`/api/note/collections/${collection.id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ importance: collection.importance + 1 }),
        });
        if (refreshCollections) refreshCollections();
      } catch (error) {
        handleApiError(error, showToast);
      }
    }
  };

  const handleDecreaseImportance = async () => {
    if (collection.importance > 0) {
      try {
        await fetchWithAuth(`/api/note/collections/${collection.id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ importance: collection.importance - 1 }),
        });
        if (refreshCollections) refreshCollections();
      } catch (error) {
        handleApiError(error, showToast);
      }
    }
  };

  const handleCardClick = (e) => {
    if (e.target.closest(".dropdown") || e.target.closest("button")) {
      return;
    }
    router.push(`/collection/${collection.id}`);
  };

  return (
    <>
      <Card
        className="mb-3 shadow-sm"
        style={{ cursor: "pointer" }}
        onClick={handleCardClick}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="flex-grow-1">
              <h5 className="mb-1">{collection.name}</h5>
              {collection.description && (
                <p className="text-muted small mb-2">
                  {collection.description}
                </p>
              )}
            </div>
            <Dropdown onClick={(e) => e.stopPropagation()}>
              <Dropdown.Toggle
                variant="link"
                className="text-decoration-none p-0"
                style={{ boxShadow: "none" }}
              >
                ⋮
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setShowMoveModal(true)}>
                  Move
                </Dropdown.Item>
                <Dropdown.Item onClick={handleCopyLink}>
                  Copy Link
                </Dropdown.Item>
                <Dropdown.Item onClick={handleArchive}>
                  {collection.archived ? "Unarchive" : "Archive"}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() => setShowDeleteModal(true)}
                  className="text-danger"
                >
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {collection.thumbnail_files?.length > 0 && (
            <Row className="g-2 mb-2">
              {collection.thumbnail_files.map((file, index) => (
                <Col xs={6} sm={3} key={file.id}>
                  {file.content_type?.startsWith("image/") ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="img-fluid rounded"
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light rounded"
                      style={{ width: "100%", height: "100px" }}
                    >
                      <span className="text-muted">📄</span>
                    </div>
                  )}
                </Col>
              ))}
            </Row>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {collection.file_count} file
              {collection.file_count !== 1 ? "s" : ""}
            </small>
          </div>

          <NoteCardBottomBar
            note={collection}
            onIncreaseImportance={handleIncreaseImportance}
            onDecreaseImportance={handleDecreaseImportance}
          />
        </Card.Body>
      </Card>

      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Move Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {workspaceCategories.length > 0 && (
            <>
              <h6>
                {selectedWorkspace?.is_default
                  ? "All Categories"
                  : "Workspace Categories"}
              </h6>
              {workspaceCategories.map((list) => (
                <Button
                  key={list.id}
                  variant="outline-primary"
                  className="m-1"
                  onClick={() => handleMoveCollection(list.id)}
                >
                  {list.name}
                </Button>
              ))}
            </>
          )}

          {!selectedWorkspace?.is_default && otherCategories.length > 0 && (
            <>
              <hr />
              <Button
                variant="link"
                onClick={() => setShowOtherCategories(!showOtherCategories)}
                className="p-0 mb-2"
              >
                {showOtherCategories ? "Hide" : "Show"} Other Categories
              </Button>
              {showOtherCategories && (
                <>
                  {otherCategories.map((list) => (
                    <Button
                      key={list.id}
                      variant="outline-secondary"
                      className="m-1"
                      onClick={() => handleMoveCollection(list.id)}
                    >
                      {list.name}
                    </Button>
                  ))}
                </>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete &quot;{collection.name}&quot;? This
          will not delete the files themselves.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCollection}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CollectionCard;
