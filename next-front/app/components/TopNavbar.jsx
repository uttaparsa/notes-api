"use client";
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import {
  Navbar,
  Nav,
  Container,
  Button,
  ButtonGroup,
  Dropdown,
} from "react-bootstrap";
import { SelectedWorkspaceContext } from "../(notes)/layout";

export default function NavbarComponent({ isLoggedIn, onLogout, workspaces }) {
  const { selectedWorkspace, selectWorkspace } = useContext(
    SelectedWorkspaceContext,
  );
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.setAttribute("data-bs-theme", storedTheme);
  }, []);

  return (
    <Navbar className="px-3" bg="primary" variant="dark" expand="lg">
      <Navbar.Brand href="/">Notes</Navbar.Brand>
      {isLoggedIn && workspaces && workspaces.length > 0 && (
        <Dropdown className="me-2">
          <Dropdown.Toggle variant="outline-light" id="workspace-dropdown">
            {selectedWorkspace ? selectedWorkspace.name : "Select Workspace"}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {workspaces.map((workspace) => (
              <Dropdown.Item
                key={workspace.id}
                active={
                  selectedWorkspace && selectedWorkspace.id === workspace.id
                }
                onClick={() => selectWorkspace(workspace)}
              >
                {workspace.name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      {isLoggedIn && (
        <>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Item>
                <Link href="/" passHref legacyBehavior>
                  <Nav.Link>Home</Nav.Link>
                </Link>
              </Nav.Item>
              <Nav.Item>
                <Link href="/manage" passHref legacyBehavior>
                  <Nav.Link>Manage</Nav.Link>
                </Link>
              </Nav.Item>
              <Nav.Item className="d-lg-none">
                <Link href="/reminders" passHref legacyBehavior>
                  <Nav.Link>Manage Reminders</Nav.Link>
                </Link>
              </Nav.Item>
              <Nav.Item className="d-lg-none">
                <Link href="/files" passHref legacyBehavior>
                  <Nav.Link>Files</Nav.Link>
                </Link>
              </Nav.Item>
              <Nav.Item className="d-lg-none">
                <Link href="/settings" passHref legacyBehavior>
                  <Nav.Link>Settings</Nav.Link>
                </Link>
              </Nav.Item>
              <Nav.Item className="d-lg-none">
                <Nav.Link onClick={onLogout}>Logout</Nav.Link>
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
          <Dropdown align="end" className="d-none d-lg-block">
            <Dropdown.Toggle
              variant="outline-light"
              className="rounded-circle ms-2"
              style={{
                width: "40px",
                height: "40px",
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              👤
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="/reminders">Manage Reminders</Dropdown.Item>
              <Dropdown.Item href="/files">Files</Dropdown.Item>
              <Dropdown.Item href="/settings">Settings</Dropdown.Item>
              <Dropdown.Divider />
              <div className="px-3 py-2">
                <ButtonGroup size="sm">
                  <Button
                    variant={theme === "light" ? "primary" : "outline-primary"}
                    onClick={() => {
                      setTheme("light");
                      localStorage.setItem("theme", "light");
                      document.documentElement.setAttribute(
                        "data-bs-theme",
                        "light",
                      );
                    }}
                  >
                    ☀️
                  </Button>
                  <Button
                    variant={theme === "dark" ? "primary" : "outline-primary"}
                    onClick={() => {
                      setTheme("dark");
                      localStorage.setItem("theme", "dark");
                      document.documentElement.setAttribute(
                        "data-bs-theme",
                        "dark",
                      );
                    }}
                  >
                    🌙
                  </Button>
                </ButtonGroup>
              </div>
              <Dropdown.Divider />
              <Dropdown.Item onClick={onLogout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </>
      )}
    </Navbar>
  );
}
