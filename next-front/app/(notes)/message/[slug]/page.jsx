'use client'
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NoteCard from '../../../components/NoteCard';
import { fetchWithAuth } from '@/app/lib/api';
import { handleApiError } from '@/app/utils/errorHandler';
import { Spinner } from 'react-bootstrap';

const SingleNoteView = () => {
  const [busy, setBusy] = useState(true);
  const [note, setNote] = useState(null);
  const [similarNotes, setSimilarNotes] = useState([]);
  const noteComponentRef = useRef(null);
  const params = useParams();

  useEffect(() => {
    const updateTitle = async () => {
      try {
        const currentNote = await getCurrentNote();
        setNote(currentNote);
        await fetchSimilarNotes(currentNote.id);
        setBusy(false);
        
        if (currentNote?.text) {
          document.title = extractMarkdownTitleFromText(currentNote.text);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        document.title = 'Note - Error';
      }
    };

    updateTitle();
  }, []); 

  const fetchSimilarNotes = async (noteId) => {
    try {
      const response = await fetchWithAuth(`/api/note/message/${noteId}/similar/`);
      if (!response.ok) {
        throw new Error('Failed to fetch similar notes');
      }
      const data = await response.json();
      setSimilarNotes(data);
    } catch (error) {
      console.error("Error fetching similar notes:", error);
      handleApiError(error);
    }
  };

  const extractMarkdownTitleFromText = (text) => {
    let title = "Note";
    
    if (text) {
      const lines = text.split("\n").filter(line => line.trim());
      const firstLine = lines[0] || "";
      
      const headerMatch = firstLine.match(/^#{1,6}\s+(.+)$/);
      if (headerMatch) {
        title = headerMatch[1].trim();
        title += " - Note";
      }
    }
    
    return title;
  };

  const getCurrentNote = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/message/${params.slug}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch note');
      }
      const data = await response.json();
      return data;
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
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          title: "Success",
          body: `Note Saved`,
          delay: 5000,
          status: "success",
        }
      }));
      return true;
    } catch (err) {
      console.error(`Error editing note: ${err}`);
      handleApiError(err);
      return false;
    } finally {
      window.dispatchEvent(new CustomEvent('hideWaitingModal'));
    }
  };

  const formatSimilarityScore = (score) => {
    return (score * 100).toFixed(0) + '%';
  };

  return (
    <div className="container-fluid py-5" dir="ltr">
      <div className="row">
        <div className="col-lg-2"></div>
        <div className="col-lg-8">
          {busy ? (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          ) : (
            <NoteCard
              ref={noteComponentRef}
              note={note}
              onEditNote={editNote}
              singleView={true}
            />
          )}
        </div>
        <div className="col-lg-2 pl-lg-0">
          {note && note.source_links.length > 0 && (
            <>
              <span className="text-body-emphasis">backlinks</span>
              <ul className="list-group mb-4">
                {note.source_links.map(link => (
                  <Link href={`/message/${link.source_message.id}`} key={link.id}>
                    <li className="list-group-item list-group-item-secondary">
                      {link.source_message.text}
                    </li>
                  </Link>
                ))}
              </ul>
            </>
          )}
          
          {similarNotes.length > 0 && (
            <>
              <span className="text-body-emphasis">similar notes</span>
              <ul className="list-group">
                {similarNotes.map(similarNote => (
                  <Link href={`/message/${similarNote.id}`} key={similarNote.id}>
                    <li className="list-group-item list-group-item-secondary">
                      <div>{similarNote.text}</div>
                      <small className="text-muted">
                        Similarity: {formatSimilarityScore(similarNote.similarity_score)}
                      </small>
                    </li>
                  </Link>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleNoteView;