'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NoteCard from '../../../components/NoteCard';
import { fetchWithAuth } from '@/app/lib/api';
import { handleApiError } from '@/app/utils/errorHandler';

const SingleNoteView = () => {
  const [busy, setBusy] = useState(true);
  const [note, setNote] = useState(null);
  const noteComponentRef = useRef(null);
  const params = useParams();

  useEffect(() => {
    getCurrentNote();
  }, []);

  const getCurrentNote = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/message/${params.slug}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch note');
      }
      const data = await response.json();
      setNote(data);
      console.log("current note is", data);
      setBusy(false);
    } catch (error) {
      console.error("Error fetching note:", error);
      handleApiError(error);
    }
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

      if (!response.ok) {
        throw new Error('Failed to edit note');
      }

      setNote(prevNote => ({ ...prevNote, text: newText }));
      noteComponentRef.current?.hideEditModal();
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Success", 
          body: `Note Saved`, 
          delay: 5000,
          status: "success",
        }
      }));
    } catch (err) {
      console.error(`Error editing note: ${err}`);
      // Handle error (e.g., show error message to user)
      handleApiError(err);
    }
    window.dispatchEvent(new CustomEvent('hideWaitingModal'));
  };


  if (busy) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container-fluid py-5" dir="ltr">
      <div className="row">
        <div className="col-lg-2"></div>
        <div className="col-lg-8">
          <NoteCard 
            ref={noteComponentRef}
            note={note} 
            onEditNote={editNote} 
            singleView={true}
          />
        </div>
        <div className="col-lg-2 pl-lg-0">
          {note.source_links.length > 0 && (
            <span className="text-body-emphasis">backlinks</span>
          )}
          <ul className="list-group">
            {note.source_links.map(link => (
              <Link href={`/message/${link.source_message.id}`} key={link.id}>
                <li className="list-group-item list-group-item-secondary">
                  {link.source_message.text}
                </li>
              </Link>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
};

export default SingleNoteView;