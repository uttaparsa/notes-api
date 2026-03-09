"use client";

import React, { useState, useRef, forwardRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { fetchWithAuth } from "../../lib/api";

const QUICK_PICKS = [
  { label: "In 1 h", getValue: () => moment().add(1, "hour").toDate() },
  {
    label: "Tonight 8 pm",
    getValue: () => moment().hour(20).minute(0).second(0).toDate(),
  },
  {
    label: "Tomorrow 9 am",
    getValue: () => moment().add(1, "day").hour(9).minute(0).second(0).toDate(),
  },
  {
    label: "Next Mon",
    getValue: () =>
      moment()
        .add(1, "week")
        .isoWeekday(1)
        .hour(9)
        .minute(0)
        .second(0)
        .toDate(),
  },
];

const FREQUENCY_OPTIONS = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const DateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <Form.Control
    ref={ref}
    value={value}
    onClick={onClick}
    onChange={() => {}}
    placeholder={placeholder}
    readOnly
    style={{ cursor: "pointer" }}
  />
));
DateInput.displayName = "DateInput";

export default function ReminderModal({ show, onHide, note, showToast }) {
  const [description, setDescription] = useState("");
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [frequency, setFrequency] = useState("once");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const textAreaRef = useRef(null);

  const handleSelect = (e) => {
    setSelectionRange({
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const hasSelection = selectionRange.end > selectionRange.start;
      const scheduledTime =
        moment(scheduledDateTime).format("YYYY-MM-DDTHH:mm");

      const reminderData = {
        note: note.id,
        description: description,
        scheduled_time: scheduledTime,
        frequency: frequency,
        highlight_start: hasSelection ? selectionRange.start : null,
        highlight_end: hasSelection ? selectionRange.end : null,
        is_active: true,
      };

      const response = await fetchWithAuth("/api/note/reminders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Failed to create reminder";
        if (typeof errorData === "object") {
          errorMessage = Object.entries(errorData)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
            )
            .join("\n");
        }
        throw new Error(errorMessage);
      }

      showToast("Success", "Reminder created successfully", 3000, "success");
      onHide();

      setDescription("");
      setScheduledDateTime(null);
      setFrequency("once");
      setSelectionRange({ start: 0, end: 0 });
    } catch (error) {
      console.error("Error creating reminder:", error);
      showToast("Error", error.message, 5000, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedText = note.text.substring(
    selectionRange.start,
    selectionRange.end,
  );

  return (
    <>
      <style>{`
        .reminder-datepicker-popper { z-index: 9999 !important; }
        .react-datepicker { font-family: inherit; border-radius: 0.375rem; }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected { background-color: #0d6efd !important; color: #fff !important; }
        .react-datepicker__day--selected:hover,
        .react-datepicker__day--keyboard-selected:hover { background-color: #0b5ed7 !important; }
        .react-datepicker__time-container { width: 120px; }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box { width: 120px; }
        .react-datepicker__time-list-item--selected { background-color: #0d6efd !important; color: #fff !important; }
        .react-datepicker__time-list-item--selected:hover { background-color: #0b5ed7 !important; }

        [data-bs-theme=dark] .react-datepicker {
          background-color: #212529;
          border-color: #495057;
          color: #dee2e6;
        }
        [data-bs-theme=dark] .react-datepicker__header {
          background-color: #343a40;
          border-bottom-color: #495057;
        }
        [data-bs-theme=dark] .react-datepicker__current-month,
        [data-bs-theme=dark] .react-datepicker__day-name,
        [data-bs-theme=dark] .react-datepicker-time__header,
        [data-bs-theme=dark] .react-datepicker__day {
          color: #dee2e6;
        }
        [data-bs-theme=dark] .react-datepicker__day:hover {
          background-color: #495057;
        }
        [data-bs-theme=dark] .react-datepicker__day--outside-month {
          color: #6c757d;
        }
        [data-bs-theme=dark] .react-datepicker__day--disabled {
          color: #495057;
        }
        [data-bs-theme=dark] .react-datepicker__navigation-icon::before {
          border-color: #adb5bd;
        }
        [data-bs-theme=dark] .react-datepicker__time-container {
          border-left-color: #495057;
        }
        [data-bs-theme=dark] .react-datepicker__time-container .react-datepicker__time {
          background-color: #212529;
        }
        [data-bs-theme=dark] .react-datepicker__time-list-item {
          color: #dee2e6;
        }
        [data-bs-theme=dark] .react-datepicker__time-list-item:hover {
          background-color: #495057 !important;
        }
        [data-bs-theme=dark] .react-datepicker__header--time {
          background-color: #343a40;
          border-bottom-color: #495057;
        }
      `}</style>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Reminder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select text to highlight (optional)</Form.Label>
              <Form.Control
                as="textarea"
                ref={textAreaRef}
                rows={6}
                value={note.text}
                readOnly
                onSelect={handleSelect}
                className="font-monospace"
                style={{ fontSize: "0.9rem", cursor: "text" }}
              />
              <Form.Text className="text-muted">
                Click and drag to select the part of the note you want to be
                reminded about.
              </Form.Text>
            </Form.Group>

            {selectionRange.end > selectionRange.start && (
              <div className="mb-3 p-2 bg-light border rounded">
                <small className="d-block text-muted mb-1">
                  Selected Preview:
                </small>
                <div className="text-primary">
                  {selectedText.length > 100
                    ? selectedText.substring(0, 100) + "..."
                    : selectedText}
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
              />
            </Form.Group>

            <div className="row g-3 align-items-end">
              <div className="col-md-8">
                <Form.Group>
                  <Form.Label>When</Form.Label>
                  <div className="mb-2 d-flex flex-wrap gap-1">
                    {QUICK_PICKS.map((qp) => (
                      <Button
                        key={qp.label}
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setScheduledDateTime(qp.getValue())}
                        active={
                          scheduledDateTime &&
                          moment(scheduledDateTime).isSame(
                            qp.getValue(),
                            "minute",
                          )
                        }
                      >
                        {qp.label}
                      </Button>
                    ))}
                  </div>
                  <DatePicker
                    selected={scheduledDateTime}
                    onChange={(date) => setScheduledDateTime(date)}
                    showTimeSelect
                    timeIntervals={1}
                    minDate={new Date()}
                    timeFormat="HH:mm"
                    dateFormat="MMM d, yyyy HH:mm"
                    placeholderText="Pick date & time…"
                    popperClassName="reminder-datepicker-popper"
                    customInput={<DateInput />}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Frequency</Form.Label>
                  <Form.Select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            {scheduledDateTime && (
              <div className="mt-2">
                <small className="text-muted">
                  Reminder set for{" "}
                  {moment(scheduledDateTime).format("dddd, MMMM D [at] h:mm A")}
                </small>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !scheduledDateTime}
          >
            {isSubmitting ? "Creating…" : "Create Reminder"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
