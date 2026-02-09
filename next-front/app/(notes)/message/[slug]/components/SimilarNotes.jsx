import Link from "next/link";
import { Badge } from "react-bootstrap";
import { CompactMarkdownRenderer } from "../../../../components/notecard/markdown/MarkdownRenderers";

export default function SimilarNotes({ notes, loaded }) {
  if (!notes || notes.length === 0) return null;

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

        .similar-note-item {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .similar-note-item:hover {
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

        .similar-card {
          border-radius: 12px;
          padding: 1rem;
          background: var(--bs-body-bg);
          border: 1px solid var(--bs-border-color);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .similar-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: var(--border-color);
          border-radius: 12px 0 0 12px;
        }

        .similar-card.high-similarity::before {
          background: linear-gradient(180deg, #198754 0%, #20c997 100%);
        }

        .similar-card.medium-similarity::before {
          background: linear-gradient(180deg, #0d6efd 0%, #6610f2 100%);
        }

        .similar-card.low-similarity::before {
          background: linear-gradient(180deg, #6c757d 0%, #adb5bd 100%);
        }

        .note-content {
          padding-left: 0.5rem;
        }
      `}</style>

      <div className="section-header">Related Notes</div>
      <div className="d-flex flex-column gap-3">
        {notes.map((similarNote, index) => {
          const distanceClass =
            similarNote.distance < 1
              ? "high-similarity"
              : similarNote.distance < 2
                ? "medium-similarity"
                : "low-similarity";

          return (
            <Link
              href={`/message/${similarNote.id}`}
              key={similarNote.id}
              className="text-decoration-none"
            >
              <div
                className={`similar-card similar-note-item ${distanceClass}`}
                style={{
                  animationDelay: loaded ? `${index * 0.1}s` : "0s",
                }}
              >
                <div className="note-content">
                  <div className="small mb-2">
                    <CompactMarkdownRenderer>
                      {similarNote.text}
                    </CompactMarkdownRenderer>
                  </div>
                  <div className="d-flex justify-content-end">
                    <Badge bg="secondary" className="text-white">
                      {similarNote.category.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
