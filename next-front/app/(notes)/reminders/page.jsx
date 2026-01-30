"use client";

import React, { useState, useEffect, useContext } from "react";
import { Container, Card, Button, Badge, Spinner, Form } from "react-bootstrap";
import { fetchWithAuth } from "../../lib/api";
import { ToastContext } from "../layout";
import Link from "next/link";

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const showToast = useContext(ToastContext);

  useEffect(() => {
    fetchReminders();
  }, [filter]);

  const fetchReminders = async () => {
    try {
      const url =
        filter === "all"
          ? "/api/note/reminders/"
          : `/api/note/reminders/?is_active=${filter === "active"}`;

      const response = await fetchWithAuth(url);

      if (!response.ok) {
        throw new Error("Failed to fetch reminders");
      }

      const data = await response.json();
      setReminders(data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      showToast("Error", "Failed to load reminders", 3000, "danger");
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (reminderId) => {
    try {
      const response = await fetchWithAuth(
        `/api/note/reminders/${reminderId}/`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete reminder");
      }

      showToast("Success", "Reminder deleted", 3000, "success");
      fetchReminders();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      showToast("Error", "Failed to delete reminder", 3000, "danger");
    }
  };

  const toggleActive = async (reminderId, currentStatus) => {
    try {
      const response = await fetchWithAuth(
        `/api/note/reminders/${reminderId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: !currentStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update reminder");
      }

      showToast("Success", "Reminder updated", 3000, "success");
      fetchReminders();
    } catch (error) {
      console.error("Error updating reminder:", error);
      showToast("Error", "Failed to update reminder", 3000, "danger");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      once: "secondary",
      daily: "primary",
      weekly: "info",
      monthly: "warning",
    };
    return <Badge bg={colors[frequency]}>{frequency}</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Reminders</h2>
        <Form.Select
          style={{ width: "200px" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Reminders</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </Form.Select>
      </div>

      {reminders.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <p className="text-muted">No reminders found</p>
            <p className="small">
              Create reminders from your notes by selecting text and choosing
              &quot;Create Reminder&quot;
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="row">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="col-md-6 col-lg-4 mb-3">
              <Card className={!reminder.is_active ? "opacity-75" : ""}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    {getFrequencyBadge(reminder.frequency)}
                    <Badge bg={reminder.is_active ? "success" : "secondary"}>
                      {reminder.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <Card.Title className="h6">
                    {reminder.description || "No description"}
                  </Card.Title>

                  <Card.Text className="small text-muted mb-2">
                    {reminder.highlighted_text.substring(0, 100)}
                    {reminder.highlighted_text.length > 100 && "..."}
                  </Card.Text>

                  <div className="small mb-3">
                    <div>
                      <strong>Scheduled:</strong>{" "}
                      {formatDate(reminder.scheduled_time)}
                    </div>
                    {reminder.last_sent && (
                      <div>
                        <strong>Last sent:</strong>{" "}
                        {formatDate(reminder.last_sent)}
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <Link href={reminder.note_url} passHref legacyBehavior>
                      <Button size="sm" variant="outline-primary" as="a">
                        View Note
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={
                        reminder.is_active
                          ? "outline-warning"
                          : "outline-success"
                      }
                      onClick={() =>
                        toggleActive(reminder.id, reminder.is_active)
                      }
                    >
                      {reminder.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
