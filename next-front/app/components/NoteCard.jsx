import React, {
    useState,
    useRef,
    useContext,
    forwardRef,
    useImperativeHandle,
} from "react";
import { Dropdown, Modal, Button } from "react-bootstrap";

import { NoteListContext, ToastContext } from "../(notes)/layout";
import ReactMarkdown from "react-markdown";
import { isRTL } from "../utils/stringUtils";
import { copyElementTextToClipboard } from "../utils/clipboardUtils";

import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";
import NoteCardBottomBar from "./NoteCardBottomBar";


const NoteCard = forwardRef(
    (
        {
            note,
            singleView,
            hideEdits,
            onEditNote
        },
        ref
    ) => {
        const showToast = useContext(ToastContext);
        const [showMoveModal, setShowMoveModal] = useState(false);
        const [showDeleteModal, setShowDeleteModal] = useState(false);
        const [showEditModal, setShowEditModal] = useState(false);
        const [textInsideDeleteModal, setTextInsideDeleteModal] = useState("");
        const editMessageTextAreaRef = useRef(null);
        const rtlIcon = useRef(null);
        const ltrIcon = useRef(null);
        const noteLists = useContext(NoteListContext);

        useImperativeHandle(ref, () => ({
            hideEditModal: () => setShowEditModal(false),
        }));

        const expandNote = () => {
            //use setState here to trigger a re-render
            // trigger a re-render
            
            note.expand = true;
        };

        const moveNote = async (lstId) => {
            try {
                const response = await fetchWithAuth(
                    `/api/note/message/move/${note.id}/`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ list_id: lstId }),
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to move note");
                }

                note.list = lstId;
                setShowMoveModal(false);
                
            } catch (err) {
                console.error("Error moving note:", err);
                handleApiError(err);
            }
        };

        const editNote = () => {
            const newText = editMessageTextAreaRef.current.value;
            onEditNote(note.id, newText);

            setShowEditModal(false);
        };

        const processNoteText = (note) => {
            return singleView || note.text.length < 1000 || note.expand === true
                ? note.text
                : note.text.substring(0, 1000);
        };

        const pinMessage = async () => {
            try {
              const response = await fetchWithAuth(`/api/note/message/pin/${note.id}/`);
              if (!response.ok) {
                throw new Error('Failed to pin message');
              }
              // You might want to update some state or trigger a re-fetch here
              showToast('Success', 'Message pinned', 3000, 'success');
              window.dispatchEvent(new Event("updateNoteLists"));
            } catch (err) {
              console.error('Error pinning message:', err);
            }
          };
        
          const unPinMessage = async () => {
            try {
              const response = await fetchWithAuth(`/api/note/message/unpin/${note.id}/`);
              if (!response.ok) {
                throw new Error('Failed to unpin message');
              }
              showToast('Success', 'Message unpinned', 3000, 'success');
              // You might want to update some state or trigger a re-fetch here
            } catch (err) {
              console.error('Error unpinning message:', err);
            }
          };
        
          const archiveMessage = async () => {
            try {
              const response = await fetchWithAuth(`/api/note/message/archive/${note.id}/`);
              if (!response.ok) {
                throw new Error('Failed to archive message');
              }
              showToast('Success', 'Message archived', 3000, 'success');
              // You might want to update some state or trigger a re-fetch here
            } catch (err) {
              console.error('Error archiving message:', err);
            }
          };
        
          const unArchiveMessage = async () => {
            try {
              const response = await fetchWithAuth(`/api/note/message/unarchive/${note.id}/`);
              if (!response.ok) {
                throw new Error('Failed to unarchive message');
              }
              showToast('Success', 'Message unarchived', 3000, 'success');
              
              // You might want to update some state or trigger a re-fetch here
            } catch (err) {
              console.error('Error unarchiving message:', err);
            }
          };

        const showEditModalHandler = () => {
            setShowEditModal(true);
            setTimeout(() => {
                if (editMessageTextAreaRef.current) {
                    // Implement updateTextAreaHeight if needed
                    editMessageTextAreaRef.current.focus();
                    editMessageTextAreaRef.current.dir = isRTL(note.text)
                        ? "rtl"
                        : "ltr";
                }
            }, 100);
        };

        const toggleEditorRtl = () => {
            if (editMessageTextAreaRef.current) {
                editMessageTextAreaRef.current.dir =
                    editMessageTextAreaRef.current.dir === "rtl"
                        ? "ltr"
                        : "rtl";
            }
        };

        const showDeleteModalHandler = () => {
            const textInModal =
                note.text.length > 30
                    ? note.text.substring(0, 30) + " ..."
                    : note.text;
            setTextInsideDeleteModal(textInModal);
            setShowDeleteModal(true);
        };
   
        const handleEnter = (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                editNote();
            }
        };

        return (
            <div className="card rounded bg-secondary mb-2">
                <div className="card-body pb-1">
                    <div className="row">
                        <div className="col-sm-1">
                            <Dropdown>
                                <Dropdown.Toggle
                                    variant="dark"
                                    id="dropdown-basic"
                                >
                 
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {!hideEdits && (
                                        <Dropdown.Item
                                            onClick={() =>
                                                setShowMoveModal(true)
                                            }
                                        >
                                            Move
                                        </Dropdown.Item>
                                    )}
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                        onClick={() =>
                                            copyElementTextToClipboard(
                                                `text-${note.id}`
                                            )
                                        }
                                    >
                                        Copy
                                    </Dropdown.Item>
                                    {!hideEdits && (
                                        <Dropdown.Item
                                            onClick={showEditModalHandler}
                                        >
                                            Edit
                                        </Dropdown.Item>
                                    )}
                                    {!singleView && !hideEdits && (
                                        <>
                                            {!note.pinned ? (
                                                <Dropdown.Item
                                                    onClick={pinMessage}
                                                >
                                                    Pin
                                                </Dropdown.Item>
                                            ) : (
                                                <Dropdown.Item
                                                    onClick={unPinMessage}
                                                >
                                                    Unpin
                                                </Dropdown.Item>
                                            )}
                                            {!note.archived ? (
                                                <Dropdown.Item
                                                    onClick={archiveMessage}
                                                >
                                                    Archive
                                                </Dropdown.Item>
                                            ) : (
                                                <Dropdown.Item
                                                    onClick={unArchiveMessage}
                                                >
                                                    UnArchive
                                                </Dropdown.Item>
                                            )}
                                        </>
                                    )}
                                    {!singleView && !hideEdits && (
                                        <Dropdown.Item
                                            onClick={showDeleteModalHandler}
                                        >
                                            Delete
                                        </Dropdown.Item>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>

                        <div className="col-sm-11 pl-md-1">
                            <h6 className="card-subtitle mb-2 text-info">
                                {note.sender_name}
                            </h6>
                            {note.image && (
                                <img
                                    src={note.image}
                                    style={{ maxHeight: "200px" }}
                                    alt="..."
                                    className="img-thumbnail"
                                />
                            )}
                            {note.file && (
                                <a href={note.file}>
                                    <div className="bg-info float-left p-1 rounded text-dark">
                                        <span>
                                            {note.file.split("/").pop()}
                                        </span>
                                    </div>
                                </a>
                            )}
                            <span
                                ref={editMessageTextAreaRef}
                                className={`card-text text-light ${
                                    isRTL(note.text) ? "text-right" : ""
                                }`}
                                dir={isRTL(note.text) ? "rtl" : "ltr"}
                            >
                                <ReactMarkdown>
                                    {processNoteText(note)}
                                </ReactMarkdown>
                                {!singleView &&
                                    note.text.length > 1000 &&
                                    note.expand !== true && (
                                        <span
                                            onClick={() => expandNote(note)}
                                            className="h4 mx-2 px-1 rounded py-0 bg-dark flex-sn-wrap"
                                        >
                                            <b>...{note.expand}</b>
                                        </span>
                                    )}
                            </span>
                        </div>
                    </div>

                    <NoteCardBottomBar
                    note={note}
                    >
                      
                    </NoteCardBottomBar>

            </div>

                {/* Modals */}
                <Modal
                    show={showMoveModal}
                    onHide={() => setShowMoveModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Moving note</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {noteLists.map(
                            (lst) =>
                                lst.id !== note.list && (
                                    <Button
                                        key={lst.id}
                                        variant="info"
                                        className="m-1"
                                        onClick={() => moveNote(lst.id)}
                                    >
                                        {lst.name}
                                    </Button>
                                )
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowMoveModal(false)}
                        >
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Modal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                >
                    {/* ... (Modal content remains the same, but update the delete logic) ... */}
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                onDeleteNote(note.id);
                                setShowDeleteModal(false);
                            }}
                        >
                            Delete
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Modal
                    show={showEditModal}
                    onHide={() => setShowEditModal(false)}
                    size="xl"
                >
                    <Modal.Body>
                        <div className="mb-5 mt-0 px-2">
                            <Button
                                variant="outline-dark"
                                size="sm"
                                className="float-right"
                                onClick={toggleEditorRtl}
                            >
                                {
                                    <span>
                                        <svg
                                            ref={rtlIcon}
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 0 24 24"
                                            width="24px"
                                            fill="#000000"
                                        >
                                            <path
                                                d="M0 0h24v24H0z"
                                                fill="none"
                                            />
                                            <path d="M10 10v5h2V4h2v11h2V4h2V2h-8C7.79 2 6 3.79 6 6s1.79 4 4 4zm-2 7v-3l-4 4 4 4v-3h12v-2H8z" />
                                        </svg>
                                        <svg
                                            ref={ltrIcon}
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            style={{ display: "none" }}
                                            viewBox="0 0 24 24"
                                            width="24px"
                                            fill="#000000"
                                        >
                                            <path
                                                d="M0 0h24v24H0z"
                                                fill="none"
                                            />
                                            <path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z" />
                                        </svg>
                                    </span>
                                }
                            </Button>
                        </div>
                        <textarea
                            ref={editMessageTextAreaRef}
                            defaultValue={note.text}
                            onKeyDown={handleEnter}
                            // Implement updateTextAreaHeight if needed
                            // onInput={(e) => updateTextAreaHeight(e.target)}
                            className="w-100"
                            style={{
                                whiteSpace: "pre-line",
                                maxHeight: "60vh",
                            }}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowEditModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={editNote}>
                            Save
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
);

NoteCard.displayName = "NoteCard";

export default NoteCard;
