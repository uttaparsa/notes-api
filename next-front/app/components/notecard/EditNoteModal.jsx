import React, { useRef, useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { isRTL } from "../../utils/stringUtils";
import FileUploadComponent from "../FileUploadComponent";
import SaveButton from "../buttons/edit_buttons/SaveButton";
import RtlToggleButton from "../buttons/edit_buttons/RtlToggleButton";
import PreviewToggleButton from "../buttons/edit_buttons/PreviewToggleButton";
import PinButton from "../buttons/edit_buttons/PinButton";
import UnpinButton from "../buttons/edit_buttons/UnpinButton";
import RevisionHistoryButton from "../buttons/edit_buttons/RevisionHistoryButton";
import styles from "./NoteCard.module.css";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import NoteTextRenderer from "./markdown/NoteTextRenderer";
import RevisionHistoryModal from './RevisionHistoryModal';

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
                editMessageTextAreaRef.current.dir = isRTL(note.text)
                    ? "rtl"
                    : "ltr";
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
        if (e.ctrlKey && e.key === "Enter") {
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

    const handleFileUpload = (url) => {
        // Decode the URL first to handle any existing encoding
        const decodedUrl = decodeURIComponent(url);
        
        // Get the filename, handling spaces and special characters
        const fileName = decodeURIComponent(decodedUrl.split("/").pop());
        
        // Encode the URL to ensure special characters are properly handled
        const encodedUrl = encodeURI(decodedUrl);
        
        // Create markdown link with encoded URL and decoded filename
        const markdownLink = `[${fileName}](${encodedUrl})`;
        
        setEditText(
            (prevText) => prevText + (prevText ? "\n" : "") + markdownLink
        );
    };

    const pinMessage = async () => {
        try {
            const response = await fetchWithAuth(
                `/api/note/message/pin/${note.id}/`
            );
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
            const response = await fetchWithAuth(
                `/api/note/message/unpin/${note.id}/`
            );
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
            const response = await fetchWithAuth(
                `/api/note/message/archive/${note.id}/`
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
                `/api/note/message/unarchive/${note.id}/`
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
        <Modal show={show} onHide={handleClose} className="modal-fullscreen w-100 mw-100">
            <Modal.Body>
                <div className="mb-3 mt-0 px-2 d-flex justify-content-between">
                    <div>
                    {!singleView && (
                            <>
                                {note.importance < 4 && (
                                    <PinButton 
                                        onClick={pinMessage}
                                        className="mr-2 btn-sm"
                                    />
                                )}
                                {note.importance > 0 && (
                                    <UnpinButton 
                                        onClick={unPinMessage}
                                        className="mr-2 btn-sm"
                                    />
                                )}
                            </>
                        )}
                        {/* show hide/unhide button only if note refreshNotes is not none */}
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
                            onFileUploaded={handleFileUpload}
                            initialText={editText}
                            onTextChange={setEditText}
                            size="sm"
                            className="btn-sm"
                        />

                        <RtlToggleButton 
                            onClick={toggleEditorRtl}
                            isRTL={isRTL}
                            className="mx-2 btn-sm"
                        />

                        <PreviewToggleButton 
                            className="btn-sm"
                            isPreviewMode={isPreviewMode}
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                        />
                    </div>
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