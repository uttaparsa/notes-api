"use client";

import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";
import { CompactMarkdownRenderer } from "./notecard/markdown/MarkdownRenderers";
import { DISPLAY_MODES } from "../hooks/useImportantNotes";

export default function ImportantNotesSidebar({
  importantNotes,
  isLoading,
  listSlug = null,
  basePath = "",
  selectedWorkspace = null,
  showHidden = true,
  displayMode = DISPLAY_MODES.SIDEBAR,
  onToggleDisplayMode,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setLoaded(true), 50);
    }
  }, [isLoading]);

  const handleNavigateToNote = async (noteId) => {
    try {
      const params = new URLSearchParams();
      if (listSlug) {
        params.append("slug", listSlug);
      } else if (selectedWorkspace) {
        params.append("workspace", selectedWorkspace.slug);
      }
      params.append("show_hidden", showHidden ? "true" : "false");
      const queryString = params.toString();
      const response = await fetchWithAuth(
        `/api/note/message/${noteId}/page/?${queryString}`,
      );
      if (!response.ok) throw new Error("Failed to get note page");
      const data = await response.json();

      const categoryParam =
        listSlug && listSlug !== "All" ? `&category=${listSlug}` : "";
      const targetPath = basePath
        ? `${basePath}?page=${data.page}${categoryParam}&highlight=${noteId}`
        : `?page=${data.page}${categoryParam}&highlight=${noteId}`;
      router.push(targetPath);
    } catch (err) {
      console.error("Error navigating to note:", err);
      handleApiError(err);
    }
  };

  if (displayMode === DISPLAY_MODES.CENTER) return null;
  if (importantNotes.length === 0 && !isLoading) return null;

  return (
    <>
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .important-note-item {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .important-note-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .section-header {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          color: var(--bs-secondary);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .mode-toggle {
          cursor: pointer;
          transition:
            transform 0.3s ease,
            opacity 0.2s ease;
          margin-left: 0.25rem;
          opacity: 0.5;
        }

        .mode-toggle:hover {
          opacity: 1;
        }

        .section-header-mobile {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .section-header-mobile:hover {
          background: var(--bs-tertiary-bg);
        }

        .collapse-icon {
          transition: transform 0.3s ease;
        }

        .collapse-icon.collapsed {
          transform: rotate(-90deg);
        }

        .important-card {
          border-radius: 12px;
          padding: 1rem;
          background: var(--bs-body-bg);
          border: 1px solid var(--bs-border-color);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .important-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: linear-gradient(180deg, #ffc107 0%, #fd7e14 100%);
          border-radius: 12px 0 0 12px;
        }

        .note-content {
          padding-left: 0.5rem;
        }

        .view-link {
          font-size: 0.75rem;
          color: var(--bs-primary);
          text-decoration: none;
          display: inline-block;
          margin-top: 0.5rem;
        }

        .view-link:hover {
          text-decoration: underline;
        }

        .important-list {
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .important-list.collapsed {
          max-height: 0;
        }

        .important-list.expanded {
          max-height: 2000px;
        }
      `}</style>

      <div className="section-header d-none d-lg-flex">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="currentColor"
          className="bi bi-star-fill me-1"
          viewBox="0 0 16 16"
        >
          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
        </svg>
        Important
        {onToggleDisplayMode && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            fill="currentColor"
            className="mode-toggle"
            viewBox="0 0 16 16"
            onClick={onToggleDisplayMode}
            title="Move to center"
          >
            <path
              fillRule="evenodd"
              d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"
            />
          </svg>
        )}
      </div>

      <div
        className="section-header-mobile d-lg-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            fill="currentColor"
            className="bi bi-star-fill me-1"
            viewBox="0 0 16 16"
          >
            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
          </svg>
          Important ({importantNotes.length})
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className={`bi bi-chevron-down collapse-icon ${isCollapsed ? "collapsed" : ""}`}
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
          />
        </svg>
      </div>

      {isLoading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      ) : (
        <>
          <div className="d-none d-lg-flex flex-column gap-3">
            {importantNotes.map((note, index) => (
              <div
                key={note.id}
                className="important-card important-note-item"
                onClick={() => handleNavigateToNote(note.id)}
                style={{ animationDelay: loaded ? `${index * 0.1}s` : "0s" }}
              >
                <div className="note-content">
                  <div className="small mb-2">
                    <CompactMarkdownRenderer>
                      {note.text}
                    </CompactMarkdownRenderer>
                  </div>
                  <Link
                    href={`/message/${note.id}`}
                    className="view-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View note →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`d-lg-none important-list ${isCollapsed ? "collapsed" : "expanded"}`}
          >
            <div className="d-flex flex-column gap-3">
              {importantNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="important-card important-note-item"
                  onClick={() => handleNavigateToNote(note.id)}
                  style={{
                    animationDelay:
                      loaded && !isCollapsed ? `${index * 0.1}s` : "0s",
                  }}
                >
                  <div className="note-content">
                    <div className="small mb-2">
                      <CompactMarkdownRenderer>
                        {note.text}
                      </CompactMarkdownRenderer>
                    </div>
                    <Link
                      href={`/message/${note.id}`}
                      className="view-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View note →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
