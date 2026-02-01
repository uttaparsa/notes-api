"use client";

import { Button } from "react-bootstrap";

export default function FloatingNoteButton({ onClick, justSent = false }) {
  return (
    <>
      <Button
        onClick={onClick}
        className={`shadow-lg ${justSent ? "just-sent" : ""}`}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1050,
          borderRadius: "50px",
          padding: "12px 20px",
          fontSize: "16px",
          fontWeight: "500",
          transition: "all 0.3s ease",
          animation: justSent ? "successPulse 0.6s ease-out" : "none",
        }}
      >
        <svg
          width="32px"
          height="32px"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 6L19 8M14 5.5H5.5V19.5H19.5V11M9 16L9.5 13.5L19 4L21 6L11.5 15.5L9 16Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </Button>

      <style jsx>{`
        @keyframes successPulse {
          0% {
            transform: scale(1);
            background-color: var(--bs-success);
          }
          50% {
            transform: scale(1.05);
            background-color: var(--bs-success);
          }
          100% {
            transform: scale(1);
            background-color: var(--bs-primary);
          }
        }
      `}</style>
    </>
  );
}
