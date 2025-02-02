import React, { useRef, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { isRTL } from "../utils/stringUtils";
import FileUploadComponent from "./FileUploadComponent";
import styles from "./NoteCard.module.css";
import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";

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
  refreshNotes
}) => {
  const editMessageTextAreaRef = useRef(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    
    if (!viewport) return;
    
    const handleResize = () => {
      if (editMessageTextAreaRef.current) {
        const newHeight = viewport.height * 0.6;
        editMessageTextAreaRef.current.style.height = `${newHeight}px`;
      }
    };
  
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
  
    handleResize();
  
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  const updateTextAreaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = "50px";
      const max_height = 0.75 * window.innerHeight;
      const new_height = Math.min(50 + textarea.scrollHeight, max_height);
      textarea.style.height = new_height + "px";
    }
  };

  const handleChange = (e) => {
    setEditText(e.target.value);
  };

  const toggleEditorRtl = () => {
    if (editMessageTextAreaRef.current) {
      editMessageTextAreaRef.current.dir =
        editMessageTextAreaRef.current.dir === "rtl" ? "ltr" : "rtl";
    }
  };

  const handleEnter = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      onSaveAndClose();
    } else if (e.shiftKey && e.key === "Enter") {
      onSave();
    }
  };

  const handleFileUpload = (url) => {
    setEditText(prevText => prevText);
  };

  const pinMessage = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/message/pin/${note.id}/`);
      if (!response.ok) {
        throw new Error("Failed to pin message");
      }
      showToast("Success", "Message pinned", 3000, "success");
      window.dispatchEvent(new Event("updateNoteLists"));
      onHide();
      refreshNotes();
    } catch (err) {
      console.error("Error pinning message:", err);
      handleApiError(err);
    }
  };

  const unPinMessage = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/message/unpin/${note.id}/`);
      if (!response.ok) {
        throw new Error("Failed to unpin message");
      }
      showToast("Success", "Message unpinned", 3000, "success");
      refreshNotes();
      onHide();
    } catch (err) {
      console.error("Error unpinning message:", err);
      handleApiError(err);
    }
  };

  const hideMessage = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/message/archive/${note.id}/`);
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
      const response = await fetchWithAuth(`/api/note/message/unarchive/${note.id}/`);
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
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Body>
        <div className="mb-3 mt-0 px-2 d-flex justify-content-between">
          <div>
            {!singleView && (
              <>
                {!note.pinned ? (
                  <Button variant="outline-primary" className="mr-2" onClick={pinMessage}>
                    Pin
                  </Button>
                ) : (
                  <Button variant="outline-primary" className="mr-2" onClick={unPinMessage}>
                    Unpin
                  </Button>
                )}
              </>
            )}

            {!note.archived ? (
              <Button variant="outline-secondary" onClick={hideMessage}>
                Hide
              </Button>
            ) : (
              <Button variant="outline-secondary" onClick={unHideMessage}>
                Unhide
              </Button>
            )}
          </div>

          <div>
            <Button variant="outline-secondary" size="sm" onClick={onSave}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
                className="save-icon"
                style={{ fill: 'var(--bs-body-color)' }}
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm0 16H5V5h11.17L19 7.83V19zm-7-1h2v-6h-2v6zm-4-8h10V7H6v3z" />
              </svg>
            </Button>

            <FileUploadComponent
              onFileUploaded={handleFileUpload}
              initialText={editText}
              onTextChange={setEditText}
            />

            <Button variant="outline-secondary" size="sm" className="ml-2" onClick={toggleEditorRtl}>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  className="rtl-icon"
                  style={{ 
                    display: isRTL ? 'none' : 'block',
                    fill: 'var(--bs-body-color)'
                  }}
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M10 10v5h2V4h2v11h2V4h2V2h-8C7.79 2 6 3.79 6 6s1.79 4 4 4zm-2 7v-3l-4 4 4 4v-3h12v-2H8z" />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  className="ltr-icon"
                  style={{ 
                    display: isRTL ? 'block' : 'none',
                    fill: 'var(--bs-body-color)'
                  }}
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z" />
                </svg>
              </span>
            </Button>
          </div>
        </div>

        <textarea
          ref={editMessageTextAreaRef}
          value={editText}
          onChange={handleChange}
          onKeyDown={handleEnter}
          className={`${styles.monospace} ${styles.editTextArea} w-100`}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSaveAndClose}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditNoteModal;