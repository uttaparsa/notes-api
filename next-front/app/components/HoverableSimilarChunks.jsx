import React, { useState, useEffect, useRef } from 'react';
import styles from './HoverableSimilarChunks.module.css';
import { fetchWithAuth } from '../lib/api';

// Custom event names for margin communication
const SHOW_SIMILAR_EVENT = 'showSimilarInMargin';
const HIDE_SIMILAR_EVENT = 'hideSimilarInMargin';

const HoverableSimilarChunks = ({ children, noteId }) => {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const childRef = useRef(null);
  
  // Get the text content from the children
  const getTextContent = () => {
    // Try to get from props directly
    const directText = children?.props?.children;
    if (typeof directText === 'string') return directText;
    
    // Try to get from ref
    if (childRef.current) {
      return childRef.current.textContent || '';
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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Delay the API call to avoid excessive requests during quick mouse movements
    timeoutRef.current = setTimeout(async () => {
      const text = getTextContent();
      
      if (text && text.length > 20) { // Only process if there's enough text
        setLoading(true);
        
        try {
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
                  position: getElementPosition(),
                  // Pass chunk index if available from data attribute
                  chunkIndex: children?.props?.['data-chunk-index']
                }
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching similar chunks:', error);
        } finally {
          setLoading(false);
        }
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
    // Try to get position from the rendered element
    if (childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        left: rect.left,
        right: rect.right
      };
    }
    
    // Fallback to active element
    const element = document.activeElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        left: rect.left,
        right: rect.right
      };
    }
    
    return null;
  };
  
  // Create a new child with the ref
  const childWithRef = React.cloneElement(
    children,
    {
      ref: childRef,
      className: `${children.props.className || ''} ${styles.hoverableText} ${loading ? styles.loading : ''}`
    }
  );

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {childWithRef}
    </span>
  );
};

export default HoverableSimilarChunks;