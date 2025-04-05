import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../lib/api';

// Import the new renderer components
import { DisplayRenderer, SimilarityChunkRenderer } from './markdown/ChunkRenderers';

const NoteTextRenderer = ({ 
  note, 
  singleView = false, 
  isExpanded = false, 
  onExpand = () => {}, 
  shouldLoadLinks = true,
  showToast = () => {},
  similarityModeEnabled = false
}) => {
  // State for tracking chunks from backend
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Effect to fetch chunks from backend when in single view
  useEffect(() => {
    if (singleView && note?.id && similarityModeEnabled) {
      setLoading(true);
      fetchWithAuth(`/api/note/message/${note.id}/chunks/`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch note chunks');
          }
          return response.json();
        })
        .then(data => {
          console.log("Chunks received from API:", data);
          // Ensure we're setting the data correctly depending on the API response structure
          const chunksData = Array.isArray(data) ? data : data.chunks || [];
          setChunks(chunksData);
        })
        .catch(err => {
          console.error('Error fetching chunks:', err);
          setError(err.message);
          showToast("Failed to load note chunks", "error");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [singleView, note?.id, similarityModeEnabled, showToast]);

  // Effect to handle similarity mode changes
  useEffect(() => {
    if (similarityModeEnabled) {
      // When similarity mode is enabled
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('similarityModeEnabled'));
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      // When disabling similarity mode
      window.dispatchEvent(new CustomEvent('hideSimilarInMargin'));
    }
  }, [similarityModeEnabled]);


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
                <div><strong>Chunk {chunk.chunk_index || index}:</strong></div>
                <div>{(chunk.chunk_text || chunk.text || "").substring(0, 100)}...</div>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  };

  return (
    <>
      
      {loading && singleView && (
        <div className="text-center text-muted my-2">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Loading chunks...
        </div>
      )}
      
      {/* Conditionally render either the Display renderer or the Similarity renderer based on mode */}
      {singleView && similarityModeEnabled ? (
        <SimilarityChunkRenderer 
          note={note}
          chunks={chunks}
          showToast={showToast}
        />
      ) : (
        <DisplayRenderer
          note={note}
          singleView={singleView}
          isExpanded={isExpanded}
          onExpand={onExpand}
          shouldLoadLinks={shouldLoadLinks}
          showToast={showToast}
        />
      )}
      
      {renderDebugChunks()}
    </>
  );
};

export default NoteTextRenderer;