'use client'

import React, { useState, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { fetchWithAuth } from '../../lib/api';

export default function ReminderModal({ show, onHide, note, showToast }) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const textAreaRef = useRef(null);

  const handleSelect = (e) => {
    setSelectionRange({
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const hasSelection = selectionRange.end > selectionRange.start;
      const scheduledTime = `${date}T${time}`;

      const reminderData = {
        note: note.id,
        description: description,
        scheduled_time: scheduledTime,
        frequency: frequency,
        highlight_start: hasSelection ? selectionRange.start : null,
        highlight_end: hasSelection ? selectionRange.end : null,
        is_active: true
      };

      const response = await fetchWithAuth('/api/note/reminders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to create reminder';
        if (typeof errorData === 'object') {
            errorMessage = Object.entries(errorData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('\n');
        }
        throw new Error(errorMessage);
      }

      showToast('Success', 'Reminder created successfully', 3000, 'success');
      onHide();
      
      // Reset form
      setDescription('');
      setDate('');
      setTime('');
      setFrequency('once');
      setSelectionRange({ start: 0, end: 0 });
    } catch (error) {
      console.error('Error creating reminder:', error);
      showToast('Error', error.message, 5000, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedText = note.text.substring(selectionRange.start, selectionRange.end);

  return (
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
              style={{ fontSize: '0.9rem', cursor: 'text' }}
            />
            <Form.Text className="text-muted">
              Click and drag to select the part of the note you want to be reminded about.
            </Form.Text>
          </Form.Group>

          {selectionRange.end > selectionRange.start && (
            <div className="mb-3 p-2 bg-light border rounded">
              <small className="d-block text-muted mb-1">Selected Preview:</small>
              <div className="text-primary">
                {selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}
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

          <div className="row">
            <div className="col-md-5">
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Time</Form.Label>
                <Form.Control
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Frequency</Form.Label>
                <Form.Select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting || !date || !time}
        >
          {isSubmitting ? 'Creating...' : 'Create Reminder'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
