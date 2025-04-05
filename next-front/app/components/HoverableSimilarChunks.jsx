import React, { useState, useEffect, useRef } from 'react';
import styles from './HoverableSimilarChunks.module.css';
import { fetchWithAuth } from '../lib/api';

// Custom event names for margin communication
const SHOW_SIMILAR_EVENT = 'showSimilarInMargin';
const HIDE_SIMILAR_EVENT = 'hideSimilarInMargin';
const SIMILARITY_MODE_ENABLED = 'similarityModeEnabled';

const HoverableSimilarChunks = ({ children, noteId, enabled = false, chunkText = null }) => {
  const [loading, setLoading] = useState(false);
  const [similarResults, setSimilarResults] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const childRef = useRef(null);
  
  // Load data once on initial render if enabled
  useEffect(() => {
    if ( !dataLoaded && !loading) {
      fetchSimilarContent();
    }
  }, [ dataLoaded]);

  // Listen for similarity mode enabled event
  useEffect(() => {
    const handleSimilarityModeEnabled = () => {
      if (!dataLoaded && !loading) {
        fetchSimilarContent();
      }
    };

    window.addEventListener(SIMILARITY_MODE_ENABLED, handleSimilarityModeEnabled);
    
    return () => {
      window.removeEventListener(SIMILARITY_MODE_ENABLED, handleSimilarityModeEnabled);
    };
  }, [dataLoaded, loading]);

  // Load data once and store in state
  const fetchSimilarContent = async () => {
    // Use provided chunkText instead of trying to extract it
    const text = chunkText;
    
    if (text && text.length > 15) { // Lowered minimum content length for better coverage
      setLoading(true);
      
      try {
        // Always use the text-based similarity endpoint
        const endpoint = '/api/note/similar/';
        const requestBody = {
          text: text,
          limit: 3,
          exclude_note_id: noteId,
        };
        
        const response = await fetchWithAuth(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }, 30000);
        
        if (response.ok) {
          const data = await response.json();
          setSimilarResults(data);
          setDataLoaded(true);
        } else {
          console.error('Error fetching similar chunks: API returned status', response.status);
        }
      } catch (error) {
        console.error('Error fetching similar chunks:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMouseEnter = () => {
    if (!enabled) return;
    
    // If we have results, show them
    if (similarResults && similarResults.length > 0) {
      window.dispatchEvent(new CustomEvent(SHOW_SIMILAR_EVENT, {
        detail: {
          results: similarResults,
          sourceText: chunkText // Use provided chunkText
        }
      }));
    }
  };

  const handleMouseLeave = () => {
    if (!enabled) return;
    
    // Just dispatch hide event, let the margin component handle timing
    window.dispatchEvent(new CustomEvent(HIDE_SIMILAR_EVENT));
  };
  
  // Create a new child with the ref, handling different element types
  const createChildWithRef = () => {
    // For DOM elements like spans, divs, paragraphs
    if (typeof children.type === 'string') {
      return React.cloneElement(
        children,
        {
          ref: childRef,
          className: `${children.props.className || ''} 
            ${enabled ? styles.hoverableText : ''} 
            ${loading ? styles.loading : ''} 
            ${similarResults && similarResults.length > 0 && enabled ? styles.hasResults : ''}`
        }
      );
    }
    
    // For React components that don't accept refs directly
    return (
      <span 
        ref={childRef}
        className={`
          ${enabled ? styles.hoverableTextWrapper : ''} 
          ${loading ? styles.loading : ''} 
          ${similarResults && similarResults.length > 0 && enabled ? styles.hasResults : ''}`
        }
      >
        {children}
      </span>
    );
  };
  
  // Use the enhanced method to create child with ref
  const childWithRef = createChildWithRef();

  return (
    <span
      onMouseEnter={enabled ? handleMouseEnter : undefined}
      onMouseLeave={enabled ? handleMouseLeave : undefined}
    >
      {childWithRef}
    </span>
  );
};

export default HoverableSimilarChunks;