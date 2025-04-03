import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge } from 'react-bootstrap';
import Link from 'next/link';
import styles from './MarginSimilarNotes.module.css';

// Custom event names for margin communication
const SHOW_SIMILAR_EVENT = 'showSimilarInMargin';
const HIDE_SIMILAR_EVENT = 'hideSimilarInMargin';

const MarginSimilarNotes = () => {
  const [visible, setVisible] = useState(false);
  const [results, setResults] = useState([]);
  const [position, setPosition] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const timeoutRef = useRef(null);
  const marginRef = useRef(null);

  useEffect(() => {
    // Event listeners for showing/hiding similar notes in margin
    const handleShowSimilar = (event) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const { results, position, sourceText } = event.detail;
      
      // Log the results to debug
      console.log("Received similar notes:", results);
      
      // Make sure results has valid IDs before setting state
      const validResults = results.filter(result => result.id !== null && result.id !== undefined);
      
      if (validResults.length > 0) {
        setResults(validResults);
        setPosition(position);
        setSourceText(sourceText);
        setVisible(true);
      } else {
        console.warn("No valid note IDs found in results:", results);
      }
    };

    const handleHideSimilar = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Don't hide if the component is pinned
      if (isPinned) return;
      
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 1000); // A reasonable timeout
    };

    // Handle mouse enter/leave events
    const handleMarginMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleMarginMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (isPinned) return;
      
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 1000);
    };

    // Add event listeners
    window.addEventListener(SHOW_SIMILAR_EVENT, handleShowSimilar);
    window.addEventListener(HIDE_SIMILAR_EVENT, handleHideSimilar);
    
    // Cleanup
    return () => {
      window.removeEventListener(SHOW_SIMILAR_EVENT, handleShowSimilar);
      window.removeEventListener(HIDE_SIMILAR_EVENT, handleHideSimilar);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPinned]);

  // Add effect to handle margin element listeners
  useEffect(() => {
    // Add event listeners to margin element when it exists
    const marginElement = marginRef.current;
    if (marginElement) {
      marginElement.addEventListener('mouseenter', handleMarginMouseEnter);
      marginElement.addEventListener('mouseleave', handleMarginMouseLeave);
    }
    
    return () => {
      if (marginElement) {
        marginElement.removeEventListener('mouseenter', handleMarginMouseEnter);
        marginElement.removeEventListener('mouseleave', handleMarginMouseLeave);
      }
    };
  }, [marginRef.current]);

  // Helper function to get badge color based on similarity score
  const getBadgeColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'info';
    if (score >= 0.4) return 'warning';
    return 'secondary';
  };

  // Calculate position for the margin notes
  const getMarginStyle = () => {
    if (!position) return {};
    
    return {
      top: `${position.top}px`,
      maxHeight: '300px',
      transition: 'opacity 0.3s ease-in-out'
    };
  };

  // Define handleMarginMouseEnter and handleMarginMouseLeave functions
  const handleMarginMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMarginMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!isPinned) {
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 1000);
    }
  };

  if (!visible) return null;

  return (
    <div 
      ref={marginRef}
      className={styles.marginNotesContainer} 
      style={getMarginStyle()}
    >
      <Card className={styles.marginCard}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <small>Similar content</small>
          <button 
            className={`btn btn-sm ${isPinned ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Unpin this panel" : "Pin this panel to keep it visible"}
          >
            <i className={`bi ${isPinned ? 'bi-pin-fill' : 'bi-pin'}`}></i>
          </button>
        </Card.Header>
        <Card.Body className={styles.marginCardBody}>
          {results.length > 0 ? (
            <div className={styles.resultsList}>
              {sourceText && (
                <div className={styles.sourceTextPreview}>
                  <small className="text-muted">From text:</small>
                  <p className={styles.sourceTextContent}>{sourceText.substring(0, 100)}...</p>
                </div>
              )}
              {results.map((result, index) => (
                result.id ? (
                  <Link 
                    href={`/message/${result.id}`} 
                    key={`${result.id}-${result.chunk_index || index}`}
                    className={styles.resultLink}
                  >
                    <div className={styles.resultItem}>
                      <div className={styles.resultText}>
                        {result.text || `Note #${result.id}`}
                      </div>
                      <div className={styles.resultMeta}>
                        <Badge 
                          bg={getBadgeColor(1 - (result.similarity_score || 0.5))} 
                          className={styles.similarityBadge}
                        >
                          {Math.round((1 - (result.similarity_score || 0.5)) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div key={index} className={styles.resultItem}>
                    <div className={styles.resultText}>
                      Invalid note reference
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>No similar content found</div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MarginSimilarNotes;