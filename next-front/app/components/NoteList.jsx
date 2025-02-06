'use client';

import React, { useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import NoteCard from './NoteCard';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';

export default function NoteList({ 
  notes, 
  isBusy, 
  hideEdits, 
  showHidden, 
  onUpdateNote,
  onDeleteNote,
  refreshNotes 
}) {
  const noteRefs = useRef({});

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
      
      onDeleteNote(noteId);
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
              <div key={note.id} id="notesListt">
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
