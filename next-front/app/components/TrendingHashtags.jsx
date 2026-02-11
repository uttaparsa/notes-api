"use client";

import Link from "next/link";
import { Badge, Spinner } from "react-bootstrap";

export default function TrendingHashtags({ hashtags, loading }) {
  if (loading) {
    return (
      <div className="text-center py-2">
        <Spinner animation="border" size="sm" className="text-body-secondary" />
      </div>
    );
  }

  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="text-body-secondary small mb-2">Trending Tags</div>
      <div className="d-flex flex-wrap gap-1">
        {hashtags.map(({ tag, count }) => (
          <Link
            key={tag}
            href={`/search?q=${encodeURIComponent("#" + tag)}`}
            style={{ textDecoration: "none" }}
          >
            <Badge
              pill
              bg=""
              className="fw-normal border"
              style={{
                cursor: "pointer",
                fontSize: "0.78rem",
                padding: "0.35em 0.65em",
                backgroundColor: "var(--bs-tertiary-bg)",
                color: "var(--bs-body-color)",
                borderColor: "var(--bs-border-color)",
              }}
            >
              #{tag}
              <span className="ms-1 opacity-50" style={{ fontSize: "0.7rem" }}>
                {count}
              </span>
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
