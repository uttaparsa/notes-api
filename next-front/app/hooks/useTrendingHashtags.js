"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../lib/api";

export function useTrendingHashtags({ selectedWorkspace = null }) {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHashtags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWorkspace) {
        params.append("workspace", selectedWorkspace.slug);
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
  }, [selectedWorkspace]);

  useEffect(() => {
    fetchHashtags();
  }, [fetchHashtags]);

  return { hashtags, loading };
}
