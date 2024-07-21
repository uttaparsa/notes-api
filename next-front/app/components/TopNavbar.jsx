'use client'

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function NavbarComponent({ isLoggedIn }) {
  const router = useRouter();

  const logout = async () => {
    // Implement your logout logic here
    // For example:
    // await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
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
                <Nav.Link onClick={logout}>Logout</Nav.Link>
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
        )}
      </Container>
    </Navbar>
  );
}