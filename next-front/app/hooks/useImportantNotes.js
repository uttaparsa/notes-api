"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";

const DISPLAY_MODE_KEY = "importantNotesDisplayMode";

export const DISPLAY_MODES = {
  SIDEBAR: "sidebar",
  CENTER: "center",
};

export function useImportantNotesDisplayMode() {
  const [displayMode, setDisplayMode] = useState(DISPLAY_MODES.SIDEBAR);

  useEffect(() => {
    const stored = localStorage.getItem(DISPLAY_MODE_KEY);
    if (stored === DISPLAY_MODES.CENTER || stored === DISPLAY_MODES.SIDEBAR) {
      setDisplayMode(stored);
    }
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => {
      const next =
        prev === DISPLAY_MODES.SIDEBAR
          ? DISPLAY_MODES.CENTER
          : DISPLAY_MODES.SIDEBAR;
      localStorage.setItem(DISPLAY_MODE_KEY, next);
      return next;
    });
  }, []);

  return { displayMode, toggleDisplayMode };
}

export function useImportantNotes({
  listSlug = null,
  selectedWorkspace = null,
  showHidden = true,
}) {
  const [importantNotes, setImportantNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchImportantNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const slug = listSlug || "All";
      const params = new URLSearchParams();
      if (selectedWorkspace) {
        params.append("workspace", selectedWorkspace.slug);
      }
      params.append("show_hidden", showHidden ? "true" : "false");
      const queryString = params.toString();
      const url = `/api/note/important/${slug}/${queryString ? `?${queryString}` : ""}`;
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch important notes");
      const data = await response.json();
      setImportantNotes(data);
    } catch (err) {
      console.error("Error fetching important notes:", err);
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  }, [listSlug, selectedWorkspace, showHidden]);

  useEffect(() => {
    fetchImportantNotes();
  }, [fetchImportantNotes]);

  useEffect(() => {
    const handler = () => fetchImportantNotes();
    window.addEventListener("refreshImportantNotes", handler);
    return () => window.removeEventListener("refreshImportantNotes", handler);
  }, [fetchImportantNotes]);

  return { importantNotes, isLoading, refetch: fetchImportantNotes };
}
