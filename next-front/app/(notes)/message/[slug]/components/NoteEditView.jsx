"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useContext,
} from "react";
import { Button, Modal, Row, Col } from "react-bootstrap";
import { isRTL } from "../../../../utils/stringUtils";
import styles from "../../../../components/notecard/NoteCard.module.css";
import editStyles from "./NoteEditView.module.css";
import { fetchWithAuth } from "../../../../lib/api";
import { handleApiError } from "../../../../utils/errorHandler";
import NoteTextRenderer from "../../../../components/notecard/markdown/MarkdownRenderers";
import RevisionHistoryModal from "../../../../components/notecard/RevisionHistoryModal";
import EditNoteButtons from "../../../../components/notecard/EditNoteButtons";
import { ToastContext, SelectedWorkspaceContext } from "../../../layout";

const NoteEditView = ({ note, editNote, onDone, refreshNotes }) => {
  const showToast = useContext(ToastContext);
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const [editText, setEditText] = useState(note.text);
  const [lastSavedText, setLastSavedText] = useState(note.text);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isSplitView, setIsSplitView] = useState(true);
  const editMessageTextAreaRef = useRef(null);

  useEffect(() => {
    setEditText(note.text);
    setLastSavedText(note.text);
  }, [note.id]);

  useEffect(() => {
    if (editMessageTextAreaRef.current) {
      editMessageTextAreaRef.current.dir = isRTL(note.text) ? "rtl" : "ltr";
      editMessageTextAreaRef.current.focus();
    }
  }, []);

  const hasUnsavedChanges = editText !== lastSavedText;

  const handleSave = async () => {
    const result = await editNote(note.id, editText, note.updated_at);
    if (result) {
      setLastSavedText(editText);
    }
  };

  const handleSaveAndClose = async () => {
    const result = await editNote(note.id, editText, note.updated_at);
    if (result) {
      setLastSavedText(editText);
      onDone();
    }
  };

  const handleDone = () => {
    if (hasUnsavedChanges) {
      setPendingAction("done");
      setShowConfirmDialog(true);
    } else {
      onDone();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
    onDone();
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
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

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        setIsPreviewMode((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const toggleEditorRtl = () => {
    if (editMessageTextAreaRef.current) {
      editMessageTextAreaRef.current.dir =
        editMessageTextAreaRef.current.dir === "rtl" ? "ltr" : "rtl";
    }
  };

  const handleFileUpload = (data) => {
    const decodedUrl = decodeURIComponent(data.url);
    const fileName = data.file_name;
    const encodedUrl = encodeURI(decodedUrl);
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
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .split(".")[0];
    const uniqueFileName = `pasted_image_${timestamp}`;
    const renamedFile = new File([file], `${uniqueFileName}.png`, {
      type: file.type,
    });
    formData.append("file", renamedFile);

    try {
      const response = await fetchWithAuth("/api/note/upload/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload image");
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
      if (!response.ok) throw new Error("Failed to increase importance");
      showToast("Success", "Importance increased", 3000, "success");
      window.dispatchEvent(new Event("updateNoteLists"));
      window.dispatchEvent(new Event("refreshImportantNotes"));
      if (refreshNotes) refreshNotes();
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
      if (!response.ok) throw new Error("Failed to decrease importance");
      showToast("Success", "Importance decreased", 3000, "success");
      window.dispatchEvent(new Event("refreshImportantNotes"));
      if (refreshNotes) refreshNotes();
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
      if (!response.ok) throw new Error("Failed to archive message");
      showToast("Success", "Message archived", 3000, "success");
      if (refreshNotes) refreshNotes();
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
      if (!response.ok) throw new Error("Failed to unarchive message");
      showToast("Success", "Message unarchived", 3000, "success");
      if (refreshNotes) refreshNotes();
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
      <div className={editStyles.editViewContainer}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Edit Note</h5>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-none d-lg-inline-block"
              onClick={() => setIsSplitView((v) => !v)}
              title={isSplitView ? "Single pane" : "Side by side"}
            >
              {isSplitView ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                  <path d="M8 1v14" stroke="currentColor" strokeWidth="1" />
                </svg>
              )}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={handleDone}>
              ← Back
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAndClose}>
              Save & Close
            </Button>
          </div>
        </div>

        <EditNoteButtons
          note={note}
          singleView={true}
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

        {/* Desktop layout */}
        <Row className="d-none d-lg-flex flex-grow-1">
          {isSplitView ? (
            <>
              <Col lg={6} className="d-flex flex-column">
                <textarea
                  ref={editMessageTextAreaRef}
                  value={editText}
                  onChange={handleChange}
                  onKeyDown={handleEnter}
                  onPaste={handlePaste}
                  className={`${styles.monospace} ${editStyles.editTextAreaFullpage} w-100 flex-grow-1`}
                />
              </Col>
              <Col
                lg={6}
                className={`${editStyles.previewPane} d-flex flex-column`}
              >
                <div className={`${editStyles.previewContent} flex-grow-1`}>
                  <NoteTextRenderer
                    note={{ ...note, text: editText }}
                    singleView={true}
                    shouldLoadLinks={false}
                    showToast={showToast}
                    workspaceSlug={selectedWorkspace?.slug}
                  />
                </div>
              </Col>
            </>
          ) : (
            <Col lg={12} className="d-flex flex-column">
              {isPreviewMode ? (
                <div className={`${editStyles.previewContent} flex-grow-1`}>
                  <NoteTextRenderer
                    note={{ ...note, text: editText }}
                    singleView={true}
                    shouldLoadLinks={false}
                    showToast={showToast}
                    workspaceSlug={selectedWorkspace?.slug}
                  />
                </div>
              ) : (
                <textarea
                  ref={editMessageTextAreaRef}
                  value={editText}
                  onChange={handleChange}
                  onKeyDown={handleEnter}
                  onPaste={handlePaste}
                  className={`${styles.monospace} ${editStyles.editTextAreaFullpage} w-100 flex-grow-1`}
                />
              )}
            </Col>
          )}
        </Row>

        {/* Mobile: toggle between editor and preview */}
        <div className="d-lg-none flex-grow-1 d-flex flex-column">
          {isPreviewMode ? (
            <div className={`${editStyles.previewContent} flex-grow-1`}>
              <NoteTextRenderer
                note={{ ...note, text: editText }}
                singleView={true}
                shouldLoadLinks={false}
                showToast={showToast}
                workspaceSlug={selectedWorkspace?.slug}
              />
            </div>
          ) : (
            <textarea
              ref={editMessageTextAreaRef}
              value={editText}
              onChange={handleChange}
              onKeyDown={handleEnter}
              onPaste={handlePaste}
              className={`${styles.monospace} ${editStyles.editTextAreaFullpage} w-100 flex-grow-1`}
            />
          )}
        </div>
      </div>

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

export default NoteEditView;
