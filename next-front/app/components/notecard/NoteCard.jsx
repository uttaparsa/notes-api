'use client'

import React, { useState, useRef, useContext, forwardRef, useImperativeHandle, useEffect } from "react";
import { Dropdown,Button } from "react-bootstrap";
import { NoteListContext, ToastContext } from "../../(notes)/layout";
import ReactMarkdown from "react-markdown";
import { isRTL } from "../../utils/stringUtils";
import { copyTextToClipboard } from "../../utils/clipboardUtils";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import NoteCardBottomBar from "./NoteCardBottomBar";
import styles from "./NoteCard.module.css";
import remarkGfm from "remark-gfm";
import MoveNoteModal from "./MoveNoteModal";
import DeleteNoteModal from "./DeleteNoteModal";
import EditNoteModal from "./EditNoteModal";


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
  const noteLists = useContext(NoteListContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadLinks, setShouldLoadLinks] = useState(true);

  const getMetadata = async (url) => {
    const videoUrl = encodeURIComponent(url);
    const requestUrl = `https://youtube.com/oembed?url=${videoUrl}&format=json`;
    
    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching YouTube metadata:", error);
      return null;
    }
  };
  
  
  const YouTubeLink = ({ url }) => {
    const [metadata, setMetadata] = useState(null);

    useEffect(() => {
      if (shouldLoadLinks) {
        getMetadata(url).then(data => setMetadata(data));
      }
    }, [url, shouldLoadLinks]);

    if (!shouldLoadLinks || !metadata) return <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>;

    return (
      <span className={styles.youtubeLink}>
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.youtubeUrl}>
          {url}
        </a>
        <span className={styles.youtubeTitleWrapper}>
          <span className={styles.youtubeIcon}>▶</span>
          <span className={styles.youtubeTitle} title={metadata.title}>
            {metadata.title}
          </span>
        </span>
      </span>
    );
  };

  useImperativeHandle(ref, () => ({
    hideEditModal: () => setShowEditModal(false),
  }));

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
    const noteLink = `(/message/${note.id})`;
    copyTextToClipboard(noteLink);
    showToast("Success", "Note link copied to clipboard", 3000, "success");
  };

  const editNote = (newText) => {
    onEditNote(note.id, newText);
    setShowEditModal(false);
    setShouldLoadLinks(true);
  };

  const processNoteText = (note) => {
    return singleView || note.text.length < 1000 || isExpanded
      ? note.text
      : note.text.substring(0, 1000);
  };

  const showEditModalHandler = () => {
    setEditText(note.text);
    setShowEditModal(true);
    setShouldLoadLinks(false);
  };

  const showDeleteModalHandler = () => {
    const textInModal = note.text.length > 30 ? note.text.substring(0, 30) + " ..." : note.text;
    setTextInsideDeleteModal(textInModal);
    setShowDeleteModal(true);
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
            <Button onClick={copyCode} variant="outline-primary" size="sm" className={styles.copyButton}>
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
    a: ({ href, children }) => {
      if (href.includes('youtube.com') || href.includes('youtu.be')) {
        return <YouTubeLink url={href} />;
      }
      return <a href={href} rel="noopener noreferrer">{children}</a>;
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
              <ReactMarkdown components={customRenderers} remarkPlugins={[remarkGfm]}>
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

      <MoveNoteModal
        show={showMoveModal}
        onHide={() => setShowMoveModal(false)}
        noteLists={noteLists}
        currentNoteList={note.list}
        onMoveNote={moveNote}
      />

      <DeleteNoteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        textInsideDeleteModal={textInsideDeleteModal}
        onDeleteNote={() => {
          onDeleteNote(note.id);
          setShowDeleteModal(false);
        }}
      />

      <EditNoteModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        note={note}
        editText={editText}
        setEditText={setEditText}
        onEditNote={editNote}
        singleView={singleView}
        showToast={showToast}
        refreshNotes={refreshNotes}
      />
    </div>
  );
});

NoteCard.displayName = "NoteCard";

export default NoteCard;