"use client";

import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";
import { CompactMarkdownRenderer } from "./notecard/markdown/MarkdownRenderers";

export default function ImportantNotesSidebar({
  listSlug = null,
  basePath = "",
  selectedWorkspace = null,
  showHidden = true,
}) {
  const [importantNotes, setImportantNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchImportantNotes();
  }, [listSlug, selectedWorkspace, showHidden]);

  useEffect(() => {
    const handleRefreshImportantNotes = () => {
      fetchImportantNotes();
    };

    window.addEventListener(
      "refreshImportantNotes",
      handleRefreshImportantNotes,
    );

    return () => {
      window.removeEventListener(
        "refreshImportantNotes",
        handleRefreshImportantNotes,
      );
    };
  }, []);

  const fetchImportantNotes = async () => {
    setIsLoading(true);
    setLoaded(false);
    try {
      const slug = listSlug || "All";
      const params = new URLSearchParams();
      if (selectedWorkspace) {
        params.append("workspace", selectedWorkspace.slug);
      }
      params.append("show_hidden", showHidden ? "true" : "false");
      const queryString = params.toString();
      const url = `/api/note/important/${slug}/${queryString ? `?${queryString}` : ""}`;
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch important notes");
      const data = await response.json();
      setImportantNotes(data);
      setTimeout(() => setLoaded(true), 50);
    } catch (err) {
      console.error("Error fetching important notes:", err);
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

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

      const targetPath = basePath
        ? `${basePath}?page=${data.page}&highlight=${noteId}`
        : `?page=${data.page}&highlight=${noteId}`;
      router.push(targetPath);
    } catch (err) {
      console.error("Error navigating to note:", err);
      handleApiError(err);
    }
  };

  if (importantNotes.length === 0 && !isLoading) {
    return null;
  }

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

      {/* Desktop header - always visible */}
      <div className="section-header d-none d-lg-block">
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
      </div>

      {/* Mobile header - collapsible */}
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
          {/* Desktop list - always visible */}
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

          {/* Mobile list - collapsible */}
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
