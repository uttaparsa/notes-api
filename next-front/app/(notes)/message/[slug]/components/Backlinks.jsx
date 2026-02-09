import Link from "next/link";
import { CompactMarkdownRenderer } from "../../../../components/notecard/markdown/MarkdownRenderers";

export default function Backlinks({ sourceLinks }) {
  if (!sourceLinks || sourceLinks.length === 0) return null;

  return (
    <>
      <style jsx>{`
        .section-header {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          color: var(--bs-secondary);
        }

        .backlink-item {
          border-radius: 8px;
          border-left: 3px solid #6c757d !important;
          padding: 0.75rem;
          transition: all 0.2s ease;
          background: var(--bs-body-bg);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .backlink-item:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div className="section-header">Backlinks</div>
      <div className="d-flex flex-column gap-2 mb-4">
        {sourceLinks.map((link) => (
          <Link
            href={`/message/${link.source_message.id}`}
            key={link.id}
            className="text-decoration-none"
          >
            <div className="backlink-item">
              <div className="small">
                <CompactMarkdownRenderer>
                  {link.source_message.text}
                </CompactMarkdownRenderer>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
