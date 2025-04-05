import React, { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./NoteCard.module.css";
import { isRTL } from "../utils/stringUtils";
import { Button } from 'react-bootstrap';
import { fetchWithAuth } from '../lib/api';

// Import modularized components and functions
import { createCustomRenderers, processNoteText } from './markdown/MarkdownRenderers';

const NoteTextRenderer = ({ 
  note, 
  singleView = false, 
  isExpanded = false, 
  onExpand = () => {}, 
  shouldLoadLinks = true,
  showToast = () => {} 
}) => {
  // State for tracking chunks from backend
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State to track if chunks should be highlighted
  const [highlightChunks, setHighlightChunks] = useState(false);
  
  // State to control similarity mode
  const [similarityModeEnabled, setSimilarityModeEnabled] = useState(false);
  
  // Effect to fetch chunks from backend when in single view
  useEffect(() => {
    if (singleView && note?.id) {
      setLoading(true);
      fetchWithAuth(`/api/note/message/${note.id}/chunks/`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch note chunks');
          }
          return response.json();
        })
        .then(data => {
          setChunks(data);
          // Enable highlighting after chunks are loaded if similarity mode is on
          if (similarityModeEnabled) {
            setHighlightChunks(true);
          }
        })
        .catch(err => {
          console.error('Error fetching chunks:', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [singleView, note?.id, similarityModeEnabled]);

  // Toggle similarity mode
  const toggleSimilarityMode = () => {
    const newState = !similarityModeEnabled;
    setSimilarityModeEnabled(newState);
    
    if (newState) {
      // When enabling similarity mode
      setHighlightChunks(true);
      
      // Don't send the event immediately to prevent flashing of margin notes
      // Instead, just trigger similarity mode which will cause chunks to load in background
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('similarityModeEnabled'));
      }, 300);
      
      // Set a timer to automatically end the highlight effect
      const highlightTimer = setTimeout(() => {
        setHighlightChunks(false);
      }, 5000); // Keep highlights visible for 5 seconds
      
      return () => {
        clearTimeout(timer);
        clearTimeout(highlightTimer);
      };
    } else {
      // When disabling similarity mode
      setHighlightChunks(false);
      window.dispatchEvent(new CustomEvent('hideSimilarInMargin'));
    }
  };

  // Create custom renderers using our factory function
  const customRenderers = createCustomRenderers(
    note,
    similarityModeEnabled,
    chunks,
    singleView,
    shouldLoadLinks,
    showToast
  );

  const processedText = processNoteText(note, singleView, isExpanded);

  // Add a debug UI for chunks if in development mode
  const renderDebugChunks = () => {
    if (process.env.NODE_ENV !== 'development' || !singleView || !chunks.length) {
      return null;
    }
    
    return (
      <div className="mt-3 p-2 border-top">
        <details>
          <summary className="text-muted">Debug: {chunks.length} chunks found</summary>
          <div className="mt-2 small">
            {chunks.map((chunk, index) => (
              <div key={index} className="mb-2 p-2 border" style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                opacity: 0.7
              }}>
                <div><strong>Chunk {chunk.chunk_index}:</strong></div>
                <div>{chunk.chunk_text.substring(0, 100)}...</div>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  };

  // Add additional UI for showing chunk count when in similarity mode
  const renderChunkCounter = () => {
    if (!singleView || !chunks.length) return null;
    
    return (
      <div className={`d-flex align-items-center ${similarityModeEnabled ? 'text-primary' : 'text-muted'}`}>
        <small>
          {similarityModeEnabled ? (
            <span className="badge bg-light text-primary border border-primary">
              {chunks.length} chunks available for similarity search
            </span>
          ) : null}
        </small>
      </div>
    );
  };

  return (
    <>
      {singleView && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          {renderChunkCounter()}
          <Button 
            variant={similarityModeEnabled ? "primary" : "outline-secondary"} 
            size="sm" 
            onClick={toggleSimilarityMode}
            className="ms-auto"
          >
            <i className="bi bi-lightbulb me-1"></i>
            {similarityModeEnabled ? "Disable" : "Enable"} Similar Notes
          </Button>
        </div>
      )}
      
      <span
        className={`card-text ${isRTL(note.text) ? "text-end" : ""}`}
        dir={isRTL(note.text) ? "rtl" : "ltr"}
      >
        {loading && singleView && (
          <div className="text-center text-muted my-2">
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading chunks...
          </div>
        )}
        
        <ReactMarkdown 
          components={customRenderers} 
          remarkPlugins={[remarkGfm]} 
          className={` ${isRTL(note.text) ? styles.rtlMarkdown : ''}`}
        >
          {processedText}
        </ReactMarkdown>
        
        {!singleView && note.text.length > 1000 && !isExpanded && (
          <span 
            onClick={() => onExpand()} 
            className="h4 mx-2 px-1 rounded py-0 text-secondary border flex-sn-wrap"
          >
            <b>...</b>
          </span>
        )}
      </span>
      
      {renderDebugChunks()}
    </>
  );
};

export default NoteTextRenderer;