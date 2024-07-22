import React, { useState, useRef, useContext, forwardRef, useImperativeHandle } from 'react';
import { Dropdown, Modal, Button } from 'react-bootstrap';
import Link from 'next/link';
import { NoteListContext } from '../layout';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

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
  
  const processNoteText = (note) => {
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
      <div className="card-body pb-1">
      <div className="row">
          <div className="col-sm-1">
            <Dropdown>
              <Dropdown.Toggle variant="dark" id="dropdown-basic">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path
                  d="M24 6h-24v-4h24v4zm0 4h-24v4h24v-4zm0 8h-24v4h24v-4z"
                />
              </svg>
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

                  <span>{note.file.split('/').pop()}</span>
                </div>
              </a>
            )}
            <span
              ref={editMessageTextAreaRef}
              className={`card-text text-light ${isRTL(note.text) ? 'text-right' : ''}`}
              dir={isRTL(note.text) ? 'rtl' : 'ltr'}
            >
                   <ReactMarkdown>{processNoteText(note)}</ReactMarkdown>
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
              {
                note.pinned && 
                <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-pin"
                viewBox="0 0 16 16"
  
              >
                <path
                  d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354zm1.58 1.408-.002-.001.002.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a4.922 4.922 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a4.915 4.915 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.775 1.775 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14c.06.1.133.191.214.271a1.78 1.78 0 0 0 .37.282z"
                />
              </svg>

              }

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-link"
              viewBox="0 0 16 16"
            >
              <path
                d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"
              />
              <path
                d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z"
              />
            </svg>
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