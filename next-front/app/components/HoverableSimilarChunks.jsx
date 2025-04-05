import React, { useState, useEffect, useRef } from 'react';
import styles from './HoverableSimilarChunks.module.css';
import { fetchWithAuth } from '../lib/api';

// Custom event names for margin communication
const SHOW_SIMILAR_EVENT = 'showSimilarInMargin';
const HIDE_SIMILAR_EVENT = 'hideSimilarInMargin';
const SIMILARITY_MODE_ENABLED = 'similarityModeEnabled';

const HoverableSimilarChunks = ({ children, noteId, enabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [similarResults, setSimilarResults] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const childRef = useRef(null);
  
  // Get the text content from the children - enhanced to handle more element types
  const getTextContent = () => {
    // Try to get from props directly
    const directText = children?.props?.children;
    if (typeof directText === 'string') return directText;
    
    // Try to get from ref
    if (childRef.current) {
      return childRef.current.textContent || '';
    }
    
    // Special case for links - get href + text
    if (children?.props?.href) {
      const linkText = children.props.children;
      const linkHref = children.props.href;
      if (typeof linkText === 'string') {
        return `${linkText} (${linkHref})`;
      }
    }
    
    // Special case for images - get alt text + src
    if (children?.props?.src) {
      return `Image: ${children.props.alt || ''} (${children.props.src})`;
    }
    
    // Last resort - try to stringify the children
    try {
      if (children) {
        const text = React.Children.toArray(children)
          .map(child => {
            if (typeof child === 'string') return child;
            if (child?.props?.children && typeof child.props.children === 'string')
              return child.props.children;
            return '';
          })
          .join(' ');
        return text;
      }
    } catch (e) {
      console.error('Error getting text content:', e);
    }
    
    return '';
  };

  // Load data once on initial render if enabled
  useEffect(() => {
    if (enabled && !dataLoaded && !loading) {
      fetchSimilarContent();
    }
  }, [enabled, dataLoaded]);

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
    const text = getTextContent();
    
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
        }, 10000);
        
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
          sourceText: getTextContent()
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