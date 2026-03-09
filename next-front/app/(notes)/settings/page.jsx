"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  ButtonGroup,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import { fetchWithAuth } from "@/app/lib/api";

const SettingsPage = () => {
  const [theme, setTheme] = useState("light");

  const [notifChannel, setNotifChannel] = useState("email");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState("");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
  }, []);

  useEffect(() => {
    fetchWithAuth("/api/account/notification-profile/")
      .then((r) => r.json())
      .then((data) => {
        setNotifChannel(data.notification_channel || "email");
        setBotToken(data.telegram_bot_token || "");
        setChatId(data.telegram_chat_id || "");
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
  };

  const saveNotifSettings = async () => {
    setNotifSaving(true);
    setNotifSuccess(false);
    setNotifError("");
    try {
      const body = { notification_channel: notifChannel };
      if (notifChannel === "telegram") {
        body.telegram_bot_token = botToken;
        body.telegram_chat_id = chatId;
      }
      const resp = await fetchWithAuth("/api/account/notification-profile/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        setNotifSuccess(true);
      } else {
        const data = await resp.json();
        setNotifError(
          data.error || data.telegram_error || "Failed to save settings.",
        );
      }
    } catch {
      setNotifError("Network error. Please try again.");
    } finally {
      setNotifSaving(false);
    }
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
              <Card.Text>Choose your preferred color scheme.</Card.Text>
              <ButtonGroup>
                <Button
                  variant={theme === "light" ? "primary" : "outline-primary"}
                  onClick={() => toggleTheme("light")}
                >
                  ☀️ Light
                </Button>
                <Button
                  variant={theme === "dark" ? "primary" : "outline-primary"}
                  onClick={() => toggleTheme("dark")}
                >
                  🌙 Dark
                </Button>
              </ButtonGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Notifications</Card.Title>
              {notifLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  {notifSuccess && (
                    <Alert
                      variant="success"
                      onClose={() => setNotifSuccess(false)}
                      dismissible
                    >
                      Settings saved.
                    </Alert>
                  )}
                  {notifError && (
                    <Alert
                      variant="danger"
                      onClose={() => setNotifError("")}
                      dismissible
                    >
                      {notifError}
                    </Alert>
                  )}
                  <Form>
                    <div className="mb-3">
                      <Form.Check
                        type="radio"
                        label="Email"
                        id="notif-email"
                        checked={notifChannel === "email"}
                        onChange={() => setNotifChannel("email")}
                      />
                      <Form.Check
                        type="radio"
                        label="Telegram"
                        id="notif-telegram"
                        checked={notifChannel === "telegram"}
                        onChange={() => setNotifChannel("telegram")}
                      />
                    </div>

                    {notifChannel === "telegram" && (
                      <>
                        <Form.Group className="mb-2">
                          <Form.Label>Bot Token</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="123456:ABC-DEF..."
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                          />
                          <Form.Text className="text-muted">
                            Create a bot via{" "}
                            <a
                              href="https://t.me/BotFather"
                              target="_blank"
                              rel="noreferrer"
                            >
                              @BotFather
                            </a>{" "}
                            and paste the token here.
                          </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Your Telegram Chat ID</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="123456789"
                            value={chatId}
                            onChange={(e) => setChatId(e.target.value)}
                          />
                          <Form.Text className="text-muted">
                            Message{" "}
                            <a
                              href="https://t.me/userinfobot"
                              target="_blank"
                              rel="noreferrer"
                            >
                              @userinfobot
                            </a>{" "}
                            on Telegram to find your chat ID.
                          </Form.Text>
                        </Form.Group>
                      </>
                    )}

                    <Button
                      variant="primary"
                      onClick={saveNotifSettings}
                      disabled={notifSaving}
                    >
                      {notifSaving ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SettingsPage;
