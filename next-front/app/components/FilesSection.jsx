"use client";

import { useState } from "react";
import { Button, Collapse, ListGroup, Modal } from "react-bootstrap";
import FileUploadComponent from "./FileUploadComponent"; // assuming it's in components

const FilesSection = ({ files, noteId, onFilesChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadSuccess = (data) => {
    onFilesChange([...files, data.file]);
    setShowUpload(false);
  };

  const handleDelete = async (fileId) => {
    if (!confirm("Remove this file from the note?")) return;
    try {
      const response = await fetch(`/api/note/message/${noteId}/files/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      });
      if (response.ok) {
        onFilesChange(files.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error("Error removing file:", error);
    }
  };

  return (
    <div className="mt-3">
      <Button variant="outline-secondary" onClick={() => setIsOpen(!isOpen)}>
        Files ({files.length})
      </Button>
      <Collapse in={isOpen}>
        <div className="mt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUpload(true)}
          >
            Upload File
          </Button>
          <ListGroup className="mt-2">
            {files.map((file) => (
              <ListGroup.Item
                key={file.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                  <small className="text-muted ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </small>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                >
                  Remove
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      </Collapse>
      <Modal show={showUpload} onHide={() => setShowUpload(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FileUploadComponent
            noteId={noteId}
            onSuccess={handleUploadSuccess}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default FilesSection;
