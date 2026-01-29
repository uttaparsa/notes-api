"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormCheck, Row, Col, Button, ProgressBar } from "react-bootstrap";
import NoteList from "../NoteList";
import SearchBar from "./SearchBar";
import SemanticSearchResults from "./SemanticSearchResults";
import PaginationComponent from "../PaginationComponent";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";

export default function ClientSideSearchWrapper() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [listSlug, setListSlug] = useState("All");
  const router = useRouter();
  const searchParams = useSearchParams();
  const perPage = 20;

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) : 1;
  });

  const getRecords = useCallback(
    async (query, slugs, page) => {
      setIsBusy(true);
      try {
        let url = `/api/note/search/?q=${encodeURIComponent(query || "")}&show_hidden=${showHidden}`;

        if (slugs && slugs !== "All") {
          url += `&list_slug=${encodeURIComponent(slugs)}`;
        }

        url += `&page=${page}`;
        console.log("url", url);
        const response = await fetchWithAuth(url);
        if (!response.ok) throw new Error("Failed to fetch search results");
        const data = await response.json();
        setNotes(data.results);
        setTotalCount(data.count);
      } catch (err) {
        console.error(`Error: ${err}`);
        handleApiError(err);
      } finally {
        setIsBusy(false);
      }
    },
    [showHidden],
  );

  const updateNote = async (noteId, updates) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note,
      ),
    );
  };

  const deleteNote = async (noteId) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    getRecords(searchText, listSlug, currentPage);
  };

  useEffect(() => {
    const query = searchParams.get("q");
    const slug = searchParams.get("list_slug") || "All";
    const page = searchParams.get("page");
    if (query || slug !== "All") {
      setSearchText(query);
      setListSlug(slug);
      if (page) {
        setCurrentPage(parseInt(page));
      }
      // If slug contains commas, split it into an array
      const slugsToSearch = slug.includes(",") ? slug.split(",") : slug;
      console.log("slugsToSearch", slugsToSearch);

      getRecords(query, slugsToSearch, page || currentPage);
    }
  }, [searchParams, getRecords]);

  const handleSearch = useCallback(
    (newSearchText, newListSlugs) => {
      console.log("handleSearch", newSearchText, newListSlugs);

      if (newSearchText !== searchText || newListSlugs !== listSlug) {
        setSearchText(newSearchText);
        setListSlug(newListSlugs);
        setCurrentPage(1);

        let url = `/search/?q=${encodeURIComponent(newSearchText || "")}`;
        if (newListSlugs && newListSlugs !== "All") {
          url += `&list_slug=${encodeURIComponent(newListSlugs)}`;
        }
        router.push(url);
      }
    },
    [searchText, listSlug, router],
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    let url = `/search/?q=${encodeURIComponent(searchText)}`;
    if (listSlug && listSlug !== "All") {
      if (Array.isArray(listSlug)) {
        url += `&list_slug=${encodeURIComponent(listSlug.join(","))}`;
      } else {
        url += `&list_slug=${encodeURIComponent(listSlug)}`;
      }
    }
    url += `&page=${newPage}`;
    router.push(url, undefined, { shallow: true });
  };

  return (
    <div dir="ltr">
      <SearchBar
        onSearch={handleSearch}
        initialSearchText={searchText}
        initialListSlug={listSlug}
      />
      <div dir="ltr">
        <PaginationComponent
          currentPage={currentPage}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={handlePageChange}
        />
        <Row className="m-0 p-0">
          <Col lg={2} className="mx-0 mb-3 mb-lg-0">
            <FormCheck
              type="checkbox"
              id="show-hidden"
              label="Show Hidden"
              checked={showHidden}
              onChange={(e) => {
                setShowHidden(e.target.checked);
                setCurrentPage(1);
                getRecords(searchText, listSlug, 1);
              }}
              className="mb-3 text-body-emphasis mt-2"
            />
          </Col>
          <Col lg={8} className="mx-0 px-3 px-lg-0" dir="ltr">
            <NoteList
              notes={notes}
              isBusy={isBusy}
              showHidden={showHidden}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              refreshNotes={() => getRecords(searchText, listSlug, currentPage)}
            />

            <SemanticSearchResults
              searchText={searchText}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              refreshNotes={() => getRecords(searchText, listSlug, currentPage)}
              showHidden={showHidden}
              listSlug={listSlug}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
