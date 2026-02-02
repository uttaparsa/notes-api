"use client";

import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormCheck, Row, Col, Button, Card } from "react-bootstrap";
import NoteList from "../../components/NoteList";
import SearchBar from "../../components/search/SearchBar";
import SemanticSearchResults from "../../components/search/SemanticSearchResults";
import PaginationComponent from "../../components/PaginationComponent";
import CategoryFilterModal from "../../components/search/CategoryFilterModal";
import SearchFilters from "../../components/search/SearchFilters";
import FloatingFilterButton from "../../components/FloatingFilterButton";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import { SelectedWorkspaceContext } from "../layout";

export default function SearchPage() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const perPage = 20;
  const getRecordsRef = useRef();
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive all state from URL params as single source of truth
  const searchText = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const showHidden = searchParams.get("show_hidden") === "true";
  const hasFiles = searchParams.get("has_files") === "true";
  const listSlugParam = searchParams.get("list_slug") || "";
  // const workspaceParam = searchParams.get("workspace") || "";

  // Derive list_slug: if workspace is active, use its categories; else use URL param
  const getListSlug = useCallback(() => {
    if (listSlugParam.split(",").length > 0) {
      return listSlugParam;
    } else if (selectedWorkspace?.categories?.length > 0) {
      const slugs = selectedWorkspace.categories
        .map((cat) => (typeof cat === "string" ? cat : cat.slug))
        .join(",");
      return slugs;
    }
    return "";
  }, [selectedWorkspace, listSlugParam]);

  const getRecords = useCallback(async () => {
    const listSlug = getListSlug();
    setIsBusy(true);
    try {
      let url = `/api/note/search/?q=${encodeURIComponent(searchText)}&show_hidden=${showHidden}&has_files=${hasFiles}&page=${currentPage}`;
      if (listSlug) {
        url += `&list_slug=${encodeURIComponent(listSlug)}`;
      }
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
  }, [searchText, showHidden, hasFiles, currentPage, getListSlug]);

  useEffect(() => {
    getRecordsRef.current = getRecords;
  }, [getRecords]);

  // Helper to build full URL with all params
  const buildUrl = useCallback(
    (overrides = {}) => {
      const params = {
        q: overrides.q ?? searchText,
        page: overrides.page ?? currentPage,
        show_hidden: overrides.show_hidden ?? showHidden,
        has_files: overrides.has_files ?? hasFiles,
        list_slug: overrides.list_slug ?? getListSlug(),
      };
      const query = new URLSearchParams(params).toString();
      return `/search/?${query}`;
    },
    [searchText, currentPage, showHidden, hasFiles, getListSlug],
  );

  const handleFiltersChangeFromModal = useCallback(
    ({ categories, hasFiles: newHasFiles }) => {
      const newListSlug = categories.length > 0 ? categories.join(",") : "";
      router.push(
        buildUrl({ list_slug: newListSlug, has_files: newHasFiles, page: 1 }),
      );
    },
    [router, buildUrl],
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
    getRecordsRef.current();
  };

  useEffect(() => {
    if (
      searchText.startsWith("#") &&
      !listSlugParam &&
      selectedWorkspace?.categories?.length > 0
    ) {
      router.replace(
        buildUrl({
          list_slug: selectedWorkspace.categories
            .map((cat) => (typeof cat === "string" ? cat : cat.slug))
            .join(","),
        }),
      );
      return;
    }
    getRecordsRef.current();
  }, [searchParams, searchText, listSlugParam, router, buildUrl]); // Re-run on any param change, handle hashtag URL update and fetch

  const handleSearch = useCallback(
    (newSearchText) => {
      router.push(buildUrl({ q: newSearchText, page: 1 }));
    },
    [router, buildUrl],
  );

  const handlePageChange = (newPage) => {
    router.push(buildUrl({ page: newPage }), undefined, { shallow: true });
  };

  return (
    <div dir="ltr">
      <SearchBar onSearch={handleSearch} initialSearchText={searchText} />
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
                router.push(
                  buildUrl({ show_hidden: e.target.checked, page: 1 }),
                );
              }}
              className="mb-3 text-body-emphasis mt-2"
            />

            <Card className="d-none d-lg-block">
              <Card.Header>
                <strong>Filters</strong>
              </Card.Header>
              <Card.Body>
                <SearchFilters
                  selectedCategories={getListSlug().split(",").filter(Boolean)}
                  hasFiles={hasFiles}
                  onFiltersChange={handleFiltersChangeFromModal}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={8} className="mx-0 px-3 px-lg-0" dir="ltr">
            <NoteList
              notes={notes}
              isBusy={isBusy}
              showHidden={showHidden}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              refreshNotes={() => getRecordsRef.current()}
            />

            <SemanticSearchResults
              searchText={searchText}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              refreshNotes={() => getRecordsRef.current()}
              showHidden={showHidden}
              listSlug={getListSlug()}
              hasFiles={hasFiles}
            />
          </Col>
        </Row>
      </div>

      <FloatingFilterButton onClick={() => setShowCategoryModal(true)} />

      <CategoryFilterModal
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        selectedCategories={getListSlug().split(",").filter(Boolean)}
        hasFiles={hasFiles}
        onFiltersChange={handleFiltersChangeFromModal}
      />
    </div>
  );
}
