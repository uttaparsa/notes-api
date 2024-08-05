'use client'

import Link from 'next/link';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function NavbarComponent({ isLoggedIn, onLogout }) {

  return (
    <Navbar className='px-3'  bg="primary" variant="dark" expand="lg">
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
                <Nav.Link onClick={onLogout}>Logout</Nav.Link>
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
        )}
    </Navbar>

  );
}