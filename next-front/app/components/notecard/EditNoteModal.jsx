import React, { useRef, useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { isRTL } from "../../utils/stringUtils";
import FileUploadComponent from "../FileUploadComponent";
import SaveButton from "../buttons/edit_buttons/SaveButton";
import RtlToggleButton from "../buttons/edit_buttons/RtlToggleButton";
import PreviewToggleButton from "../buttons/edit_buttons/PreviewToggleButton";
import IncreaseImportanceButton from "../buttons/edit_buttons/IncreaseImportanceButton";
import DecreaseImportanceButton from "../buttons/edit_buttons/DecreaseImportanceButton";
import RevisionHistoryButton from "../buttons/edit_buttons/RevisionHistoryButton";
import styles from "./NoteCard.module.css";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import NoteTextRenderer from "./markdown/MarkdownRenderers";
import RevisionHistoryModal from "./RevisionHistoryModal";

const EditNoteModal = ({
  show,
  onHide,
  note,
  editText,
  setEditText,
  onSave,
  onSaveAndClose,
  singleView,
  showToast,
  refreshNotes,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [lastSavedText, setLastSavedText] = useState(editText);
  const editMessageTextAreaRef = useRef(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Reset lastSavedText when modal is opened with new content
  useEffect(() => {
    if (show) {
      setLastSavedText(editText);
      // Set initial text direction
      if (editMessageTextAreaRef.current) {
        editMessageTextAreaRef.current.dir = isRTL(note.text) ? "rtl" : "ltr";
      }
    }
  }, [show]);

  const handleSave = async () => {
    await onSave();
    setLastSavedText(editText);
  };

  const handleSaveAndClose = async () => {
    await onSaveAndClose();
    setLastSavedText(editText);
  };

  const handleChange = (e) => {
    setEditText(e.target.value);
  };

  const handleEnter = (e) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;

    if (isCmdOrCtrl && e.key === "Enter") {
      handleSaveAndClose();
    } else if (e.shiftKey && e.key === "Enter") {
      handleSave();
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onHide();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onHide();
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };

  const hasUnsavedChanges = editText !== lastSavedText;

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      if (editMessageTextAreaRef.current) {
        const newHeight = viewport.height * 0.6;
        editMessageTextAreaRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        setIsPreviewMode((prev) => !prev);
      }
    };

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);
    document.addEventListener("keydown", handleKeyPress);
    handleResize();

    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const toggleEditorRtl = () => {
    if (editMessageTextAreaRef.current) {
      editMessageTextAreaRef.current.dir =
        editMessageTextAreaRef.current.dir === "rtl" ? "ltr" : "rtl";
    }
  };

  const handleFileUpload = (data) => {
    // Decode the URL first to handle any existing encoding
    const decodedUrl = decodeURIComponent(data.url);

    // Use the file_name from backend, which is without suffix
    const fileName = data.file_name;

    // Encode the URL to ensure special characters are properly handled
    const encodedUrl = encodeURI(decodedUrl);

    // Create markdown link with encoded URL and filename without suffix
    const markdownLink = `[${fileName}](${encodedUrl})`;

    setEditText((prevText) => prevText + (prevText ? "\n" : "") + markdownLink);
  };

  const increaseImportance = async () => {
    try {
      const response = await fetchWithAuth(
        `/api/note/message/increase_importance/${note.id}/`,
      );
      if (!response.ok) {
        throw new Error("Failed to increase importance");
      }
      showToast("Success", "Importance increased", 3000, "success");
      window.dispatchEvent(new Event("updateNoteLists"));
      window.dispatchEvent(new Event("refreshImportantNotes"));
      onHide();
      refreshNotes();
    } catch (err) {
      console.error("Error increasing importance:", err);
      handleApiError(err);
    }
  };

  const decreaseImportance = async () => {
    try {
      const response = await fetchWithAuth(
        `/api/note/message/decrease_importance/${note.id}/`,
      );
      if (!response.ok) {
        throw new Error("Failed to decrease importance");
      }
      showToast("Success", "Importance decreased", 3000, "success");
      window.dispatchEvent(new Event("refreshImportantNotes"));
      refreshNotes();
      onHide();
    } catch (err) {
      console.error("Error decreasing importance:", err);
      handleApiError(err);
    }
  };

  const hideMessage = async () => {
    try {
      const response = await fetchWithAuth(
        `/api/note/message/archive/${note.id}/`,
      );
      if (!response.ok) {
        throw new Error("Failed to archive message");
      }
      showToast("Success", "Message archived", 3000, "success");
      refreshNotes();
      onHide();
    } catch (err) {
      console.error("Error archiving message:", err);
      handleApiError(err);
    }
  };

  const unHideMessage = async () => {
    try {
      const response = await fetchWithAuth(
        `/api/note/message/unarchive/${note.id}/`,
      );
      if (!response.ok) {
        throw new Error("Failed to unarchive message");
      }
      showToast("Success", "Message unarchived", 3000, "success");
      onHide();
      refreshNotes();
    } catch (err) {
      console.error("Error unarchiving message:", err);
      handleApiError(err);
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} fullscreen="xxl-down" size="lg">
        <Modal.Header closeButton className="p-1">
          <Modal.Title className="fs-6">Edit Note</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Desktop button layout */}
          <div className="mb-3 mt-0 px-2 d-none d-lg-flex justify-content-between">
            <div>
              {!singleView && (
                <>
                  {note.importance < 4 && (
                    <IncreaseImportanceButton
                      onClick={increaseImportance}
                      className="mr-2 btn-sm"
                    />
                  )}
                  {note.importance > 0 && (
                    <DecreaseImportanceButton
                      onClick={decreaseImportance}
                      className="mr-2 btn-sm"
                    />
                  )}
                </>
              )}
              {refreshNotes && (
                <>
                  {!note.archived ? (
                    <Button
                      variant="outline-secondary"
                      onClick={hideMessage}
                      className="me-2 btn-sm"
                    >
                      Hide
                    </Button>
                  ) : (
                    <Button
                      variant="outline-secondary"
                      onClick={unHideMessage}
                      className="me-2 btn-sm"
                    >
                      Unhide
                    </Button>
                  )}
                </>
              )}

              <RevisionHistoryButton
                onClick={() => setShowRevisionModal(true)}
                className="btn-sm"
              />
            </div>
            <div>
              <SaveButton
                hasUnsavedChanges={hasUnsavedChanges}
                onClick={handleSave}
                className="me-2 btn-sm"
              />

              <FileUploadComponent
                onSuccess={handleFileUpload}
                initialText={editText}
                onTextChange={setEditText}
                size="sm"
                className="btn-sm"
                width="20px"
                height="20px"
              />

              <RtlToggleButton
                onClick={toggleEditorRtl}
                isRTL={isRTL}
                className="mx-2 btn-sm"
                width="20px"
                height="20px"
              />

              <PreviewToggleButton
                className="btn-sm"
                isPreviewMode={isPreviewMode}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                width="20px"
                height="20px"
              />
            </div>
          </div>

          {/* Mobile button layout */}
          <div className="mb-3 mt-0 px-2 d-lg-none">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? "▼" : "▶"} Actions
              </Button>
              <div className="d-flex gap-2">
                <SaveButton
                  hasUnsavedChanges={hasUnsavedChanges}
                  onClick={handleSave}
                  className="btn-sm"
                />
                <PreviewToggleButton
                  className="btn-sm"
                  isPreviewMode={isPreviewMode}
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                />
              </div>
            </div>

            {showMobileMenu && (
              <div className="d-flex justify-content-between gap-2 mb-2 p-2 border rounded">
                <div className="d-flex flex-wrap gap-2">
                  {!singleView && (
                    <>
                      {note.importance < 4 && (
                        <IncreaseImportanceButton
                          onClick={increaseImportance}
                          className="btn-sm"
                          width={16}
                          height={16}
                        />
                      )}
                      {note.importance > 0 && (
                        <DecreaseImportanceButton
                          onClick={decreaseImportance}
                          className="btn-sm"
                          width={16}
                          height={16}
                        />
                      )}
                    </>
                  )}
                  {refreshNotes && (
                    <>
                      {!note.archived ? (
                        <Button
                          variant="outline-secondary"
                          onClick={hideMessage}
                          className="btn-sm"
                        >
                          Hide
                        </Button>
                      ) : (
                        <Button
                          variant="outline-secondary"
                          onClick={unHideMessage}
                          className="btn-sm"
                        >
                          Unhide
                        </Button>
                      )}
                    </>
                  )}
                  <RevisionHistoryButton
                    onClick={() => setShowRevisionModal(true)}
                    className="btn-sm"
                    width={16}
                    height={16}
                  />
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <FileUploadComponent
                    onSuccess={handleFileUpload}
                    initialText={editText}
                    onTextChange={setEditText}
                    size="sm"
                    className="btn-sm"
                    width={16}
                    height={16}
                  />
                  <RtlToggleButton
                    onClick={toggleEditorRtl}
                    isRTL={isRTL}
                    className="btn-sm"
                    width={16}
                    height={16}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="position-relative">
            {isPreviewMode ? (
              <div className={`${styles.previewArea} p-3 border rounded`}>
                <NoteTextRenderer
                  note={{ text: editText }}
                  singleView={true}
                  shouldLoadLinks={false}
                  showToast={showToast}
                />
              </div>
            ) : (
              <textarea
                ref={editMessageTextAreaRef}
                value={editText}
                onChange={handleChange}
                onKeyDown={handleEnter}
                className={`${styles.monospace} ${styles.editTextArea} w-100`}
              />
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAndClose}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showConfirmDialog}
        onHide={handleCancelClose}
        size="sm"
        centered
      >
        <Modal.Header>
          <Modal.Title>Unsaved Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to close? Your unsaved changes will be lost.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmClose}>
            Close Without Saving
          </Button>
        </Modal.Footer>
      </Modal>

      <RevisionHistoryModal
        show={showRevisionModal}
        onHide={() => setShowRevisionModal(false)}
        noteId={note.id}
      />
    </>
  );
};

export default EditNoteModal;
