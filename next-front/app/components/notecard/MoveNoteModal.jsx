import React, { useState, useContext } from 'react';
import { Modal, Button, Collapse } from 'react-bootstrap';
import { NoteListContext } from '../../(notes)/layout';
import styles from './NoteCard.module.css';

const MoveNoteModal = ({ show, onHide, currentNoteList, onMoveNote }) => {
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const noteLists = useContext(NoteListContext);

  const renderCategoryButtons = (categories, isArchived = false) => {
    return categories.map(lst => (
      <Button
        key={lst.id}
        variant={isArchived ? "secondary" : "info"}
        className="m-1"
        onClick={() => onMoveNote(lst.id)}
      >
        {lst.name} {isArchived && "(Archived)"}
      </Button>
    ));
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Moving note</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          {renderCategoryButtons(noteLists.filter(lst => lst.id !== currentNoteList && !lst.archived))}
        </div>
        {noteLists.some(lst => lst.archived) && (
          <>
            <hr className="my-3" />
            <div
              className={`d-flex align-items-center ${styles.cursorPointer}`}
              onClick={() => setShowArchivedCategories(!showArchivedCategories)}
            >
              <span className="mr-2">
                {showArchivedCategories ? '▼' : '▶'}
              </span>
              <h6 className="mb-0">Archived Categories</h6>
            </div>
            <Collapse in={showArchivedCategories}>
              <div className="mt-2">
                {renderCategoryButtons(noteLists.filter(lst => lst.id !== currentNoteList && lst.archived), true)}
              </div>
            </Collapse>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MoveNoteModal;