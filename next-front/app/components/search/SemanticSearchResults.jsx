"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, ProgressBar } from "react-bootstrap";
import NoteList from "../NoteList";
import { fetchWithAuth } from "../../lib/api";

export default function SemanticSearchResults({
  searchText,
  onUpdateNote,
  onDeleteNote,
  refreshNotes,
  showHidden,
  listSlug,
  hasFiles,
}) {
  const [semanticResults, setSemanticResults] = useState([]);
  const [showSemanticResults, setShowSemanticResults] = useState(false);
  const [isSemanticLoading, setIsSemanticLoading] = useState(false);
  const [semanticProgress, setSemanticProgress] = useState(0);
  const [semanticElapsedTime, setSemanticElapsedTime] = useState(0);
  const semanticTimerRef = useRef(null);

  const getSemanticResults = useCallback(async (query) => {
    if (!query || query.trim().length < 3) return;

    setIsSemanticLoading(true);
    setSemanticResults([]);
    setShowSemanticResults(false);
    setSemanticProgress(0);
    setSemanticElapsedTime(0);

    // Start progress timer
    semanticTimerRef.current = setInterval(() => {
      setSemanticElapsedTime((prev) => {
        const newTime = prev + 1;
        // Progress increases slower over time, maxing at 90% until completion
        const progress = Math.min(90, (newTime / 30) * 100); // 30 seconds for 90%
        setSemanticProgress(progress);
        return newTime;
      });
    }, 1000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const body = {
        text: query,
        limit: 20,
        has_files: hasFiles,
      };

      if (listSlug) {
        body.list_slug = listSlug;
      }

      const response = await fetchWithAuth(
        "/api/note/similar/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
        60000,
      );

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Failed to fetch semantic results");
      const data = await response.json();
      setSemanticResults(data);
      setSemanticProgress(100); // Complete
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Semantic search timed out");
      } else {
        console.error(`Semantic search error: ${err}`);
      }
      // Don't show error to user for semantic search, it's optional
    } finally {
      setIsSemanticLoading(false);
      if (semanticTimerRef.current) {
        clearInterval(semanticTimerRef.current);
        semanticTimerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    getSemanticResults(searchText);
  }, [searchText, listSlug, getSemanticResults]);

  useEffect(() => {
    return () => {
      if (semanticTimerRef.current) {
        clearInterval(semanticTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {semanticResults.length > 0 && !showSemanticResults && (
        <Button
          variant="outline-primary"
          onClick={() => setShowSemanticResults(true)}
          className="w-100"
        >
          Show Similar Notes ({semanticResults.length})
        </Button>
      )}
      {isSemanticLoading && (
        <div className="mt-2">
          <div className="text-muted small mb-1">
            Finding similar notes... {semanticElapsedTime}s
          </div>
          <ProgressBar
            now={semanticProgress}
            className="mb-2"
            style={{ height: "6px" }}
            variant="info"
          />
        </div>
      )}
      {showSemanticResults && semanticResults.length > 0 && (
        <div className="mt-5 pt-4 border-top">
          <h4 className="mb-3">Similar Notes</h4>

          <NoteList
            notes={semanticResults.map((result) => ({
              ...result,
              list: result.category.id,
              archived: false,
              importance: 0,
              similarity_score: result.similarity_score,
            }))}
            isBusy={false}
            showHidden={showHidden}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            refreshNotes={refreshNotes}
          />
        </div>
      )}
    </>
  );
}
