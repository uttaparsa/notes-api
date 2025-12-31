'use client'


import { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NoteCard from '../../../components/notecard/NoteCard';
import { CompactMarkdownRenderer } from '../../../components/notecard/markdown/MarkdownRenderers';
import { fetchWithAuth } from '@/app/lib/api';
import { handleApiError } from '@/app/utils/errorHandler';
import { Spinner } from 'react-bootstrap';
import { NoteListContext } from '../../layout';

const SingleNoteView = () => {
  const [noteBusy, setNoteBusy] = useState(true);
  const [note, setNote] = useState(null);
  const [similarNotes, setSimilarNotes] = useState([]);
  const [similarNotesLoaded, setSimilarNotesLoaded] = useState(false);
  const [noteUpdateConflict, setNoteUpdateConflict] = useState(false);
  const [shouldShowRefreshPrompt, setShouldShowRefreshPrompt] = useState(false);
  const noteComponentRef = useRef(null);
  const noteContainerRef = useRef(null);
  const params = useParams();
  const noteLists = useContext(NoteListContext);

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
        
        // Find the list for this note and check disable_related
        const noteList = noteLists.find((lst) => lst.id === currentNote.list);
        const shouldLoadSimilar = noteList && !noteList.disable_related;
        
        // Only load similar notes if disable_related is false
        if (currentNote && shouldLoadSimilar) {
          await fetchSimilarNotes(currentNote.id);
        } else {
          setSimilarNotesLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        document.title = 'Note - Error';
        setNoteBusy(false);
        setSimilarNotesLoaded(false);
      }
    };

    loadData();
  }, [noteLists]);

  // Periodically check for note updates
  useEffect(() => {
    if (!note) return;
    const interval = setInterval(async () => {
      try {
        const response = await fetchWithAuth(`/api/note/message/${params.slug}/`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.updated_at && note.updated_at && data.updated_at !== note.updated_at) {
          setShouldShowRefreshPrompt(true);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [note, params.slug]);

  const fetchSimilarNotes = async (noteId) => {
    try {
      const response = await fetchWithAuth(`/api/note/message/${noteId}/similar/`,{},10000);
      if (!response.ok) {
        throw new Error('Failed to fetch similar notes');
      }
      const data = await response.json();
      setSimilarNotes(data);
      // Trigger animation after a brief delay to ensure DOM is ready
      setTimeout(() => setSimilarNotesLoaded(true), 50);
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
        body: JSON.stringify({ text: newText, updated_at: note.updated_at }),
      });
      if (response.status === 409) {
        setNoteUpdateConflict(true);
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: {
            title: "Edit Rejected",
            body: "This note was updated elsewhere. Please refresh.",
            delay: 7000,
            status: "danger",
          }
        }));
        return false;
      }
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
      setNoteUpdateConflict(false);
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

  // Helper function to check if related notes should be shown
  const shouldShowRelated = () => {
    if (!note) return false;
    const noteList = noteLists.find((lst) => lst.id === note.list);
    return noteList && !noteList.disable_related;
  };

  return (
    <div className="container-fluid py-5" dir="ltr">
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .similar-note-item {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .similar-note-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .similarity-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          letter-spacing: 0.5px;
        }

        .section-header {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          color: var(--bs-secondary);
        }

        .backlink-item {
          border-radius: 8px;
          border-left: 3px solid #6c757d !important;
          padding: 0.75rem;
          transition: all 0.2s ease;
          background: var(--bs-body-bg);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .backlink-item:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .similar-card {
          border-radius: 12px;
          padding: 1rem;
          background: var(--bs-body-bg);
          border: 1px solid var(--bs-border-color);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .similar-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: var(--border-color);
          border-radius: 12px 0 0 12px;
        }

        .similar-card.high-similarity::before {
          background: linear-gradient(180deg, #198754 0%, #20c997 100%);
        }

        .similar-card.medium-similarity::before {
          background: linear-gradient(180deg, #0d6efd 0%, #6610f2 100%);
        }

        .similar-card.low-similarity::before {
          background: linear-gradient(180deg, #6c757d 0%, #adb5bd 100%);
        }

        .note-content {
          padding-left: 0.5rem;
        }
      `}</style>
      
      {shouldShowRefreshPrompt && (
        <div className="alert alert-warning d-flex align-items-center my-2" role="alert">
          <span className="me-2">This note was updated elsewhere.</span>
          <button className="btn btn-sm btn-outline-primary ms-auto" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      )}
      
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
              <div className="section-header">Backlinks</div>
              <div className="d-flex flex-column gap-2 mb-4">
                {note.source_links.map(link => (
                  <Link href={`/message/${link.source_message.id}`} key={link.id} className="text-decoration-none">
                    <div className="backlink-item">
                      <div className="small">
                        <CompactMarkdownRenderer>
                          {link.source_message.text}
                        </CompactMarkdownRenderer>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          
          {shouldShowRelated() && similarNotes.length > 0 && (
            <>
              <div className="section-header">Related Notes</div>
              <div className="d-flex flex-column gap-3">
                {similarNotes.map((similarNote, index) => {
                  const similarityClass = similarNote.similarity_score > 0.7 ? 'high-similarity' : 
                                         similarNote.similarity_score > 0.4 ? 'medium-similarity' : 'low-similarity';
                  const badgeClass = similarNote.similarity_score > 0.7 ? 'bg-success' : 
                                    similarNote.similarity_score > 0.4 ? 'bg-primary' : 'bg-secondary';
                  
                  return (
                    <Link href={`/message/${similarNote.id}`} key={similarNote.id} className="text-decoration-none">
                      <div 
                        className={`similar-card similar-note-item ${similarityClass}`}
                        style={{
                          animationDelay: similarNotesLoaded ? `${index * 0.1}s` : '0s'
                        }}>
                        <div className="note-content">
                          <div className="small mb-2">
                            <CompactMarkdownRenderer>
                              {similarNote.text}
                            </CompactMarkdownRenderer>
                          </div>
                          <div className="d-flex justify-content-end">
                            <span className={`similarity-badge ${badgeClass} text-white`}>
                              {formatSimilarityScore(similarNote.similarity_score)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      

    </div>
  );
};

export default SingleNoteView;