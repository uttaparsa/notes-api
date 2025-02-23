import React, { useState, useEffect } from 'react';
import { Card, Accordion, Badge } from 'react-bootstrap';

const FileAccessStats = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/note/stats/file-access/', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading stats...</div>;
  }

  if (error) {
    return <div className="text-danger p-4">Error: {error}</div>;
  }

  return (
    <div className="mb-4">
      <h4 className="mb-3">File Access Statistics</h4>
      <Accordion>
        {Object.entries(stats).map(([filePath, accesses], index) => (
          <Accordion.Item key={filePath} eventKey={index.toString()}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100 align-items-center pe-4">
                <span className="text-truncate">{filePath}</span>
                <Badge bg="secondary">{accesses.length} access(es)</Badge>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <div className="list-group list-group-flush">
                {accesses.map((access, accessIndex) => (
                  <div 
                    key={`${access.ip}-${accessIndex}`}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span>{access.ip}</span>
                    <small className="text-muted">
                      {new Date(access.last_access).toLocaleString()}
                    </small>
                  </div>
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default FileAccessStats;