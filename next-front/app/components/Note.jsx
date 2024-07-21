import React, { useState, useRef, useContext, forwardRef, useImperativeHandle } from 'react';
import { Dropdown, Modal, Button } from 'react-bootstrap';
import Link from 'next/link';
import { NoteListContext } from '../../app/layout';
import { useRouter } from 'next/navigation';

const NoteCard = forwardRef(({ note, singleView, hideEdits, onPin, onUnpin, onArchived, onUnarchived, onDeleteNote, onEditNote }, ref) => {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [textInsideDeleteModal, setTextInsideDeleteModal] = useState('');
  const editMessageTextAreaRef = useRef(null);
  const noteLists = useContext(NoteListContext);
  const router = useRouter();

  useImperativeHandle(ref, () => ({
    hideEditModal: () => setShowEditModal(false)
  }));

  const expandNote = () => {
    // You might want to use setState here to trigger a re-render
    note.expand = true;
  };

  const moveNote = async (lstId) => {
    try {
      const response = await fetch(`/api/note/message/move/${note.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ list_id: lstId }),
      });

      if (!response.ok) {
        throw new Error('Failed to move note');
      }

      note.list = lstId;
      setShowMoveModal(false);
      // You might want to add some state update or notification here
    } catch (err) {
      console.error('Error moving note:', err);
      // Handle error (e.g., show an error message)
    }
  };

  const editNote = () => {
    const newText = editMessageTextAreaRef.current.value;
    onEditNote(note.id, newText);
    setShowEditModal(false);
  };

  const processNoteText = () => {
    return (singleView || note.text.length < 1000 || note.expand === true) 
      ? note.text 
      : note.text.substring(0, 1000);
  };

  const pinMessage = () => onPin(note.id);
  const unPinMessage = () => onUnpin(note.id);
  const archiveMessage = () => onArchived(note.id);
  const unArchiveMessage = () => onUnarchived(note.id);

  const showEditModalHandler = () => {
    setShowEditModal(true);
    setTimeout(() => {
      if (editMessageTextAreaRef.current) {
        // Implement updateTextAreaHeight if needed
        editMessageTextAreaRef.current.focus();
        editMessageTextAreaRef.current.dir = isRTL(note.text) ? 'rtl' : 'ltr';
      }
    }, 100);
  };

  const toggleEditorRtl = () => {
    if (editMessageTextAreaRef.current) {
      editMessageTextAreaRef.current.dir = 
        editMessageTextAreaRef.current.dir === 'rtl' ? 'ltr' : 'rtl';
    }
  };

  const showDeleteModalHandler = () => {
    const textInModal = note.text.length > 30
      ? note.text.substring(0, 30) + ' ...'
      : note.text;
    setTextInsideDeleteModal(textInModal);
    setShowDeleteModal(true);
  };

  const getListName = () => {
    const list = noteLists.find(lst => lst.id === note.list);
    return list ? list.name : '';
  };

  const getListSlug = () => {
    const list = noteLists.find(lst => lst.id === note.list);
    return list ? list.slug : '';
  };

  const handleEnter = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      editNote();
    }
  };

  // Implement these functions
  const isRTL = (text) => {
    // Implement RTL detection logic here
    return false;
  };

  const copyElementTextToClipboard = (element) => {
    // Implement copy to clipboard logic here
  };

  // Implement date formatting functions
  const formatDateSmall = (date) => {
    // Implement date formatting logic here
    return date;
  };

  const formatDateLarge = (date) => {
    // Implement date formatting logic here
    return date;
  };

  return (
    <div className="card rounded bg-secondary mb-2">
      {/* Card body content */}
      <div className="card-body pb-1">
      <div className="row">
          <div className="col-sm-1">
            <Dropdown>
              <Dropdown.Toggle variant="dark" id="dropdown-basic">
                {/* SVG icon here */}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {!hideEdits && <Dropdown.Item onClick={() => setShowMoveModal(true)}>Move</Dropdown.Item>}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => copyElementTextToClipboard(`text-${note.id}`)}>Copy</Dropdown.Item>
                {!hideEdits && <Dropdown.Item onClick={showEditModalHandler}>Edit</Dropdown.Item>}
                {!singleView && !hideEdits && (
                  <>
                    {!note.pinned 
                      ? <Dropdown.Item onClick={pinMessage}>Pin</Dropdown.Item>
                      : <Dropdown.Item onClick={unPinMessage}>Unpin</Dropdown.Item>
                    }
                    {!note.archived
                      ? <Dropdown.Item onClick={archiveMessage}>Archive</Dropdown.Item>
                      : <Dropdown.Item onClick={unArchiveMessage}>UnArchive</Dropdown.Item>
                    }
                  </>
                )}
                {!singleView && !hideEdits && <Dropdown.Item onClick={showDeleteModalHandler}>Delete</Dropdown.Item>}
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <div className="col-sm-11 pl-md-1">
            <h6 className="card-subtitle mb-2 text-info">{note.sender_name}</h6>
            {note.image && (
              <img 
                src={note.image} 
                style={{maxHeight: '200px'}} 
                alt="..." 
                className="img-thumbnail" 
              />
            )}
            {note.file && (
              <a href={note.file}>
                <div className="bg-info float-left p-1 rounded text-dark">
                  {/* SVG icon here */}
                  <span>{note.file.split('/').pop()}</span>
                </div>
              </a>
            )}
            <span
              ref={editMessageTextAreaRef}
              className={`card-text text-light ${isRTL(note.text) ? 'text-right' : ''}`}
              dir={isRTL(note.text) ? 'rtl' : 'ltr'}
            >
              <span dangerouslySetInnerHTML={{ __html: processNoteText() }} />
              {(!singleView && note.text.length > 1000 && note.expand !== true) && (
                <span onClick={() => expandNote(note)} className='h4 mx-2 px-1 rounded py-0 bg-dark flex-sn-wrap'>
                  <b>...{note.expand}</b>
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-2 mb-0">
          <div className="float-right d-flex">
            <Link href={`/list/${getListSlug()}/`} className="my-0 mr-2 text-dark" style={{fontSize: '2em'}}>
              {getListName()}
            </Link>
            <span className="text-info">
              {/* SVG icon here */}
            </span>
            <span className="text-info mx-2">
              {note.archived && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 512 512"
                >
                  <path d="M32 448c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32V160H32v288zm160-212c0-6.6 5.4-12 12-12h104c6.6 0 12 5.4 12 12v8c0 6.6-5.4 12-12 12H204c-6.6 0-12-5.4-12-12v-8zM480 32H32C14.3 32 0 46.3 0 64v48c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16V64c0-17.7-14.3-32-32-32z" />
                </svg>
              )}
            </span>
            <span className="d-md-none">
              {/* You'll need to implement date formatting */}
              {/* {formatDateSmall(note.created_at)} */}
            </span>
            <span className="d-none d-md-block">
              {/* You'll need to implement date formatting */}
              {/* {formatDateLarge(note.created_at)} */}
            </span>
          </div>
          <span className="ml-2">
            <Link href={`/message/${note.id}/`}>
              {/* SVG icon here */}
            </Link>
          </span>
        </div>

      </div>

      {/* Modals */}
      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)}>
        {/* ... (Modal content remains the same) ... */}
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        {/* ... (Modal content remains the same, but update the delete logic) ... */}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => {
            onDeleteNote(note.id);
            setShowDeleteModal(false);
          }}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl">
        {/* ... (Modal content remains largely the same) ... */}
        <Modal.Body>
          <div className="mb-5 mt-0 px-2">
            <Button
              variant="outline-dark"
              size="sm"
              className="float-right"
              onClick={toggleEditorRtl}
            >
              {/* SVG icon here */}
            </Button>
          </div>
          <textarea
            ref={editMessageTextAreaRef}
            defaultValue={note.text}
            onKeyDown={handleEnter}
            // Implement updateTextAreaHeight if needed
            // onInput={(e) => updateTextAreaHeight(e.target)}
            className="w-100"
            style={{ whiteSpace: 'pre-line', maxHeight: '60vh' }}
          />
        </Modal.Body>
        {/* ... (rest of the Modal content remains the same) ... */}
      </Modal>
    </div>
  );
});

export default NoteCard;