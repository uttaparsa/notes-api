'use client'

import React, { useState, useRef, useContext, forwardRef, useImperativeHandle, useEffect } from "react";
import { Dropdown, Modal, Button, Collapse} from "react-bootstrap";
import { NoteListContext, ToastContext } from "../(notes)/layout";
import ReactMarkdown from "react-markdown";
import { isRTL } from "../utils/stringUtils";
import { copyTextToClipboard } from "../utils/clipboardUtils";
import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";
import NoteCardBottomBar from "./NoteCardBottomBar";
import FileUploadComponent from "./FileUploadComponent";
import remarkGfm from "remark-gfm";
import styles from "./NoteCard.module.css";
import Link from 'next/link';
import YouTubeLink from './YouTubeLink';


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

  

const NoteCard = forwardRef(({ note, singleView, hideEdits, onEditNote, onDeleteNote, refreshNotes }, ref) => {
  const showToast = useContext(ToastContext);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [textInsideDeleteModal, setTextInsideDeleteModal] = useState("");
  const [editText, setEditText] = useState(note.text);
  const editMessageTextAreaRef = useRef(null);
  const rtlIcon = useRef(null);
  const ltrIcon = useRef(null);
  const noteLists = useContext(NoteListContext);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadLinks, setShouldLoadLinks] = useState(true);



  useImperativeHandle(ref, () => ({
    hideEditModal: () => setShowEditModal(false),
  }));

  useEffect(() => {
    if (editMessageTextAreaRef.current) {
      updateTextAreaHeight(editMessageTextAreaRef.current);
    }
  }, [editText]);

  const updateTextAreaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = "1px";
      textarea.style.height = 25 + textarea.scrollHeight + "px";
    }
  };

  const handleChange = (e) => {
    setEditText(e.target.value);
    updateTextAreaHeight(e.target);
  };

  const expandNote = () => {
    setIsExpanded(true);
  };

  const moveNote = async (lstId) => {
    window.dispatchEvent(new CustomEvent("showWaitingModal", { detail: "Moving note" }));

    try {
      const response = await fetchWithAuth(`/api/note/message/move/${note.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ list_id: lstId }),
      });

      if (!response.ok) {
        throw new Error("Failed to move note");
      }

      note.list = lstId;
      setShowMoveModal(false);
      showToast("Success", "Note moved", 3000, "success");
    } catch (err) {
      console.error("Error moving note:", err);
      handleApiError(err);
    }
    window.dispatchEvent(new CustomEvent("hideWaitingModal"));
  };


  const copyNoteLink = () => {
    const noteLink = `[related](/message/${note.id})`;
    copyTextToClipboard(noteLink);
    showToast("Success", "Note link copied to clipboard", 3000, "success");
  };

  const editNote = async () => {
    try {
      const result = await onEditNote(note.id, editText);
      // If onEditNote completes successfully (doesn't throw an error),
      // then we can close the modal and re-enable link loading
      console.log("result is", result);
      
      if (result) {
        setShowEditModal();
        setShouldLoadLinks(true);
      }
      
    } catch (error) {
      // If an error is thrown, we don't close the modal or re-enable link loading
      console.error('Failed to edit note:', error);
      // Optionally, you can show an error message to the user here
    }
  };
  

  const processNoteText = (note) => {
    return singleView || note.text.length < 1000 || isExpanded
      ? note.text
      : note.text.substring(0, 1000);
  };
  const pinMessage = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/message/pin/${note.id}/`);
      if (!response.ok) {
        throw new Error("Failed to pin message");
      }
      showToast("Success", "Message pinned", 3000, "success");
      window.dispatchEvent(new Event("updateNoteLists"));
      setShowEditModal(false);
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
      setShowEditModal(false);
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
      setShowEditModal(false);
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
      setShowEditModal(false);
      refreshNotes();
    } catch (err) {
      console.error("Error unarchiving message:", err);
      handleApiError(err);
    }
  };

  const showEditModalHandler = () => {
    setEditText(note.text);
    setShowEditModal(true);
    setShouldLoadLinks(false);  // Disable link loading when editing
    setTimeout(() => {
      if (editMessageTextAreaRef.current) {
        updateTextAreaHeight(editMessageTextAreaRef.current);
        editMessageTextAreaRef.current.focus();
        editMessageTextAreaRef.current.dir = isRTL(note.text) ? "rtl" : "ltr";
      }
    }, 100);
  };


  const toggleEditorRtl = () => {
    if (editMessageTextAreaRef.current) {
      editMessageTextAreaRef.current.dir =
        editMessageTextAreaRef.current.dir === "rtl" ? "ltr" : "rtl";
    }
  };

  const showDeleteModalHandler = () => {
    const textInModal = note.text.length > 30 ? note.text.substring(0, 30) + " ..." : note.text;
    setTextInsideDeleteModal(textInModal);
    setShowDeleteModal(true);
  };

  const handleEnter = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      editNote();
    }
  };

  const handleFileUpload = (url) => {
    setEditText(prevText => prevText);
  };


  const renderCategoryButtons = (categories, isArchived = false) => {
    return categories.map(lst => (
      <Button 
        key={lst.id} 
        variant={isArchived ? "secondary" : "info"} 
        className="m-1" 
        onClick={() => moveNote(lst.id)}
      >
        {lst.name} {isArchived && "(Archived)"}
      </Button>
    ));
  };

  const customRenderers = {
    pre: ({ node, inline,className, children, ...props }) => {

      const codeString = String(children.props.children).replace(/\n$/, '');
      const copyCode = () => {
        copyTextToClipboard(codeString);
        showToast("Success", "Code copied to clipboard", 3000, "success");
      };
      return (
        <div className={styles.codeBlockWrapper}>
          <pre  className={styles.codeBlock + " bg-body border"}>
          {children}

         </pre>
             
         <Button onClick={copyCode} variant="outline-primary" size="sm" className={styles.copyButton}>
              Copy
          </Button>
        </div>

      )
    },
    code: ({ node, ...props }) => {
        const codeString = String(props.children).replace(/\n$/, '');
        const copyCode = (element) => {
          // check if parent element is not pre
          if (element.target.parentElement.tagName !== 'PRE') {
            copyTextToClipboard(codeString);
            showToast("Success", "Code copied to clipboard", 3000, "success");
          }

        };
        return (
            <code onClick={copyCode} className={styles.codeSnippet} >
              {props.children}
            </code>

        );
    
    },
    a: ({ href, children }) => {
      if (href.includes('youtube.com') || href.includes('youtu.be')) {
        return <YouTubeLink url={href} shouldLoadLinks={shouldLoadLinks} />;
      }
      return <Link href={href} rel="noopener noreferrer">{children}</Link>;
    },
    img: (props) => <ResponsiveImage {...props} />
  };

  return (
    <div className="card rounded mb-2 border shadow-sm bg-body-tertiary">
      <div className="card-body pb-1">
        <div className="row">
          <div className="col-sm-1">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic"></Dropdown.Toggle>
              <Dropdown.Menu>
                {!hideEdits && <Dropdown.Item onClick={() => setShowMoveModal(true)}>Move</Dropdown.Item>}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => copyTextToClipboard(note.text)}>Copy</Dropdown.Item>
                <Dropdown.Item onClick={copyNoteLink}>Copy Link</Dropdown.Item>
                {!hideEdits && <Dropdown.Item onClick={showEditModalHandler}>Edit</Dropdown.Item>}
                {!singleView && !hideEdits && (
                  <Dropdown.Item onClick={showDeleteModalHandler}>Delete</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div className="col-sm-11 pl-md-1">
            <h6 className="card-subtitle mb-2 text-primary fw-bold">{note.sender_name}</h6>
            <span
              className={`card-text ${isRTL(note.text) ? "text-end" : ""}`}
              dir={isRTL(note.text) ? "rtl" : "ltr"}
            >
<ReactMarkdown 
  components={customRenderers} 
  remarkPlugins={[remarkGfm]} 
  className={` ${isRTL(note.text) ? styles.rtlMarkdown : ''}`}
>
  {processNoteText(note)}
</ReactMarkdown>
              {!singleView && note.text.length > 1000 && !isExpanded && (
                <span onClick={() => expandNote()} className="h4 mx-2 px-1 rounded py-0 text-secondary border flex-sn-wrap">
                  <b>...</b>
                </span>
              )}
            </span>
          </div>
        </div>
        <NoteCardBottomBar note={note}></NoteCardBottomBar>
      </div>
      
      {/* Modals */}
      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Moving note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            {renderCategoryButtons(noteLists.filter(lst => lst.id !== note.list && !lst.archived))}
          </div>
          
          {noteLists.some(lst => lst.archived) && (
            <>
              <hr className="my-3" />
              <div 
                className="d-flex align-items-center cursor-pointer" 
                onClick={() => setShowArchivedCategories(!showArchivedCategories)}
              >
                <span className="mr-2">
                  {showArchivedCategories ? '▼' : '▶'}
                </span>
                <h6 className="mb-0">Archived Categories</h6>
              </div>
              
              <Collapse in={showArchivedCategories}>
                <div className="mt-2">
                  {renderCategoryButtons(noteLists.filter(lst => lst.id !== note.list && lst.archived), true)}
                </div>
              </Collapse>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMoveModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Deleting note</Modal.Title>
        </Modal.Header>
        <Modal.Body>{textInsideDeleteModal}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
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

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl">
        <Modal.Body>
          <div className="mb-3 mt-0 px-2 d-flex justify-content-between">
          <div>
              {!singleView && (
                <>
                  {!note.pinned ? (
                    <Button variant="outline-primary" className="mr-2" onClick={pinMessage}>Pin</Button>
                  ) : (
                    <Button variant="outline-primary" className="mr-2" onClick={unPinMessage}>Unpin</Button>
                  )}
                  {!note.archived ? (
                    <Button variant="outline-secondary" onClick={hideMessage}>Hide</Button>
                  ) : (
                    <Button variant="outline-secondary" onClick={unHideMessage}>Unhide</Button>
                  )}
                </>
              )}
            </div>
            <div>
              <FileUploadComponent
                onFileUploaded={handleFileUpload}
                initialText={editText}
                onTextChange={setEditText}
              />
              <Button variant="outline-dark" size="sm" className="ml-2" onClick={toggleEditorRtl}>
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
          </div>
          <textarea
            ref={editMessageTextAreaRef}
            value={editText}
            onChange={handleChange}
            onKeyDown={handleEnter}
            className={styles.monospace + " w-100"}
            styles
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={editNote}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

NoteCard.displayName = "NoteCard";

export default NoteCard;