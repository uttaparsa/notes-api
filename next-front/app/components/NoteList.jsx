'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import NoteCard from './notecard/NoteCard';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './NoteList.module.css';

export default function NoteList({ 
  notes, 
  isBusy, 
  hideEdits, 
  showHidden, 
  onUpdateNote,
  onDeleteNote,
  refreshNotes,
  newNoteId = null
}) {
  const noteRefs = useRef({});
  const [animatingNotes, setAnimatingNotes] = useState(new Set());
  const [sortingNotes, setSortingNotes] = useState(new Set());

  useEffect(() => {
    if (newNoteId) {
      setAnimatingNotes(prev => new Set([...prev, newNoteId]));
      
      // After entrance animation, trigger sorting animation
      setTimeout(() => {
        setAnimatingNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(newNoteId);
          return newSet;
        });

        // Only trigger sorting animation if the note is not already at the top.
        const newNoteIndex = notes.findIndex(note => note.id === newNoteId);
        if (newNoteIndex > 0) {
          setSortingNotes(prev => new Set([...prev, newNoteId]));
        }
      }, 1000); // Extended from 600ms to 1000ms

      // Remove sorting animation after it completes
      setTimeout(() => {
        setSortingNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(newNoteId);
          return newSet;
        });
      }, 2000); // Extended from 1200ms to 2000ms
    }
  }, [newNoteId, notes]);

  const handlePinUpdate = async (note, pinned) => {
    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Updating note' }));
    try {
      const url = `/api/note/message/${pinned ? 'pin' : 'unpin'}/${note.id}/`;
      const response = await fetchWithAuth(url, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to update pin status');
      
      onUpdateNote(note.id, { pinned });
      refreshNotes();
    } catch (err) {
      console.error('Error updating pin status:', err);
      handleApiError(err);
    } finally {
      window.dispatchEvent(new CustomEvent('hideWaitingModal'));
    }
  };

  const handleArchiveUpdate = async (note, archived) => {
    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Updating note' }));
    try {
      const url = `/api/note/message/${archived ? 'archive' : 'unarchive'}/${note.id}/`;
      const response = await fetchWithAuth(url, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to update archive status');
      
      onUpdateNote(note.id, { archived });
      refreshNotes();
    } catch (err) {
      console.error('Error updating archive status:', err);
      handleApiError(err);
    } finally {
      window.dispatchEvent(new CustomEvent('hideWaitingModal'));
    }
  };

  const handleDelete = async (noteId) => {
    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Deleting note' }));
    
    try {
      const response = await fetchWithAuth(`/api/note/message/${noteId}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete note');
      
      const data = await response.json();
      onDeleteNote(noteId);
  
      // Create toast message including deleted files info
      let toastBody = "Note Deleted";
      if (data.deleted_files && data.deleted_files.length > 0) {
        const fileNames = data.deleted_files.map(path => path.split('/').pop());
        toastBody += `\nRemoved ${fileNames.length} unused ${fileNames.length === 1 ? 'file' : 'files'}: ${fileNames.join(', ')}`;
      }
  
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Success",
          body: toastBody,
          delay: 5000,
          status: "success",
        }
      }));
      
    } catch (err) {
      console.error('Error deleting note:', err);
      handleApiError(err);
    } finally {
      window.dispatchEvent(new CustomEvent('hideWaitingModal'));
    }
  };
  
  const handleEdit = async (noteId, newText) => {
    window.dispatchEvent(new CustomEvent('showWaitingModal', { detail: 'Editing note' }));
    try {
      const response = await fetchWithAuth(`/api/note/message/${noteId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
      });
      
      if (!response.ok) throw new Error('Failed to edit note');
      
      onUpdateNote(noteId, { text: newText });
      
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Success",
          body: "Note Saved",
          delay: 5000,
          status: "success",
        }
      }));
      
      return true;
    } catch (err) {
      console.error('Error editing note:', err);
      handleApiError(err);
      return false;
    } finally {
      window.dispatchEvent(new CustomEvent('hideWaitingModal'));
    }
  };

  // Sort notes but keep new note at top during entrance animation
  const displayNotes = React.useMemo(() => {
    if (animatingNotes.size === 0) {
      return notes; // Normal sorted order
    }
    
    const newNote = notes.find(note => animatingNotes.has(note.id));
    const otherNotes = notes.filter(note => !animatingNotes.has(note.id));
    
    return newNote ? [newNote, ...otherNotes] : notes;
  }, [notes, animatingNotes]);

  return (
    <div>
      <div className="mt-1 d-flex row justify-content-center">
        {!isBusy ? (
          <div className="col-xl-12 d-flex flex-vertical flex-column">
            {displayNotes.map(note => (
              <div 
                key={note.id} 
                id="notesListt"
                className={`${animatingNotes.has(note.id) ? styles.newNoteAnimation : ''} ${sortingNotes.has(note.id) ? styles.sortingAnimation : ''}`}
                style={{
                  animation: animatingNotes.has(note.id) 
                    ? `${styles.slideInFromTop} 1s cubic-bezier(0.4, 0, 0.2, 1), ${styles.highlightNew} 1.5s ease-out` 
                    : 'none',
                  transition: sortingNotes.has(note.id) ? 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                  transform: sortingNotes.has(note.id) ? 'scale(1.02) translateY(-5px)' : 'none',
                  boxShadow: sortingNotes.has(note.id) ? '0 8px 25px rgba(13, 110, 253, 0.15)' : 'none',
                  zIndex: sortingNotes.has(note.id) ? 10 : 'auto',
                }}
              >
                {(showHidden || !note.archived) && (
                  <NoteCard
                    ref={el => noteRefs.current[note.id] = el}
                    note={note}
                    singleView={false}
                    hideEdits={hideEdits}
                    onPin={() => handlePinUpdate(note, true)}
                    onUnpin={() => handlePinUpdate(note, false)}
                    onArchived={() => handleArchiveUpdate(note, true)}
                    onUnarchived={() => handleArchiveUpdate(note, false)}
                    onDeleteNote={handleDelete}
                    onEditNote={handleEdit}
                    refreshNotes={refreshNotes}
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
