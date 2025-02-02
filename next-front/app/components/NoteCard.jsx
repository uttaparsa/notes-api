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
import remarkGfm from "remark-gfm";
import styles from "./NoteCard.module.css";
import Link from 'next/link';
import YouTubeLink from './YouTubeLink';
import RevisionHistoryModal from './RevisionHistoryModal';
import EditNoteModal from './EditNoteModal';


const ResponsiveImage = ({ src, alt, title }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <span 
        ref={containerRef} 
        className={`${styles.markdownImage} ${isFullscreen ? styles.fullscreenContainer : ''}`}
        onClick={toggleFullscreen}
      >
        <img
          src={src}
          alt={alt || ''}
          title={title || ''}
          className={`${styles.responsiveImage} ${isFullscreen ? styles.fullscreenImage : ''}`}
        />
      </span>

      {isFullscreen && (
        <div 
          className={styles.overlay}
          onClick={toggleFullscreen}
        />
      )}
    </>
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
  const noteLists = useContext(NoteListContext);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadLinks, setShouldLoadLinks] = useState(true);
  const [showRevisionModal, setShowRevisionModal] = useState(false);


  useImperativeHandle(ref, () => ({
    hideEditModal: () => setShowEditModal(false),
  }));

  
  useEffect(() => {
    const viewport = window.visualViewport;
    
    if (!viewport) return; // For browsers that don't support visualViewport
    
    const handleResize = () => {
      if (editMessageTextAreaRef.current) {
        // Calculate new height based on viewport
        const newHeight = viewport.height * 0.6; // 70% of visible area
        editMessageTextAreaRef.current.style.height = `${newHeight}px`;
      }
    };
  
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
  
    // Initial resize
    handleResize();
  
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);



  const updateTextAreaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = "50px";
      // max height 70vh
      const max_height = 0.75 * window.innerHeight;
      const new_height = Math.min(50 + textarea.scrollHeight, max_height);
      textarea.style.height = new_height + "px";
    }
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
  const handleSave = async () => {
    try {
      const result = await onEditNote(note.id, editText);
      if (result) {
        setShouldLoadLinks(true);
      }
    } catch (error) {
      console.error('Failed to edit note:', error);
    }
  };

  const handleSaveAndClose = async () => {
    try {
      const result = await onEditNote(note.id, editText);
      if (result) {
        setShowEditModal(false);
        setShouldLoadLinks(true);
      }
    } catch (error) {
      console.error('Failed to edit note:', error);
    }
  };


  const saveNote = async () => {
    try {
      const result = await onEditNote(note.id, editText);
      // If onEditNote completes successfully (doesn't throw an error),
      // then we can close the modal and re-enable link loading
      console.log("result is", result);
      
      if (result) {
        setShouldLoadLinks(true);
      }
      
    } catch (error) {
      // If an error is thrown, we don't close the modal or re-enable link loading
      console.error('Failed to edit note:', error);
      // Optionally, you can show an error message to the user here
    }
  };


  const saveAndCloseEditModal = async () => {
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


  const showEditModalHandler = () => {
    setEditText(note.text);
    setShowEditModal(true);
    setShouldLoadLinks(false);  // Disable link loading when editing
    setTimeout(() => {
      if (editMessageTextAreaRef.current) {
        updateTextAreaHeight(editMessageTextAreaRef.current);
        // editMessageTextAreaRef.current.focus();
        editMessageTextAreaRef.current.dir = isRTL(note.text) ? "rtl" : "ltr";
      }
    }, 100);
  };



  const showDeleteModalHandler = () => {
    const textInModal = note.text.length > 30 ? note.text.substring(0, 30) + " ..." : note.text;
    setTextInsideDeleteModal(textInModal);
    setShowDeleteModal(true);
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
    {!hideEdits && (
      <Dropdown.Item onClick={() => setShowRevisionModal(true)}>
        <span className="d-flex align-items-center">
          Revision History
        </span>
      </Dropdown.Item>
    )}
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

      <EditNoteModal
    show={showEditModal}
    onHide={() => setShowEditModal(false)}
    note={note}
    editText={editText}
    setEditText={setEditText}
    onSave={handleSave}
    onSaveAndClose={handleSaveAndClose}
    singleView={singleView}
    showToast={showToast}
    refreshNotes={refreshNotes}
  />

      <RevisionHistoryModal 
  show={showRevisionModal}
  onHide={() => setShowRevisionModal(false)}
  noteId={note.id}
/>

    </div>
  );
});

NoteCard.displayName = "NoteCard";

export default NoteCard;