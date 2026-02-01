import React, { useRef, useEffect, useState, useCallback } from "react";
import { Modal, Button } from "react-bootstrap";
import { isRTL } from "../../utils/stringUtils";
import styles from "./NoteCard.module.css";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import NoteTextRenderer from "./markdown/MarkdownRenderers";
import RevisionHistoryModal from "./RevisionHistoryModal";
import EditNoteButtons from "./EditNoteButtons";

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

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        await handleImageUpload(blob);
        break;
      }
    }
  }, []);

  const handleImageUpload = async (file) => {
    const formData = new FormData();

    // Generate a unique name for the image
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .split(".")[0];
    const uniqueFileName = `pasted_image_${timestamp}`;

    // Create a new File object with the unique name
    const renamedFile = new File([file], `${uniqueFileName}.png`, {
      type: file.type,
    });

    formData.append("file", renamedFile);

    try {
      const response = await fetchWithAuth("/api/note/upload/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      const imageMarkdown = `![${data.file_name}](${data.url})`;
      setEditText(
        (prevText) => prevText + (prevText ? "\n" : "") + imageMarkdown,
      );
    } catch (err) {
      console.error("Error uploading image:", err);
      handleApiError(err);
    }
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

  const handleQuoteToggle = () => {
    if (!editMessageTextAreaRef.current) return;
    const textarea = editMessageTextAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editText;
    const lines = text.split("\n");
    const startLine = text.substring(0, start).split("\n").length - 1;
    const endLine = text.substring(0, end).split("\n").length - 1;
    const selectedLines = lines.slice(startLine, endLine + 1);
    const isQuoted = selectedLines.every((line) => line.startsWith("> "));
    const newLines = selectedLines.map((line) =>
      isQuoted ? line.substring(2) : "> " + line,
    );
    lines.splice(startLine, selectedLines.length, ...newLines);
    const newText = lines.join("\n");
    setEditText(newText);
    textarea.focus();
    const newStart =
      startLine === endLine ? start + (isQuoted ? -2 : 2) : start;
    const newEnd = end + (isQuoted ? -2 : 2) * selectedLines.length;
    textarea.setSelectionRange(newStart, newEnd);
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} fullscreen="xxl-down" size="lg">
        <Modal.Header closeButton className="p-1">
          <Modal.Title className="fs-6">Edit Note</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <EditNoteButtons
            note={note}
            singleView={singleView}
            refreshNotes={refreshNotes}
            hasUnsavedChanges={hasUnsavedChanges}
            editText={editText}
            setEditText={setEditText}
            handleFileUpload={handleFileUpload}
            toggleEditorRtl={toggleEditorRtl}
            isPreviewMode={isPreviewMode}
            setIsPreviewMode={setIsPreviewMode}
            handleSave={handleSave}
            increaseImportance={increaseImportance}
            decreaseImportance={decreaseImportance}
            hideMessage={hideMessage}
            unHideMessage={unHideMessage}
            setShowRevisionModal={setShowRevisionModal}
            handleQuoteToggle={handleQuoteToggle}
          />

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
                onPaste={handlePaste}
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
