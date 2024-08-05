import React, {
    useState,
    useRef,
    useContext,
    forwardRef,
    useImperativeHandle,
    useEffect,
} from "react";
import { Dropdown, Modal, Button, Image } from "react-bootstrap";

import { NoteListContext, ToastContext } from "../(notes)/layout";
import ReactMarkdown from "react-markdown";
import { isRTL } from "../utils/stringUtils";
import { copyTextInsideElementToClipboard, copyTextToClipboard } from "../utils/clipboardUtils";

import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";
import NoteCardBottomBar from "./NoteCardBottomBar";

import remarkGfm from "remark-gfm";
import styles from "./NoteCard.module.css";
import FileUploadComponent from './FileUploadComponent'

const ResponsiveImage = ({ src, alt, title }) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
  
    useEffect(() => {
      if (containerRef.current) {
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
          }
        });
  
        resizeObserver.observe(containerRef.current);
  
        return () => {
          resizeObserver.disconnect();
        };
      }
    }, []);
  
    return (
      <span ref={containerRef} className={styles.markdownImage}>
        <img
          src={src}
          alt={alt || ''}
          title={title || ''}
          className={styles.responsiveImage}
        />
      </span>
    );
  };

const NoteCard = forwardRef(
    ({ note, singleView, hideEdits, onEditNote, onDeleteNote }, ref) => {
        const showToast = useContext(ToastContext);
        const [showMoveModal, setShowMoveModal] = useState(false);
        const [showDeleteModal, setShowDeleteModal] = useState(false);
        const [showEditModal, setShowEditModal] = useState(false);
        const [textInsideDeleteModal, setTextInsideDeleteModal] = useState("");
        const editMessageTextAreaRef = useRef(null);
        const rtlIcon = useRef(null);
        const ltrIcon = useRef(null);
        const noteLists = useContext(NoteListContext);
        const [isExpanded, setIsExpanded] = useState(false);

        const updateTextAreaHeight = (textarea) => {
            if (textarea) {
                textarea.style.height = "1px";
                textarea.style.height = 25 + textarea.scrollHeight + "px";
            }
        };

        

        useEffect(() => {
            updateTextAreaHeight(editMessageTextAreaRef.current);
        }, [note.text]); 

        const handleChange = (e) => {
            updateTextAreaHeight(e.target);
        };

        useImperativeHandle(ref, () => ({
            hideEditModal: () => setShowEditModal(false),
        }));

        const expandNote = () => {
            setIsExpanded(true);
            console.log("expandNote");
          };

        const moveNote = async (lstId) => {
            window.dispatchEvent(
                new CustomEvent("showWaitingModal", { detail: "Moving note" })
            );

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
                // show toast
                showToast("Success", "Note moved", 3000, "success");
            } catch (err) {
                console.error("Error moving note:", err);
                handleApiError(err);
            }
            window.dispatchEvent(new CustomEvent("hideWaitingModal"));
        };


        const processNoteText = (note) => {
            return singleView || note.text.length < 1000 || isExpanded === true
                ? note.text
                : note.text.substring(0, 1000);
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
                note.pinned = true;
            } catch (err) {
                console.error("Error pinning message:", err);
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
                note.pinned = false;
            } catch (err) {
                console.error("Error unpinning message:", err);
            }
        };

        const archiveMessage = async () => {
            try {
                const response = await fetchWithAuth(
                    `/api/note/message/archive/${note.id}/`
                );
                if (!response.ok) {
                    throw new Error("Failed to archive message");
                }
                showToast("Success", "Message archived", 3000, "success");
                note.archived = true;
            } catch (err) {
                console.error("Error archiving message:", err);
            }
        };

        const unArchiveMessage = async () => {
            try {
                const response = await fetchWithAuth(
                    `/api/note/message/unarchive/${note.id}/`
                );
                if (!response.ok) {
                    throw new Error("Failed to unarchive message");
                }
                showToast("Success", "Message unarchived", 3000, "success");

                note.archived = false;
            } catch (err) {
                console.error("Error unarchiving message:", err);
            }
        };

        const showEditModalHandler = () => {
            setShowEditModal(true);
            setTimeout(() => {
                if (editMessageTextAreaRef.current) {
                    updateTextAreaHeight(editMessageTextAreaRef.current);
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
        const customRenderers = {
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const lang = match ? match[1] : '';
              
              if (!inline) {
                const codeString = String(children).replace(/\n$/, '');
                
                const copyCode = () => {
                  copyTextToClipboard(codeString);
                  showToast("Success", "Code copied to clipboard", 3000, "success");
                };
      
                return (
                  <div className={styles.codeBlockWrapper}>
                    <pre className={styles.codeBlock}>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                    <Button onClick={copyCode}  variant="outline-primary" size="sm" className={styles.copyButton}>
                      Copy
                    </Button>
                  </div>
                );
              }
              
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            img: (props) => <ResponsiveImage {...props} />
          };
      
          const editNote = () => {
            const newText = editMessageTextAreaRef.current.value;
            onEditNote(note.id, newText);
            setShowEditModal(false);
          };
        
          const handleFileUpload = (url) => {
            const currentText = editMessageTextAreaRef.current.value;
            editMessageTextAreaRef.current.value = currentText + (currentText ? '\n' : '') + url;
            updateTextAreaHeight(editMessageTextAreaRef.current);
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
                                ></Dropdown.Toggle>

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
                                            copyTextToClipboard(
                                                note.text
                                                
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
                            <span
                                className={`card-text text-light ${
                                    isRTL(note.text) ? "text-right" : ""
                                }`}
                                dir={isRTL(note.text) ? "rtl" : "ltr"}
                            >
                                <ReactMarkdown       
                                    components={customRenderers}
                                 remarkPlugins={[remarkGfm]}>
                                    {processNoteText(note)}
                                </ReactMarkdown>
                                {!singleView &&
                                    note.text.length > 1000 &&
                                    isExpanded !== true && (
                                        <span
                                            onClick={() => expandNote()}
                                            className="h4 mx-2 px-1 rounded py-0 bg-dark flex-sn-wrap"
                                        >
                                            <b>...{isExpanded}</b>
                                        </span>
                                    )}
                            </span>
                        </div>
                    </div>

                    <NoteCardBottomBar note={note}></NoteCardBottomBar>
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
                                lst.id !== note.list &&
                            !lst.archived && (
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
                    <Modal.Header closeButton>
                        <Modal.Title>Deleting note</Modal.Title>
                    </Modal.Header>
                <Modal.Body>
                    {textInsideDeleteModal}
                </Modal.Body>
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
          <div className="mb-5 mt-0 px-2 d-flex justify-content-end">
            <FileUploadComponent
              onFileUploaded={handleFileUpload}
              initialText={editMessageTextAreaRef.current?.value || ''}
              onTextChange={(newText) => {
                if (editMessageTextAreaRef.current) {
                  editMessageTextAreaRef.current.value = newText;
                  updateTextAreaHeight(editMessageTextAreaRef.current);
                }
              }}
              variant="outline-dark"
            />
            <Button
              variant="outline-dark"
              size="sm"
              className="ml-2"
              onClick={toggleEditorRtl}
            >
              <span>
                <svg
                  ref={rtlIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  fill="#000000"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
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
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z" />
                </svg>
              </span>
            </Button>
          </div>
          <textarea
            ref={editMessageTextAreaRef}
            defaultValue={note.text}
            onKeyDown={handleEnter}
            onChange={handleChange}
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
