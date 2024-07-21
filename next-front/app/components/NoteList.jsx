'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import NoteCard from './Note';
import NoteModals from './NoteModals';

export default function NoteList({ notes: initialNotes, isBusy, hideEdits, showArchived, refreshNotes }) {
  const [notes, setNotes] = useState(initialNotes);
  const noteModalsRef = useRef();
  const noteRefs = useRef({});

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    refreshNotes();
  }, []);

  const updatePinned = (item, pinned) => {
    const updatedNotes = notes.map(note => 
      note.id === item.id ? { ...note, pinned } : note
    );
    setNotes(updatedNotes);
    refreshNotes();
  };

  const updateArchived = (item, archived) => {
    const updatedNotes = notes.map(note => 
      note.id === item.id ? { ...note, archived } : note
    );
    setNotes(updatedNotes);
    refreshNotes();
  };

  const addNewNote = (note) => {
    setNotes(prevNotes => [note, ...prevNotes]);
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
      const response = await fetch(`/api/note/message/${targetNoteId}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      setNotes(prevNotes => prevNotes.filter(note => note.id !== targetNoteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      // Implement error handling here
    }
    // Implement hideWaitingModal functionality
  };

  const editNote = async (targetNoteId, newText) => {
    // Implement showWaitingModal functionality
    try {
      const response = await fetch(`/api/note/message/${targetNoteId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
      });
      if (!response.ok) throw new Error('Failed to edit note');
      setNotes(prevNotes => prevNotes.map(note => 
        note.id === targetNoteId ? { ...note, text: newText } : note
      ));
      noteRefs.current[targetNoteId].hideEditModal();
      // Implement toast notification here
    } catch (err) {
      console.error('Error editing note:', err);
      // Implement error handling here
    }
    // Implement hideWaitingModal functionality
  };

  const sortNotes = () => {
    setNotes(prevNotes => [...prevNotes].sort((a, b) => {
      if (a.pinned === b.pinned) {
        if (a.archived === b.archived) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return a.archived > b.archived ? 1 : -1;
      }
      return a.pinned < b.pinned ? 1 : -1;
    }));
  };

  return (
    <div>
      <div className="mt-1 d-flex row justify-content-center">
        {!isBusy ? (
          <div className="col-xl-12 d-flex flex-vertical flex-column">
            {notes.map(item => (
              <div key={item.id} id="notesListt">
                {(showArchived === 'show' || !item.archived) && (
                  <NoteCard
                    ref={el => noteRefs.current[item.id] = el}
                    note={item}
                    singleView={false}
                    hideEdits={hideEdits}
                    onPin={() => updatePinned(item, true)}
                    onUnpin={() => updatePinned(item, false)}
                    onArchived={() => updateArchived(item, true)}
                    onUnarchived={() => updateArchived(item, false)}
                    onDeleteNote={deleteNote}
                    onEditNote={editNote}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <Spinner
              className="mt-5"
              style={{ width: '3rem', height: '3rem' }}
              animation="border"
              variant="primary"
            />
          </div>
        )}
      </div>
      <br className="my-5" />
      <br className="my-5" />
      <br className="my-5" />
      <NoteModals ref={noteModalsRef} />
    </div>
  );
}