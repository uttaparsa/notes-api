"use client";

import { Modal } from "react-bootstrap";
import SearchFilters from "./SearchFilters";

export default function CategoryFilterModal({
  show,
  onHide,
  selectedCategories,
  hasFiles,
  onFiltersChange,
}) {
  const handleFiltersChange = (filters) => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Filter by Categories</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <SearchFilters
          selectedCategories={selectedCategories}
          hasFiles={hasFiles}
          onFiltersChange={handleFiltersChange}
        />
      </Modal.Body>
    </Modal>
  );
}
