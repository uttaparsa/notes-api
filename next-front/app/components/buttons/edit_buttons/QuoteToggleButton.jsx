import React from "react";
import { Button } from "react-bootstrap";

const QuoteToggleButton = ({ onClick, className, width, height }) => {
  return (
    <Button
      variant="outline-secondary"
      onClick={onClick}
      className={className}
      style={{ width, height, fontSize: "20px" }}
      title="Toggle Quote"
    >
      ❝
    </Button>
  );
};

export default QuoteToggleButton;
