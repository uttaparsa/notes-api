'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

export default function NavbarComponent({ isLoggedIn, onLogout }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-bs-theme', storedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  return (
    <Navbar className='px-3' bg="primary" variant="dark" expand="lg">
      <Navbar.Brand href="/">Notes</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      {isLoggedIn && (
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Item>
              <Link href="/" passHref legacyBehavior>
                <Nav.Link>Home</Nav.Link>
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link href="/list" passHref legacyBehavior>
                <Nav.Link>Notes</Nav.Link>
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link href="/sessions" passHref legacyBehavior>
                <Nav.Link>Sessions</Nav.Link>
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={onLogout}>Logout</Nav.Link>
            </Nav.Item>
          </Nav>
          <Button 
            variant="outline-light" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </Button>
        </Navbar.Collapse>
      )}
    </Navbar>
  );
}