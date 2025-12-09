import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '../../../lib/api';

// Import the new renderer components
import { DisplayRenderer } from './ChunkRenderers';

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

  // Get highlight params from URL
  const searchParams = useSearchParams();
  const highlightStart = searchParams ? parseInt(searchParams.get('highlight_start')) : null;
  const highlightEnd = searchParams ? parseInt(searchParams.get('highlight_end')) : null;
  
  // Add effect to scroll to highlighted text
  useEffect(() => {
    if (singleView && !isNaN(highlightStart) && !isNaN(highlightEnd)) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const highlightedElement = document.querySelector('.highlighted-reminder-text');
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [singleView, highlightStart, highlightEnd]);
  
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
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!similarityModeEnabled) {
      setChunks([]); // Clear chunks if similarity mode is turned off
    }
  }, [singleView, note?.id, similarityModeEnabled]);



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
      
      {/* Always render DisplayRenderer, passing similarityModeEnabled and chunks */}
      <DisplayRenderer
        note={note}
        singleView={singleView}
        isExpanded={isExpanded}
        onExpand={onExpand}
        shouldLoadLinks={shouldLoadLinks}
        showToast={showToast}
        similarityModeEnabled={similarityModeEnabled}
        chunks={chunks} // Pass chunks to DisplayRenderer
        highlightStart={!isNaN(highlightStart) ? highlightStart : null}
        highlightEnd={!isNaN(highlightEnd) ? highlightEnd : null}
      />
      
      {renderDebugChunks()}
    </>
  );
};

export default NoteTextRenderer;