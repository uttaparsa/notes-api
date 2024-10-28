'use client';

import React, { useEffect, useState } from 'react';
import { Container, ListGroup, Button, Row, Col, Alert } from 'react-bootstrap';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/account/sessions/', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSession = async (sessionKey) => {
    try {
      const response = await fetch(`/api/account/sessions/${sessionKey}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      // Remove the deleted session from the list
      setSessions(sessions.filter((session) => session.session_key !== sessionKey));
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper function to get the CSRF token from cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  return (
    <Container className="mt-4">
      <h3>Active Sessions</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <ListGroup>
        {sessions.map((session) => (
          <ListGroup.Item key={session.session_key}>
            <Row className="align-items-center">
              <Col md={8}>
                <strong>Device:</strong> {session.device_name} <br />
                <strong>IP:</strong> {session.ip_address} <br />
                <strong>User Agent:</strong> {session.user_agent} <br />
                <strong>Created At:</strong> {new Date(session.created_at).toLocaleString()} <br />
                <strong>Last Activity:</strong> {new Date(session.last_activity).toLocaleString()}
              </Col>
              <Col md={4} className="text-end">
                <Button
                  variant="danger"
                  onClick={() => deleteSession(session.session_key)}
                >
                  Delete
                </Button>
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
};

export default SessionsPage;
