import React, { useRef, useEffect, useState } from "react";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { isRTL } from "../../utils/stringUtils";
import FileUploadComponent from "../FileUploadComponent";
import styles from "./NoteCard.module.css";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import NoteTextRenderer from "./markdown/NoteTextRenderer";

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
        <Modal show={show} onHide={handleClose} size="xl">
            <Modal.Body>
                <div className="mb-3 mt-0 px-2 d-flex justify-content-between">
                    <div>
                    {!singleView && (
                            <>
                                {!note.pinned ? (
                                    <Button
                                        variant="outline-primary"
                                        className="mr-2"
                                        onClick={pinMessage}
                                    >
                                        Pin
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline-primary"
                                        className="mr-2"
                                        onClick={unPinMessage}
                                    >
                                        Unpin
                                    </Button>
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
                                    >
                                        Hide
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={unHideMessage}
                                    >
                                        Unhide
                                    </Button>
                                )}
                        
                            </>
                        )}
                        
                    </div>
                    <div>
                        <Button
                            className="me-2"
                            variant={hasUnsavedChanges ? "outline-warning" : "outline-success"}
                            size="sm"
                            onClick={handleSave}
                        >
                            {/* Save icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 0 24 24"
                                width="24px"
                                className="save-icon"
                                style={{
                                    fill: hasUnsavedChanges
                                        ? "var(--bs-warning)"
                                        : "var(--bs-success)",
                                }}
                            >
                                <path d="M0 0h24v24H0z" fill="none" />
                                <path d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm0 16H5V5h11.17L19 7.83V19zm-7-1h2v-6h-2v6zm-4-8h10V7H6v3z" />
                            </svg>
                        </Button>

                        <FileUploadComponent
                            onFileUploaded={handleFileUpload}
                            initialText={editText}
                            onTextChange={setEditText}
                            size="sm"
                        />

                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="mx-2"
                            onClick={toggleEditorRtl}
                        >
                            {/* RTL toggle icons */}
                            <span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 0 24 24"
                                    width="24px"
                                    className="rtl-icon"
                                    style={{
                                        display: isRTL ? "none" : "block",
                                        fill: "var(--bs-body-color)",
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
                                        display: isRTL ? "block" : "none",
                                        fill: "var(--bs-body-color)",
                                    }}
                                >
                                    <path d="M0 0h24v24H0z" fill="none" />
                                    <path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z" />
                                </svg>
                            </span>
                        </Button>

                        {/* Preview toggle button */}
                        <OverlayTrigger
                            placement="bottom"
                            overlay={<Tooltip>Toggle Preview (Ctrl+P)</Tooltip>}
                        >
                            <Button
                                variant={isPreviewMode ? "primary" : "outline-secondary"}
                                size="sm"
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 0 24 24"
                                    width="24px"
                                    style={{ fill: "var(--bs-body-color)" }}
                                >
                                    <path d="M0 0h24v24H0z" fill="none" />
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                </svg>
                            </Button>
                        </OverlayTrigger>
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
        </>
    );
};

export default EditNoteModal;