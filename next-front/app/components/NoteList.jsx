'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import NoteCard from './notecard/NoteCard';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';

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

  useEffect(() => {
    if (newNoteId) {
      setAnimatingNotes(prev => new Set([...prev, newNoteId]));
      
      // Remove animation after it completes
      setTimeout(() => {
        setAnimatingNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(newNoteId);
          return newSet;
        });
      }, 1000);
    }
  }, [newNoteId]);

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

  return (
    <div>
      <div className="mt-1 d-flex row justify-content-center">
        {!isBusy ? (
          <div className="col-xl-12 d-flex flex-vertical flex-column">
            {notes.map(note => (
              <div 
                key={note.id} 
                id="notesListt"
                className={animatingNotes.has(note.id) ? 'new-note-animation' : ''}
                style={{
                  animation: animatingNotes.has(note.id) ? 'slideInFromTop 0.6s cubic-bezier(0.4, 0, 0.2, 1), highlightNew 1s ease-out' : 'none',
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
      <style jsx>{`
        @keyframes slideInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes highlightNew {
          0% {
            background-color: rgba(13, 110, 253, 0.1);
            box-shadow: 0 0 20px rgba(13, 110, 253, 0.3);
          }
          100% {
            background-color: transparent;
            box-shadow: none;
          }
        }
        
        .new-note-animation {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
