import React from "react";
import { Button } from "react-bootstrap";

const SplitViewToggleButton = ({ isSplitView, onToggle }) => {
  return (
    <Button
      variant="outline-secondary"
      size="sm"
      className="d-none d-lg-inline-block"
      onClick={onToggle}
      title={isSplitView ? "Single pane" : "Side by side"}
    >
      {isSplitView ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
          <path d="M8 1v14" stroke="currentColor" strokeWidth="1" />
        </svg>
      )}
    </Button>
  );
};

export default SplitViewToggleButton;
