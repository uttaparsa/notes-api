import React, { useRef, useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { isRTL } from "../../utils/stringUtils";
import FileUploadComponent from "../FileUploadComponent";
import SaveButton from "../buttons/SaveButton";
import RtlToggleButton from "../buttons/RtlToggleButton";
import PreviewToggleButton from "../buttons/PreviewToggleButton";
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
                                {note.importance < 4 && (
                                    <Button
                                        variant="outline-primary"
                                        className="mr-2"
                                        onClick={pinMessage}
                                    >
                                        <svg  version="1.1" xmlns="http://www.w3.org/2000/svg" 
                                         
	          height="24px"
          viewBox="0 0 1000 1000"
          width="24px"
              style={{ fill: "var(--bs-primary)" }}
        
	 >
<g>
	<path  d="M120.027,962.802c26.6,0,53.5-8.801,75.7-27l288.1-234.7l290.899,237c22.301,18.1,49.101,27,75.7,27
		c34.8,0,69.4-15.101,93.101-44.2c41.899-51.4,34.1-127-17.2-168.8l-366.7-298.8c-44.1-36-107.5-36-151.6,0l-363.8,296.5
		c-51.4,41.8-59.1,117.399-17.3,168.8C50.727,947.702,85.227,962.802,120.027,962.802z"/>
	<path  d="M120.027,541.902c26.6,0,53.5-8.8,75.7-27l288.1-234.7l290.899,237c22.301,18.101,49.101,27,75.7,27
		c34.8,0,69.4-15.1,93.101-44.2c41.899-51.399,34.1-127-17.2-168.8l-366.7-298.8c-44.1-36-107.5-36-151.6,0l-363.8,296.4
		c-51.4,41.9-59.1,117.5-17.3,168.9C50.727,526.802,85.227,541.902,120.027,541.902z"/>
</g>
</svg>
                                    </Button>
                                )}
                                {note.importance > 0 && (
                                    <Button
                                        variant="outline-primary"
                                        className="mr-2"
                                        onClick={unPinMessage}
                                    >
                                                                                <svg  version="1.1" xmlns="http://www.w3.org/2000/svg" 
                                         
	          height="24px"
          viewBox="0 0 1000 1000"
          width="24px"
              style={{ fill: "var(--bs-primary)" }}
        
	 >
<g>
	<path d="M44.177,220.307l363.9,296.4c22.101,18,48.9,27,75.8,27c26.901,0,53.701-9,75.801-27l366.699-298.7
		c51.4-41.9,59.101-117.4,17.2-168.8c-41.8-51.4-117.399-59.1-168.8-17.3l-290.901,237l-288.1-234.7c-51.4-41.8-127-34.1-168.8,17.3
		C-14.923,102.907-7.123,178.407,44.177,220.307z"/>
	<path d="M44.177,642.207l363.9,296.399c22.101,18,48.9,27,75.8,27c26.901,0,53.701-9,75.801-27l366.699-298.7
		c51.4-41.899,59.101-117.399,17.2-168.8c-41.899-51.399-117.399-59.1-168.8-17.2l-290.901,236.9l-288.1-234.6
		c-51.4-41.9-127-34.101-168.8,17.199C-14.923,524.807-7.123,600.406,44.177,642.207z"/>
</g>
</svg>
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
                        <SaveButton 
                            hasUnsavedChanges={hasUnsavedChanges}
                            onClick={handleSave}
                            className="me-2"
                        />

                        <FileUploadComponent
                            onFileUploaded={handleFileUpload}
                            initialText={editText}
                            onTextChange={setEditText}
                            size="sm"
                        />

                        <RtlToggleButton 
                            onClick={toggleEditorRtl}
                            isRTL={isRTL}
                            className="mx-2"
                        />

                        <PreviewToggleButton 
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
        </>
    );
};

export default EditNoteModal;