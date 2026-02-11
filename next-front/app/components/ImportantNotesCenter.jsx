"use client";

import React from "react";
import { Spinner } from "react-bootstrap";
import NoteList from "./NoteList";

export default function ImportantNotesCenter({
  importantNotes,
  isLoading,
  showHidden,
  onUpdateNote,
  onDeleteNote,
  refreshNotes,
  onToggleDisplayMode,
}) {
  if (importantNotes.length === 0 && !isLoading) return null;

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center mb-2 gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="currentColor"
          className="bi bi-star-fill me-1 text-warning"
          viewBox="0 0 16 16"
        >
          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
        </svg>
        <span
          className="text-body-secondary"
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Pinned
        </span>
        {onToggleDisplayMode && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            fill="currentColor"
            style={{
              cursor: "pointer",
              opacity: 0.5,
              transition: "opacity 0.2s ease",
            }}
            viewBox="0 0 16 16"
            onClick={onToggleDisplayMode}
            title="Move to sidebar"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
          >
            <path
              fillRule="evenodd"
              d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm11.5 5.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"
            />
          </svg>
        )}
      </div>
      {isLoading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      ) : (
        <NoteList
          notes={importantNotes}
          isBusy={false}
          showHidden={showHidden}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          refreshNotes={refreshNotes}
        />
      )}
      <hr className="text-body-secondary" />
    </div>
  );
}
