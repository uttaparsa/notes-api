// components/RevisionHistoryModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Tab } from 'react-bootstrap';
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

  const getRevisionTitle = (index) => {
    if (index === 0) {
      return 'Current Version';
    } else if (index === revisions.length - 1) {
      return 'Original Text';
    } else {
      return `Revision ${revisions.length - index}`;
    }
  };

  const renderRevisionText = (revision) => {
    return revision.revision_text.split('\n').map((line, i) => (
      <div key={i} className={styles.textLine}>
        {line || '\u00A0'}
      </div>
    ));
  };

  const renderDiff = (revision) => {
    if (!revision.diff_text) {
      return renderRevisionText(revision);
    }

    return revision.diff_text.split('\n').map((line, i) => {
      let className = '';
      if (line.startsWith('+ ')) {
        className = styles.addedLine;
        line = line.substring(2);
      } else if (line.startsWith('- ')) {
        className = styles.removedLine;
        line = line.substring(2);
      } else if (line.startsWith('  ')) {
        className = styles.unchangedLine;
        line = line.substring(2);
      }
      return (
        <div key={i} className={className}>
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
                    {getRevisionTitle(index)}
                  </span>
                  <span className="text-muted">
                    {formatDate(revision.created_at)}
                  </span>
                </div>
                <div className={styles.contentContainer}>
                  <Tabs defaultActiveKey="text" className="mb-3">
                    <Tab eventKey="text" title="Complete Text">
                      <div className={styles.revisionContent}>
                        {renderRevisionText(revision)}
                      </div>
                    </Tab>
                    <Tab eventKey="changes" title="Changes">
                      <div className={styles.diffContent}>
                        {renderDiff(revision)}
                      </div>
                    </Tab>
                  </Tabs>
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