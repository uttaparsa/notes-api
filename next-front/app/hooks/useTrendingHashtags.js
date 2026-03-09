"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../lib/api";

export function useTrendingHashtags({
  selectedWorkspace = null,
  selectedWorkspaceSlug = null,
  enabled = true,
}) {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const workspaceSlug = selectedWorkspaceSlug || selectedWorkspace?.slug || null;

  const fetchHashtags = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (workspaceSlug) {
        params.append("workspace", workspaceSlug);
      }
      const qs = params.toString();
      const url = `/api/note/hashtags/trending/${qs ? `?${qs}` : ""}`;
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch trending hashtags");
      const data = await response.json();
      setHashtags(data);
    } catch (err) {
      console.error("Error fetching trending hashtags:", err);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchHashtags();
  }, [fetchHashtags, enabled]);

  return { hashtags, loading };
}
