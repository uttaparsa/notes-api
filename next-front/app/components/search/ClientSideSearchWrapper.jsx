"use client";

import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormCheck, Row, Col, Button, ProgressBar } from "react-bootstrap";
import NoteList from "../NoteList";
import SearchBar from "./SearchBar";
import SemanticSearchResults from "./SemanticSearchResults";
import PaginationComponent from "../PaginationComponent";
import CategoryFilterModal from "./CategoryFilterModal";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import { SelectedWorkspaceContext } from "../../(notes)/layout";

export default function ClientSideSearchWrapper() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [hasFiles, setHasFiles] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const perPage = 20;
  const getRecordsRef = useRef();
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) : 1;
  });

  const getRecords = useCallback(
    async (query, page) => {
      setIsBusy(true);
      try {
        let url = `/api/note/search/?q=${encodeURIComponent(query || "")}&show_hidden=${showHidden}&has_files=${hasFiles}`;

        if (selectedCategories.length > 0) {
          url += `&list_slug=${encodeURIComponent(selectedCategories.join(","))}`;
        }

        if (workspaceSlug) {
          url += `&workspace=${encodeURIComponent(workspaceSlug)}`;
        } else if (selectedWorkspace && selectedWorkspace.slug) {
          url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
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
    [
      showHidden,
      hasFiles,
      selectedCategories,
      workspaceSlug,
      selectedWorkspace,
    ],
  );

  useEffect(() => {
    getRecordsRef.current = getRecords;
  }, [getRecords]);

  const handleFiltersChangeFromModal = useCallback(
    ({ categories, hasFiles: newHasFiles }) => {
      setSelectedCategories(categories);
      setHasFiles(newHasFiles);
      setCurrentPage(1);

      let url = `/search/?q=${encodeURIComponent(searchText || "")}`;
      if (categories.length > 0) {
        url += `&list_slug=${encodeURIComponent(categories.join(","))}`;
      }
      if (newHasFiles) {
        url += `&has_files=true`;
      }
      if (workspaceSlug || (selectedWorkspace && selectedWorkspace.slug)) {
        url += `&workspace=${encodeURIComponent(workspaceSlug || selectedWorkspace.slug)}`;
      }
      router.push(url);
    },
    [searchText, router, workspaceSlug, selectedWorkspace],
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
    getRecordsRef.current(searchText, currentPage);
  };

  useEffect(() => {
    const query = searchParams.get("q");
    const slug = searchParams.get("list_slug") || "";
    const page = searchParams.get("page");
    const hasFilesParam = searchParams.get("has_files") === "true";
    const workspaceParam = searchParams.get("workspace") || "";

    setSearchText(query || "");
    setHasFiles(hasFilesParam);
    setWorkspaceSlug(workspaceParam);

    if (slug) {
      setSelectedCategories(slug.includes(",") ? slug.split(",") : [slug]);
    } else {
      setSelectedCategories([]);
    }

    if (page) {
      setCurrentPage(parseInt(page));
    }

    getRecordsRef.current(query, page || currentPage);
  }, [searchParams, currentPage]);

  const handleSearch = useCallback(
    (newSearchText) => {
      console.log("handleSearch", newSearchText);

      if (newSearchText !== searchText) {
        setSearchText(newSearchText);
        setCurrentPage(1);

        let url = `/search/?q=${encodeURIComponent(newSearchText || "")}`;
        if (selectedCategories.length > 0) {
          url += `&list_slug=${encodeURIComponent(selectedCategories.join(","))}`;
        }
        if (hasFiles) {
          url += `&has_files=true`;
        }
        if (workspaceSlug || (selectedWorkspace && selectedWorkspace.slug)) {
          url += `&workspace=${encodeURIComponent(workspaceSlug || selectedWorkspace.slug)}`;
        }
        router.push(url);
      }
    },
    [
      searchText,
      selectedCategories,
      hasFiles,
      router,
      workspaceSlug,
      selectedWorkspace,
    ],
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    let url = `/search/?q=${encodeURIComponent(searchText)}`;
    if (selectedCategories.length > 0) {
      url += `&list_slug=${encodeURIComponent(selectedCategories.join(","))}`;
    }
    if (hasFiles) {
      url += `&has_files=true`;
    }
    if (workspaceSlug || (selectedWorkspace && selectedWorkspace.slug)) {
      url += `&workspace=${encodeURIComponent(workspaceSlug || selectedWorkspace.slug)}`;
    }
    url += `&page=${newPage}`;
    router.push(url, undefined, { shallow: true });
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
                setShowHidden(e.target.checked);
                setCurrentPage(1);
                getRecordsRef.current(searchText, 1);
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
              refreshNotes={() =>
                getRecordsRef.current(searchText, currentPage)
              }
            />

            <SemanticSearchResults
              searchText={searchText}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              refreshNotes={() =>
                getRecordsRef.current(searchText, currentPage)
              }
              showHidden={showHidden}
              listSlug={
                selectedCategories.length > 0
                  ? selectedCategories.join(",")
                  : ""
              }
              hasFiles={hasFiles}
            />
          </Col>
        </Row>
      </div>

      {/* Floating Action Button for Category Filter */}
      <Button
        variant="primary"
        className="position-fixed bottom-0 end-0 m-3 rounded-circle"
        style={{ width: "56px", height: "56px", zIndex: 1050 }}
        onClick={() => setShowCategoryModal(true)}
        title="Filter by Categories"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          className="bi bi-funnel-fill"
          viewBox="0 0 16 16"
        >
          <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2.05a2.5 2.5 0 0 1 0 4.9v2.05a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-2.05a2.5 2.5 0 0 1 0-4.9V1.5z" />
        </svg>
      </Button>

      <CategoryFilterModal
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        selectedCategories={selectedCategories}
        hasFiles={hasFiles}
        onFiltersChange={handleFiltersChangeFromModal}
      />
    </div>
  );
}
