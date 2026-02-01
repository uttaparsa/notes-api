"use client";

import React, { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import { fetchWithAuth } from "@/app/lib/api";
import { handleApiError } from "@/app/utils/errorHandler";
import { ToastContext } from "@/app/(notes)/layout";
import FileUploadComponent from "@/app/components/FileUploadComponent";

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const showToast = useContext(ToastContext);
  const [collection, setCollection] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");

  useEffect(() => {
    loadCollection();
    loadFiles();
  }, [params.id]);

  const loadCollection = async () => {
    try {
      const data = await fetchWithAuth(`/api/note/collections/${params.id}/`);
      setCollection(data);
      setCollectionName(data.name);
      setCollectionDescription(data.description);
    } catch (error) {
      handleApiError(error, showToast);
      router.push("/");
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(
        `/api/note/collections/${params.id}/files/`,
      );
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      handleApiError(error, showToast);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = async (uploadedFiles) => {
    for (const file of uploadedFiles) {
      try {
        await fetchWithAuth(`/api/note/collections/${params.id}/files/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ file_id: file.id }),
        });
      } catch (error) {
        handleApiError(error, showToast);
      }
    }
    setShowUploadModal(false);
    loadFiles();
    showToast("Files added to collection", "success");
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Remove this file from the collection?")) return;

    try {
      await fetchWithAuth(`/api/note/collections/${params.id}/files/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_id: fileId }),
      });
      setFiles(files.filter((f) => f.id !== fileId));
      showToast("File removed from collection", "success");
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const handleUpdateCollection = async () => {
    try {
      await fetchWithAuth(`/api/note/collections/${params.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: collectionName,
          description: collectionDescription,
        }),
      });
      setCollection({
        ...collection,
        name: collectionName,
        description: collectionDescription,
      });
      setShowEditModal(false);
      showToast("Collection updated", "success");
    } catch (error) {
      handleApiError(error, showToast);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (contentType) => {
    if (contentType?.startsWith("image/")) return "🖼️";
    if (contentType?.startsWith("video/")) return "🎬";
    if (contentType?.startsWith("audio/")) return "🎵";
    if (contentType?.includes("pdf")) return "📄";
    if (contentType?.includes("zip") || contentType?.includes("tar"))
      return "📦";
    return "📎";
  };

  if (!collection) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{collection.name}</h2>
          {collection.description && (
            <p className="text-muted">{collection.description}</p>
          )}
          <small className="text-muted">
            Category: {collection.list_name} | {files.length} file
            {files.length !== 1 ? "s" : ""}
          </small>
        </div>
        <div>
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={() => setShowEditModal(true)}
          >
            Edit Info
          </Button>
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            + Add Files
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : files.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <p className="text-muted">No files in this collection yet.</p>
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              Add Files
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {files.map((file) => (
            <Col key={file.id} xs={12} sm={6} md={4} lg={3}>
              <Card className="h-100">
                {file.content_type?.startsWith("image/") ? (
                  <Card.Img
                    variant="top"
                    src={file.url}
                    alt={file.name}
                    style={{
                      height: "200px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(file.url, "_blank")}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light"
                    style={{
                      height: "200px",
                      fontSize: "4rem",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(file.url, "_blank")}
                  >
                    {getFileIcon(file.content_type)}
                  </div>
                )}
                <Card.Body>
                  <Card.Title
                    className="text-truncate"
                    title={file.name}
                    style={{ fontSize: "0.9rem" }}
                  >
                    {file.name}
                  </Card.Title>
                  <Card.Text className="small text-muted">
                    {formatFileSize(file.size)}
                  </Card.Text>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Files to Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FileUploadComponent
            onFilesUploaded={handleFileUploaded}
            showToast={showToast}
          />
        </Modal.Body>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateCollection}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
