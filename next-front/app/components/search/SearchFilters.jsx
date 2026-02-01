"use client";

import { useState, useEffect, useContext } from "react";
import { Button, Form, Collapse } from "react-bootstrap";
import {
  NoteListContext,
  SelectedWorkspaceContext,
} from "../../(notes)/layout";

export default function SearchFilters({
  selectedCategories,
  hasFiles,
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
    }
  };

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
    <div>
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
            {workspaceCategories.map((list) => (
              <Form.Check
                key={list.slug}
                type="checkbox"
                id={`category-${list.slug}`}
                label={list.name}
                checked={localSelectedCategories.has(list.slug)}
                onChange={() => handleCategoryToggle(list.slug)}
                className="mb-2"
              />
            ))}

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
                        id={`category-${list.slug}`}
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
          noteLists?.map((list) => (
            <Form.Check
              key={list.slug}
              type="checkbox"
              id={`category-${list.slug}`}
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
          id="has-files"
          label="Only notes with files"
          checked={localHasFiles}
          onChange={(e) => setLocalHasFiles(e.target.checked)}
        />
      </div>
      <Button variant="primary" onClick={handleApply} className="w-100">
        Apply Filters
      </Button>
    </div>
  );
}
