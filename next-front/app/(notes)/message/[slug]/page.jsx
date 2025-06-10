'use client'


import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NoteCard from '../../../components/notecard/NoteCard';
import MarginSimilarNotes from '../../../components/MarginSimilarNotes';
import { fetchWithAuth } from '@/app/lib/api';
import { handleApiError } from '@/app/utils/errorHandler';
import { Spinner } from 'react-bootstrap';
import ReactMarkdown from "react-markdown";

const SingleNoteView = () => {
  const [noteBusy, setNoteBusy] = useState(true);
  const [note, setNote] = useState(null);
  const [similarNotes, setSimilarNotes] = useState([]);
  const noteComponentRef = useRef(null);
  const noteContainerRef = useRef(null);
  const params = useParams();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load the main note
        const currentNote = await getCurrentNote();
        setNote(currentNote);
        setNoteBusy(false); // Set to false as soon as the note is loaded
        
        if (currentNote?.text) {
          document.title = extractMarkdownTitleFromText(currentNote.text);
        }
        
        // Load similar notes separately
        await fetchSimilarNotes(currentNote.id);
      } catch (error) {
        console.error('Error fetching note:', error);
        document.title = 'Note - Error';
        setNoteBusy(false);
        setSimilarNotesBusy(false);
      }
    };

    loadData();
  }, []);

  const fetchSimilarNotes = async (noteId) => {
    try {
      const response = await fetchWithAuth(`/api/note/message/${noteId}/similar/`,{},10000);
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
        <div className="col-lg-8 position-relative" ref={noteContainerRef}>
          {noteBusy ? (
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
              <h5 className="text-body-emphasis mb-2">Backlinks</h5>
              <div className="list-group mb-4">
                {note.source_links.map(link => (
                  <Link href={`/message/${link.source_message.id}`} key={link.id} className="text-decoration-none mb-2">
                    <div className="list-group-item list-group-item-action border-start border-3" 
                         style={{ borderLeftColor: '#6c757d' }}>
                      <div className="small">
                         <ReactMarkdown>
                           {link.source_message.text }
</ReactMarkdown>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          
          {similarNotes.length > 0 && (
            <>
              <h5 className="text-body-emphasis mb-2">Similar Notes</h5>
              <div className="list-group">
                {similarNotes.map(similarNote => (
                  <Link href={`/message/${similarNote.id}`} key={similarNote.id} className="text-decoration-none mb-2">
                    <div className="list-group-item list-group-item-action border-start border-3" 
                         style={{
                           borderLeftColor: similarNote.similarity_score > 0.7 ? '#198754' : 
                                            similarNote.similarity_score > 0.4 ? '#0d6efd' : '#6c757d'
                         }}>
                      <div className="d-flex flex-column">
                        <div className="small">
                            <ReactMarkdown>
                           {similarNote.text }
                  </ReactMarkdown>
                        </div>
                        <div className="d-flex justify-content-end mt-1">
                          <small 
                            className={`${
                              similarNote.similarity_score > 0.7 ? 'text-success' : 
                              similarNote.similarity_score > 0.4 ? 'text-primary' : 'text-secondary'
                            }`}
                          >
                            {formatSimilarityScore(similarNote.similarity_score)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Single global instance of margin similar notes */}
      <MarginSimilarNotes />
    </div>
  );
};

export default SingleNoteView;