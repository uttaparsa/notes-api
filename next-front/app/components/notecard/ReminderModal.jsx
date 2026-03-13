"use client";

import React, { useState, useRef, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { fetchWithAuth } from "../../lib/api";
import styles from "./NoteCard.module.css";

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

const DateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
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

/**
 * Selectable text container that works on both desktop and touch devices.
 * Uses the native Selection API instead of textarea selectionStart/End.
 */
export function SelectableTextContainer({
  text,
  selectionRange,
  onSelectionChange,
}) {
  const containerRef = useRef(null);

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const container = containerRef.current;
    if (!container || !container.contains(selection.anchorNode)) return;

    try {
      const range = selection.getRangeAt(0);

      // Compute character offset of the selection start relative to the container
      const preRange = document.createRange();
      preRange.selectNodeContents(container);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const end = start + range.toString().length;

      if (end > start && end <= text.length) {
        onSelectionChange({ start, end });
      }
    } catch {
      // Ignore selection errors (e.g. cross-boundary selections)
    }
  }, [text, onSelectionChange]);

  const selectedText =
    selectionRange.end > selectionRange.start
      ? text.substring(selectionRange.start, selectionRange.end)
      : "";

  return (
    <>
      <div
        ref={containerRef}
        className={styles.selectableTextContainer}
        onMouseUp={captureSelection}
        onTouchEnd={captureSelection}
      >
        {text}
      </div>

      {selectedText && (
        <div className="mt-2 p-2 bg-body-secondary border rounded d-flex justify-content-between align-items-start">
          <div>
            <small className="d-block text-muted mb-1">
              Selected Preview:
            </small>
            <div className="text-primary">
              {selectedText.length > 100
                ? selectedText.substring(0, 100) + "..."
                : selectedText}
            </div>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            className="ms-2 flex-shrink-0"
            onClick={() => {
              onSelectionChange({ start: 0, end: 0 });
              window.getSelection()?.removeAllRanges();
            }}
          >
            ✕
          </Button>
        </div>
      )}
    </>
  );
}

export default function ReminderModal({ show, onHide, note, showToast }) {
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

  // Combine date + time into a single moment for submission
  const getScheduledDateTime = () => {
    if (!scheduledDate || !scheduledTime) return null;
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    return moment(scheduledDate).hour(hours).minute(minutes).second(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const hasSelection = selectionRange.end > selectionRange.start;
      const combinedDateTime = getScheduledDateTime();
      const scheduledTimeStr =
        combinedDateTime.format("YYYY-MM-DDTHH:mm");

      const reminderData = {
        note: note.id,
        description: description,
        scheduled_time: scheduledTimeStr,
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
      setScheduledDate(null);
      setScheduledTime("");
      setFrequency("once");
      setSelectionRange({ start: 0, end: 0 });
    } catch (error) {
      console.error("Error creating reminder:", error);
      showToast("Error", error.message, 5000, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .reminder-datepicker-popper { z-index: 9999 !important; }
        .react-datepicker { font-family: inherit; border-radius: 0.375rem; }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected { background-color: #0d6efd !important; color: #fff !important; }
        .react-datepicker__day--selected:hover,
        .react-datepicker__day--keyboard-selected:hover { background-color: #0b5ed7 !important; }

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
      `}</style>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Reminder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select text to highlight (optional)</Form.Label>
              <SelectableTextContainer
                text={note.text}
                selectionRange={selectionRange}
                onSelectionChange={setSelectionRange}
              />
              <Form.Text className="text-muted">
                Tap and drag to select the part of the note you want to be
                reminded about.
              </Form.Text>
            </Form.Group>

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
                    {QUICK_PICKS.map((qp) => {
                      const qpDate = qp.getValue();
                      return (
                        <Button
                          key={qp.label}
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setScheduledDate(qpDate);
                            setScheduledTime(moment(qpDate).format("HH:mm"));
                          }}
                          active={
                            scheduledDate &&
                            scheduledTime &&
                            moment(scheduledDate).isSame(qpDate, "day") &&
                            scheduledTime === moment(qpDate).format("HH:mm")
                          }
                        >
                          {qp.label}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                      <DatePicker
                        selected={scheduledDate}
                        onChange={(date) => setScheduledDate(date)}
                        minDate={new Date()}
                        dateFormat="MMM d, yyyy"
                        placeholderText="Pick date…"
                        popperClassName="reminder-datepicker-popper"
                        customInput={<DateInput />}
                      />
                    </div>
                    <div style={{ width: "120px" }}>
                      <Form.Control
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
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

            {getScheduledDateTime() && (
              <div className="mt-2">
                <small className="text-muted">
                  Reminder set for{" "}
                  {getScheduledDateTime().format("dddd, MMMM D [at] h:mm A")}
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
            disabled={isSubmitting || !scheduledDate || !scheduledTime}
          >
            {isSubmitting ? "Creating…" : "Create Reminder"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
