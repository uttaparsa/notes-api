import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, Overlay, Card, Badge } from 'react-bootstrap';
import Link from 'next/link';
import styles from './HoverableSimilarChunks.module.css';
import { fetchWithAuth } from '../lib/api';

const HoverableSimilarChunks = ({ children, onHover, selectedText, similarChunks, noteId }) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const target = useRef(null);
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
      setShow(true);
      
      try {
        // Get the text content from the children
        const text = children.props?.children || selectedText || '';
        
        if (text && text.length > 10) { // Only process if there's enough text
          const response = await fetchWithAuth('/api/note/chunks/similar/', {
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
            setResults(data);
          }
        } else if (similarChunks && similarChunks.length) {
          // If similar chunks were provided directly as props
          setResults(similarChunks);
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
    
    // Add a small delay before hiding to make it easier to move to the tooltip
    timeoutRef.current = setTimeout(() => {
      setShow(false);
    }, 300);
  };

  return (
    <>
      <span
        ref={target}
        className={styles.hoverableText}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      
      <Overlay 
        target={target.current} 
        show={show && (loading || results.length > 0)} 
        placement="auto"
      >
        {(props) => (
          <Tooltip 
            id="similar-chunks-tooltip" 
            {...props}
            className={styles.tooltip}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={handleMouseLeave}
          >
            <Card className={styles.tooltipCard}>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <small>Similar content</small>
                {loading && <small>Loading...</small>}
              </Card.Header>
              <Card.Body className={styles.tooltipBody}>
                {results.length > 0 ? (
                  <div className={styles.resultsList}>
                    {results.map((result, index) => (
                      <Link 
                        href={`/message/${result.note_id}`} 
                        key={`${result.note_id}-${result.chunk_index || index}`}
                        className={styles.resultLink}
                      >
                        <div className={styles.resultItem}>
                          <div className={styles.resultText}>
                            {result.chunk_text || result.text}
                          </div>
                          <div className={styles.resultMeta}>
                            <Badge 
                              bg={getBadgeColor(result.similarity_score)} 
                              className={styles.similarityBadge}
                            >
                              {Math.round(result.similarity_score * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : loading ? (
                  <div className={styles.loadingState}>Searching for similar content...</div>
                ) : (
                  <div className={styles.emptyState}>No similar content found</div>
                )}
              </Card.Body>
            </Card>
          </Tooltip>
        )}
      </Overlay>
    </>
  );
};

// Helper function to get badge color based on similarity score
const getBadgeColor = (score) => {
  if (score >= 0.8) return 'success';
  if (score >= 0.6) return 'info';
  if (score >= 0.4) return 'warning';
  return 'secondary';
};

export default HoverableSimilarChunks;