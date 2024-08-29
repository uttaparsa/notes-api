'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import NoteCard from './NoteCard';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';

export default function NoteList({ notes: initialNotes, isBusy, hideEdits, showHidden, refreshNotes }) {
  const [notes, setNotes] = useState(initialNotes);
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


  const deleteNote = async (targetNoteId) => {
    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Deleting note' }));
    try {
      const response = await fetchWithAuth(`/api/note/message/${targetNoteId}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      setNotes(prevNotes => prevNotes.filter(note => note.id !== targetNoteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      handleApiError(err);
    }
    window.dispatchEvent(new CustomEvent('hideWaitingModal'));
  };

  const editNote = async (targetNoteId, newText) => {
    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Editing note' }));
    try {
      const response = await fetchWithAuth(`/api/note/message/${targetNoteId}/`, {
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
      
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Success",
          body: `Note Saved`,
          delay: 5000,
          status: "success",
        }
      }));
      
      // Return true to indicate success
      return true;
    } catch (err) {
      console.error('Error editing note:', err);
      handleApiError(err);
      // Return false to indicate failure
      return false;
    } finally {
      window.dispatchEvent(new CustomEvent('hideWaitingModal'));
    }
  };


  return (
    <div>
      <div className="mt-1 d-flex row justify-content-center">
        {!isBusy ? (
          <div className="col-xl-12 d-flex flex-vertical flex-column">
            {notes.map(item => (
              <div key={item.id} id="notesListt">
                {(showHidden  || !item.archived) && (
                  <NoteCard
                    ref={el => noteRefs.current[item.id] = el}
                    note={item}
                    singleView={false}
                    hideEdits={hideEdits}
                    refreshNotes={refreshNotes}
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
    </div>
  );
}