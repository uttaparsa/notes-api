import React, { useState, useEffect } from 'react';
import { Card, Accordion, Badge, Form, Button, InputGroup, Spinner } from 'react-bootstrap';
import { formatDateLikeHuman } from "../utils/dateFormatters";

const FileAccessStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(50);
  const [selectedIp, setSelectedIp] = useState(null);

  const fetchStats = async (ipFilter = null, fileFilter = null) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (ipFilter) params.append('ip', ipFilter);
      if (fileFilter) params.append('file', fileFilter);
      params.append('limit', limit);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`/api/note/stats/access/${queryString}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
      
      // If we fetched details for a specific IP
      if (ipFilter && data.ip) {
        setSelectedIp(data.ip);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchStats(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (filter.trim()) {
      // Determine if the filter looks like an IP address
      const isIpPattern = /^(\d{1,3}\.){0,3}\d{1,3}$/.test(filter.trim());
      
      if (isIpPattern) {
        fetchStats(filter.trim(), null);
      } else {
        fetchStats(null, filter.trim());
      }
    } else {
      fetchStats();
    }
  };

  const handleViewIpDetails = (ip) => {
    fetchStats(ip, null);
  };

  const handleBackToOverview = () => {
    setSelectedIp(null);
    fetchStats();
  };

  if (loading && !stats) {
    return <div className="text-center p-4">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-2">Loading stats...</p>
    </div>;
  }

  if (error) {
    return <div className="alert alert-danger p-4">Error: {error}</div>;
  }

  // Display detailed view for a specific IP
  if (selectedIp && stats && stats.ip) {
    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Files Accessed by {selectedIp}</h4>
          <Button variant="secondary" size="sm" onClick={handleBackToOverview}>
            Back to Overview
          </Button>
        </div>
        
        <Card>
          <Card.Body>
            <div className="list-group list-group-flush">
              {stats.accessed_files && stats.accessed_files.length > 0 ? (
                stats.accessed_files.map((file, index) => (
                  <div 
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span className="text-truncate">{file.file_path}</span>
                    <small className="text-muted">
                      {formatDateLikeHuman(file.last_access)}
                    </small>
                  </div>
                ))
              ) : (
                <div className="text-center p-3">No files accessed by this IP.</div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Display file-specific view
  if (stats && stats.file_path) {
    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>IPs That Accessed: {stats.file_path}</h4>
          <Button variant="secondary" size="sm" onClick={handleBackToOverview}>
            Back to Overview
          </Button>
        </div>
        
        <Card>
          <Card.Body>
            <div className="list-group list-group-flush">
              {stats.accessing_ips && stats.accessing_ips.length > 0 ? (
                stats.accessing_ips.map((access, index) => (
                  <div 
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none text-start"
                      onClick={() => handleViewIpDetails(access.ip)}
                    >
                      {access.ip}
                    </Button>
                    <small className="text-muted">
                      {formatDateLikeHuman(access.last_access)}
                    </small>
                  </div>
                ))
              ) : (
                <div className="text-center p-3">No IPs have accessed this file.</div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Display default overview (IP-centric)
  return (
    <div className="mb-4">
      <h4 className="mb-3">File Access Statistics</h4>
      
      <Form onSubmit={handleSearch} className="mb-3">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search by IP or filename"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Form.Select 
            value={limit} 
            onChange={(e) => setLimit(parseInt(e.target.value))}
            style={{ maxWidth: '120px' }}
          >
            <option value="10">10 IPs</option>
            <option value="25">25 IPs</option>
            <option value="50">50 IPs</option>
            <option value="100">100 IPs</option>
          </Form.Select>
          <Button variant="primary" type="submit">
            Search
          </Button>
          <Button variant="secondary" onClick={() => {
            setFilter('');
            fetchStats();
          }}>
            Reset
          </Button>
        </InputGroup>
      </Form>
      
      {stats && stats.recent_accesses && (
        <Accordion>
          {stats.recent_accesses.map((access, index) => (
            <Accordion.Item key={index} eventKey={index.toString()}>
              <Accordion.Header>
                <div className="d-flex justify-content-between w-100 align-items-center pe-4">
                  <span>{access.ip}</span>
                  <Badge bg="secondary">{access.files.length} file(s)</Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="mb-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => handleViewIpDetails(access.ip)}
                  >
                    View All Files Accessed
                  </Button>
                </div>
                
                <div className="list-group list-group-flush">
                  {access.files.map((file, fileIndex) => (
                    <div 
                      key={fileIndex}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span className="text-truncate">{file.path}</span>
                      <small className="text-muted">
                        {formatDateLikeHuman(file.timestamp)}
                      </small>
                    </div>
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default FileAccessStats;