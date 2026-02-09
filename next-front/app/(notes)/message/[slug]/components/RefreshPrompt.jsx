export default function RefreshPrompt({ show }) {
  if (!show) return null;

  return (
    <div
      className="alert alert-warning d-flex align-items-center my-2"
      role="alert"
    >
      <span className="me-2">This note was updated elsewhere.</span>
      <button
        className="btn btn-sm btn-outline-primary ms-auto"
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </div>
  );
}
