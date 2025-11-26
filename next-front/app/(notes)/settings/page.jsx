'use client';

import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, ButtonGroup } from 'react-bootstrap';
import Link from 'next/link';

const SettingsPage = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  return (
    <Container className="mt-4">
      <h2>Settings</h2>
      
      <Row className="mt-4">
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Statistics</Card.Title>
              <Card.Text>
                View your revision and note activity statistics.
              </Card.Text>
              <Link href="/settings/stats" passHref legacyBehavior>
                <Button variant="primary">View Stats</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Active Sessions</Card.Title>
              <Card.Text>
                Manage your active login sessions across devices.
              </Card.Text>
              <Link href="/settings/sessions" passHref legacyBehavior>
                <Button variant="primary">Manage Sessions</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Theme</Card.Title>
              <Card.Text>
                Choose your preferred color scheme.
              </Card.Text>
              <ButtonGroup>
                <Button 
                  variant={theme === 'light' ? 'primary' : 'outline-primary'}
                  onClick={() => toggleTheme('light')}
                >
                  ☀️ Light
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'primary' : 'outline-primary'}
                  onClick={() => toggleTheme('dark')}
                >
                  🌙 Dark
                </Button>
              </ButtonGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SettingsPage;
