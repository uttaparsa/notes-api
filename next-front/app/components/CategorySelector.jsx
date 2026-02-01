"use client";

import { Form } from "react-bootstrap";
import { useContext } from "react";
import { NoteListContext, SelectedWorkspaceContext } from "../(notes)/layout";

export default function CategorySelector({ selectedSlug, onSelectCategory }) {
  const noteLists = useContext(NoteListContext);
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);

  const availableCategories = selectedWorkspace
    ? noteLists.filter((list) =>
        selectedWorkspace.categories.some((c) => c.id === list.id),
      )
    : noteLists;

  return (
    <Form.Group className="mb-3">
      <Form.Label className="text-body-secondary small">Category</Form.Label>
      <Form.Select
        value={selectedSlug || "All"}
        onChange={(e) =>
          onSelectCategory(e.target.value === "All" ? null : e.target.value)
        }
        className="text-body-emphasis"
      >
        <option value="All">All Categories</option>
        {availableCategories.map((list) => (
          <option key={list.slug} value={list.slug}>
            {list.name}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}
