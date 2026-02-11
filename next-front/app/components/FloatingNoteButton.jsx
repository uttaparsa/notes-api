"use client";

import { Button } from "react-bootstrap";
import NewIcon from "./icons/NewIcon";

export default function FloatingNoteButton({
  onClick,
  justSent = false,
  inline = false,
}) {
  return (
    <>
      <Button
        onClick={onClick}
        className={`shadow-lg ${justSent ? "just-sent" : ""}`}
        style={{
          ...(inline
            ? {}
            : {
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 1050,
              }),
          borderRadius: "50px",
          padding: "12px 20px",
          fontSize: "16px",
          fontWeight: "500",
          transition: "all 0.3s ease",
          animation: justSent ? "successPulse 0.6s ease-out" : "none",
        }}
      >
        <NewIcon />
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
