import { Button } from 'react-bootstrap';

const RtlToggleButton = ({ onClick, isRTL = false, size = "sm", className = "", width = '20px', height = '20px' }) => {
  return (
    <Button
      variant="outline-secondary"
      size={size}
      className={className}
      onClick={onClick}
    >
      {/* RTL toggle icons */}
      <span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 0 24 24"
          width={width}
          className="rtl-icon"
          style={{
            display: isRTL ? "none" : "block",
            fill: "var(--bs-body-color)",
          }}
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M10 10v5h2V4h2v11h2V4h2V2h-8C7.79 2 6 3.79 6 6s1.79 4 4 4zm-2 7v-3l-4 4 4 4v-3h12v-2H8z" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={height}
          viewBox="0 0 24 24"
          width={width}
          className="ltr-icon"
          style={{
            display: isRTL ? "block" : "none",
            fill: "var(--bs-body-color)",
          }}
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z" />
        </svg>
      </span>
    </Button>
  );
};

export default RtlToggleButton;
