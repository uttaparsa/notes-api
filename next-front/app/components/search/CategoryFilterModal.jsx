"use client";

import { useState, useEffect, useContext } from "react";
import { Modal, Button, Form, Collapse } from "react-bootstrap";
import { NoteListContext } from "../../(notes)/layout";
import { SelectedWorkspaceContext } from "../../(notes)/layout";

export default function CategoryFilterModal({
  show,
  onHide,
  selectedCategories,
  onCategoriesChange,
  hasFiles,
  onHasFilesChange,
  onFiltersChange,
}) {
  const noteLists = useContext(NoteListContext);
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const [localSelectedCategories, setLocalSelectedCategories] = useState(
    new Set(selectedCategories),
  );
  const [showNonWorkspaceCategories, setShowNonWorkspaceCategories] =
    useState(false);
  const [localHasFiles, setLocalHasFiles] = useState(hasFiles);

  useEffect(() => {
    setLocalSelectedCategories(new Set(selectedCategories));
  }, [selectedCategories]);

  useEffect(() => {
    setLocalHasFiles(hasFiles);
  }, [hasFiles]);

  const handleCategoryToggle = (slug) => {
    const newSelected = new Set(localSelectedCategories);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setLocalSelectedCategories(newSelected);
  };

  const selectAll = () => {
    if (noteLists) {
      setLocalSelectedCategories(new Set(noteLists.map((list) => list.slug)));
    }
  };

  const deselectAll = () => {
    setLocalSelectedCategories(new Set());
  };

  const handleApply = () => {
    if (onFiltersChange) {
      onFiltersChange({
        categories: Array.from(localSelectedCategories),
        hasFiles: localHasFiles,
      });
    } else {
      onCategoriesChange(Array.from(localSelectedCategories));
      onHasFilesChange(localHasFiles);
    }
    onHide();
  };

  // Separate categories into workspace and non-workspace
  const workspaceCategorySlugs = selectedWorkspace
    ? selectedWorkspace.categories.map((cat) => cat.slug)
    : [];
  const workspaceCategories =
    noteLists?.filter((list) => workspaceCategorySlugs.includes(list.slug)) ||
    [];
  const nonWorkspaceCategories =
    noteLists?.filter((list) => !workspaceCategorySlugs.includes(list.slug)) ||
    [];

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Filter by Categories</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between mb-3">
          <Button variant="outline-primary" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
        </div>
        <div className="mb-3">
          {selectedWorkspace && selectedWorkspace.categories ? (
            <>
              {/* Workspace Categories */}
              {workspaceCategories.map((list) => (
                <Form.Check
                  key={list.slug}
                  type="checkbox"
                  id={`modal-category-${list.slug}`}
                  label={list.name}
                  checked={localSelectedCategories.has(list.slug)}
                  onChange={() => handleCategoryToggle(list.slug)}
                  className="mb-2"
                />
              ))}

              {/* Non-Workspace Categories */}
              {nonWorkspaceCategories.length > 0 && (
                <div className="mt-3">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() =>
                      setShowNonWorkspaceCategories(!showNonWorkspaceCategories)
                    }
                    className="p-0 mb-2 text-decoration-none"
                  >
                    {showNonWorkspaceCategories ? "▼" : "▶"} Other Categories (
                    {nonWorkspaceCategories.length})
                  </Button>
                  <Collapse in={showNonWorkspaceCategories}>
                    <div>
                      {nonWorkspaceCategories.map((list) => (
                        <Form.Check
                          key={list.slug}
                          type="checkbox"
                          id={`modal-category-${list.slug}`}
                          label={list.name}
                          checked={localSelectedCategories.has(list.slug)}
                          onChange={() => handleCategoryToggle(list.slug)}
                          className="mb-2"
                        />
                      ))}
                    </div>
                  </Collapse>
                </div>
              )}
            </>
          ) : (
            // If no workspace, show all categories
            noteLists?.map((list) => (
              <Form.Check
                key={list.slug}
                type="checkbox"
                id={`modal-category-${list.slug}`}
                label={list.name}
                checked={localSelectedCategories.has(list.slug)}
                onChange={() => handleCategoryToggle(list.slug)}
                className="mb-2"
              />
            ))
          )}
        </div>
        <div className="mb-3">
          <Form.Check
            type="checkbox"
            id="modal-has-files"
            label="Only notes with files"
            checked={localHasFiles}
            onChange={(e) => setLocalHasFiles(e.target.checked)}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApply}>
          Apply Filters
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
