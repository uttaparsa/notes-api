import { Button } from 'react-bootstrap';

const SaveButton = ({ hasUnsavedChanges, onClick, size = "sm", className = "", width = '20px', height = '20px' }) => {
  return (
    <Button
      className={className}
      variant={hasUnsavedChanges ? "outline-warning" : "outline-success"}
      size={size}
      onClick={onClick}
    >
      {/* Save icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={height}
        viewBox="0 0 24 24"
        width={width}
        style={{
          fill: hasUnsavedChanges
            ? "var(--bs-warning)"
            : "var(--bs-success)",
        }}
      >
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm0 16H5V5h11.17L19 7.83V19zm-7-1h2v-6h-2v6zm-4-8h10V7H6v3z" />
      </svg>
    </Button>
  );
};

export default SaveButton;
