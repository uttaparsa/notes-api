import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge } from 'react-bootstrap';
import Link from 'next/link';
import styles from './MarginSimilarNotes.module.css';

// Custom event names for margin communication
const SHOW_SIMILAR_EVENT = 'showSimilarInMargin';
const HIDE_SIMILAR_EVENT = 'hideSimilarInMargin';
const DISPLAY_TIMEOUT = 5000; // 10 seconds display time

const MarginSimilarNotes = () => {
  const [visible, setVisible] = useState(false);
  const [results, setResults] = useState([]);
  const [sourceText, setSourceText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const timeoutRef = useRef(null);
  const marginRef = useRef(null);

  useEffect(() => {
    // Event listeners for showing/hiding similar notes in margin
    const handleShowSimilar = (event) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const { results, sourceText } = event.detail;
      
      // Make sure results has valid IDs before setting state
      const validResults = results.filter(result => result.id !== null && result.id !== undefined);
      
      if (validResults.length > 0) {
        setResults(validResults);
        setSourceText(sourceText);
        setVisible(true);
        
        // Set timeout to hide after 10 seconds if not pinned
        if (!isPinned) {
          timeoutRef.current = setTimeout(() => {
            setVisible(false);
          }, DISPLAY_TIMEOUT);
        }
      } else {
        console.warn("No valid note IDs found in results");
        setVisible(false);
      }
    };

    const handleHideSimilar = () => {
      // Don't hide if the component is pinned
      if (isPinned) return;
      
      // Don't hide immediately - wait 10 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, DISPLAY_TIMEOUT);
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

  // Helper function to get badge color based on similarity score
  const getBadgeColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'info';
    if (score >= 0.4) return 'warning';
    return 'secondary';
  };

  // Mouse handlers reset the timeout
  const handleMouseEnter = () => {
    // Cancel any hide timeout when mouse enters
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    // Set timeout to hide after 10 seconds if not pinned
    if (!isPinned) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setVisible(false), DISPLAY_TIMEOUT);
    }
  };

  // Effect to update timeout when isPinned changes
  useEffect(() => {
    // If unpinned, start the timeout
    if (!isPinned && visible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setVisible(false), DISPLAY_TIMEOUT);
    }
    // If pinned, clear any timeout
    else if (isPinned) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [isPinned]);

  return (
    <div 
      ref={marginRef}
      className={`${styles.marginNotesContainer} ${visible ? styles.visible : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
                          bg={getBadgeColor((result.similarity_score || 0.5))} 
                          className={styles.similarityBadge}
                        >
                          {Math.round(((result.similarity_score || 0.5)) * 100)}%
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