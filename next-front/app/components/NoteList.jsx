import React, { useEffect, useRef } from 'react';
import Note from './Note'; // Assuming you'll convert the Note component separately
import NoteModals from './NoteModals'; // Assuming you'll convert the NoteModals component separately

const NoteList = ({ notes, isBusy, hideEdits, showArchived, onRefresh }) => {
  const noteModalsRef = useRef();

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const updatePinned = (item, pinned) => {
    item.pinned = pinned;
    onRefresh();
  };

  const updateArchived = (item, archived) => {
    item.archived = archived;
    onRefresh();
  };

  const addNewNote = (note) => {
    notes.unshift(note);
    sortNotes();
  };

  const showDeleteModal = (note) => {
    noteModalsRef.current.showDeleteModal(note);
  };

  const showEditModal = (note) => {
    noteModalsRef.current.showEditModal(note);
  };

  const deleteNote = async (targetNoteId) => {
    // Implement showWaitingModal functionality
    try {
      await fetch(`/api/note/message/${targetNoteId}/`, {
        method: 'DELETE',
      });
      notes = notes.filter((obj) => obj.id !== targetNoteId);
    } catch (err) {
      // Implement error handling
      console.error('Error deleting note:', err);
    }
    // Implement hideWaitingModal functionality
  };

  const editNote = async (targetNoteId, newText) => {
    // Implement showWaitingModal functionality
    try {
      await fetch(`/api/note/message/${targetNoteId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
      });
      
      notes.forEach((note) => {
        if (note.id === targetNoteId) {
          note.text = newText;
        }
      });
      
      // Implement toast notification
      console.log('Note edited successfully');
    } catch (err) {
      // Implement error handling
      console.error('Error editing note:', err);
    }
    // Implement hideWaitingModal functionality
  };

  const sortNotes = () => {
    notes.sort((a, b) => {
      if (a.pinned === b.pinned) {
        if (a.archived === b.archived) {
          return b.created_at - a.created_at;
        }
        return a.archived > b.archived ? 1 : -1;
      }
      return a.pinned < b.pinned ? 1 : -1;
    });
  };

  return (
    <div>
      <div className="mt-1 d-flex row justify-content-center">
        {!isBusy ? (
          <div className="col-xl-12 d-flex flex-vertical flex-column">
            {notes.map((item) => (
              (showArchived === 'show' || !item.archived) && (
                <Note
                  key={item.id}
                  note={item}
                  onPin={() => updatePinned(item, true)}
                  onUnpin={() => updatePinned(item, false)}
                  onArchived={() => updateArchived(item, true)}
                  onUnarchived={() => updateArchived(item, false)}
                  onDeleteNote={deleteNote}
                  onEditNote={editNote}
                  hideEdits={hideEdits}
                />
              )
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div
              className="spinner-border mt-5"
              style={{ width: '3rem', height: '3rem' }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>
      <br className="my-5" />
      <br className="my-5" />
      <br className="my-5" />
      <NoteModals ref={noteModalsRef} />
    </div>
  );
};

export default NoteList;