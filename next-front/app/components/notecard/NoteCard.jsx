'use client'

import React, { useState, useRef, useContext, forwardRef, useImperativeHandle } from "react";
import { Dropdown, Modal, Button, Collapse} from "react-bootstrap";
import { NoteListContext, ToastContext } from "../../(notes)/layout";
import { copyTextToClipboard } from "../../utils/clipboardUtils";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import NoteCardBottomBar from "./NoteCardBottomBar";
import EditNoteModal from './EditNoteModal';
import NoteTextRenderer from './markdown/NoteTextRenderer';
import ReminderModal from './ReminderModal';

const NoteCard = forwardRef(({ note, singleView, hideEdits, onEditNote, onDeleteNote, refreshNotes }, ref) => {
  const showToast = useContext(ToastContext);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [textInsideDeleteModal, setTextInsideDeleteModal] = useState("");
  const [editText, setEditText] = useState(note.text);
  const noteLists = useContext(NoteListContext);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadLinks, setShouldLoadLinks] = useState(true);
  const [similarityModeEnabled, setSimilarityModeEnabled] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  useImperativeHandle(ref, () => ({
    hideEditModal: () => setShowEditModal(false),
  }));

  const toggleSimilarityMode = () => {
    setSimilarityModeEnabled(!similarityModeEnabled);
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

  const showEditModalHandler = () => {
    setEditText(note.text);
    setShowEditModal(true);
    setShouldLoadLinks(false);  // Disable link loading when editing
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

  return (
    <div className="card rounded mb-2 border shadow-sm bg-body-tertiary">
      <div className="card-body pb-1">
        <div className="row">
          <div className="col-sm-1">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" ></Dropdown.Toggle>
              <Dropdown.Menu>
                {!hideEdits && <Dropdown.Item onClick={() => setShowMoveModal(true)}>Move</Dropdown.Item>}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => copyTextToClipboard(note.text)}>Copy</Dropdown.Item>
                <Dropdown.Item onClick={copyNoteLink}>Copy Link</Dropdown.Item>
                {!hideEdits && <Dropdown.Item onClick={showEditModalHandler}>Edit</Dropdown.Item>}
                {!hideEdits && <Dropdown.Item onClick={() => setShowReminderModal(true)}>Create Reminder</Dropdown.Item>}
                {singleView && (
                  <Dropdown.Item 
                    onClick={toggleSimilarityMode}
                    className={similarityModeEnabled ? "text-primary" : ""}
                  >
                    <span className="d-flex align-items-center">
                      <i className="bi bi-lightbulb "></i>
                      {similarityModeEnabled ? "Disable" : "Enable"} Similar Thoughts
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
            
            <NoteTextRenderer 
              note={note} 
              singleView={singleView} 
              isExpanded={isExpanded}
              onExpand={expandNote}
              shouldLoadLinks={shouldLoadLinks}
              showToast={showToast}
              similarityModeEnabled={similarityModeEnabled}
            />
          </div>
        </div>
        <NoteCardBottomBar note={note}></NoteCardBottomBar>
      </div>
      
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
      
      <ReminderModal
        show={showReminderModal}
        onHide={() => setShowReminderModal(false)}
        note={note}
        showToast={showToast}
      />
    </div>
  );
});

NoteCard.displayName = "NoteCard";

export default NoteCard;