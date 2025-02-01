// components/RevisionHistoryModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './RevisionHistoryModal.module.css';

const RevisionHistoryModal = ({ show, onHide, noteId }) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show && noteId) {
      fetchRevisions();
    }
  }, [show, noteId]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/note/revisions/${noteId}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch revisions');
      }
      const data = await response.json();
      setRevisions(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderDiff = (diffText) => {
    return diffText.split('\n').map((line, index) => {
      let className = '';
      if (line.startsWith('+ ')) {
        className = styles.addedLine;
        line = line.substring(2);
      } else if (line.startsWith('- ')) {
        className = styles.removedLine;
        line = line.substring(2);
      }
      return (
        <div key={index} className={className}>
          {line || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Revision History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center">Loading revisions...</div>
        ) : revisions.length === 0 ? (
          <div className="text-center">No revisions found</div>
        ) : (
          <div className={styles.revisionsContainer}>
            {revisions.map((revision, index) => (
              <div key={revision.id} className={styles.revisionEntry}>
                <div className={styles.revisionHeader}>
                  <span className="fw-bold">
                    Revision {revisions.length - index}
                  </span>
                  <span className="text-muted">
                    {formatDate(revision.created_at)}
                  </span>
                </div>
                <div className={styles.diffContent}>
                  {renderDiff(revision.diff_text)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RevisionHistoryModal;