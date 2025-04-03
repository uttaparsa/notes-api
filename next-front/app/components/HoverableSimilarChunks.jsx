import React, { useState, useEffect, useRef } from 'react';

import styles from './HoverableSimilarChunks.module.css';
// Add this import for Bootstrap icons if not already in your project
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { fetchWithAuth } from '../lib/api';

// Custom event names for margin communication
const SHOW_SIMILAR_EVENT = 'showSimilarInMargin';
const HIDE_SIMILAR_EVENT = 'hideSimilarInMargin';

const HoverableSimilarChunks = ({ children, selectedText, noteId }) => {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Delay the API call to avoid excessive requests during quick mouse movements
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      
      try {
        // Get the text content from the children
        const text = children.props?.children || selectedText || '';
        
        if (text && text.length > 10) { // Only process if there's enough text
          const response = await fetchWithAuth('/api/note/similar/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: text,
              limit: 3,
              exclude_note_id: noteId,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Dispatch custom event to show similar notes in margin
            if (data && data.length > 0) {
              window.dispatchEvent(new CustomEvent(SHOW_SIMILAR_EVENT, {
                detail: {
                  results: data,
                  sourceText: text,
                  position: getElementPosition()
                }
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching similar chunks:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Increased delay before hiding to give more time to move to margin
    timeoutRef.current = setTimeout(() => {
      // Dispatch custom event to hide similar notes in margin
      window.dispatchEvent(new CustomEvent(HIDE_SIMILAR_EVENT));
    }, 1000);
  };

  // Helper function to get the element's position for positioning in margin
  const getElementPosition = () => {
    const element = document.activeElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY
      };
    }
    return null;
  };

  return (
    <span
      className={`${styles.hoverableText} ${loading ? styles.loading : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

    </span>
  );
};

export default HoverableSimilarChunks;