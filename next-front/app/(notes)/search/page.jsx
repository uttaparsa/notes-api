"use client";

import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormCheck, Row, Col, Button } from "react-bootstrap";
import NoteList from "../../components/NoteList";
import SearchBar from "../../components/search/SearchBar";
import SemanticSearchResults from "../../components/search/SemanticSearchResults";
import PaginationComponent from "../../components/PaginationComponent";
import CategoryFilterModal from "../../components/search/CategoryFilterModal";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import { SelectedWorkspaceContext } from "../layout";

export default function SearchPage() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [hasFiles, setHasFiles] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const perPage = 20;
  const getRecordsRef = useRef();
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) : 1;
  });

  const getRecords = useCallback(
    async (query, page) => {
      setIsBusy(true);
      try {
        const categorySlugs =
          selectedCategories.length > 0 ? selectedCategories.join(",") : "";
        let url = `/api/note/search/?q=${encodeURIComponent(query || "")}&show_hidden=${showHidden}&has_files=${hasFiles}`;

        if (categorySlugs) {
          url += `&list_slug=${encodeURIComponent(categorySlugs)}`;
        }

        if (selectedWorkspace?.slug) {
          url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
        }

        url += `&page=${page}`;
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
    [showHidden, hasFiles, selectedCategories, selectedWorkspace],
  );

  useEffect(() => {
    getRecordsRef.current = getRecords;
  }, [getRecords]);

  const handleFiltersChangeFromModal = useCallback(
    ({ categories, hasFiles: newHasFiles }) => {
      setSelectedCategories(categories);
      setHasFiles(newHasFiles);
      setCurrentPage(1);

      const categorySlugs = categories.length > 0 ? categories.join(",") : "";
      let url = `/search/?q=${encodeURIComponent(searchText || "")}`;
      if (categorySlugs) {
        url += `&list_slug=${encodeURIComponent(categorySlugs)}`;
      }
      if (newHasFiles) {
        url += `&has_files=true`;
      }
      if (selectedWorkspace?.slug) {
        url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
      }
      router.push(url);
    },
    [searchText, router, selectedWorkspace],
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
    if (searchParams.has("q") || slug || hasFilesParam) {
      setSearchText(query);
      setHasFiles(hasFilesParam);
      if (slug) {
        if (slug.includes(",")) {
          setSelectedCategories(slug.split(","));
        } else {
          setSelectedCategories([slug]);
        }
      } else {
        // Default to workspace categories if no specific categories selected
        if (selectedWorkspace && selectedWorkspace.categories) {
          const workspaceCategorySlugs = selectedWorkspace.categories.map(
            (cat) => cat.slug,
          );
          setSelectedCategories(workspaceCategorySlugs);
        } else {
          setSelectedCategories([]);
        }
      }
      if (page) {
        setCurrentPage(parseInt(page));
      }
      getRecordsRef.current(query, page || currentPage);
    } else {
      // Initialize with workspace categories if available
      if (selectedWorkspace && selectedWorkspace.categories) {
        setSelectedCategories(
          selectedWorkspace.categories.map((cat) => cat.slug),
        );
      }
    }
  }, [searchParams, selectedWorkspace]);

  const handleSearch = useCallback(
    (newSearchText) => {
      if (newSearchText !== searchText) {
        setSearchText(newSearchText);
        setCurrentPage(1);

        const categorySlugs =
          selectedCategories.length > 0 ? selectedCategories.join(",") : "";
        let url = `/search/?q=${encodeURIComponent(newSearchText || "")}`;
        if (categorySlugs) {
          url += `&list_slug=${encodeURIComponent(categorySlugs)}`;
        }
        if (hasFiles) {
          url += `&has_files=true`;
        }
        if (selectedWorkspace?.slug) {
          url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
        }
        router.push(url);
      }
    },
    [searchText, selectedCategories, hasFiles, router, selectedWorkspace],
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    let url = `/search/?q=${encodeURIComponent(searchText)}`;
    const categorySlugs =
      selectedCategories.length > 0 ? selectedCategories.join(",") : "";
    if (categorySlugs) {
      url += `&list_slug=${encodeURIComponent(categorySlugs)}`;
    }
    if (hasFiles) {
      url += `&has_files=true`;
    }
    if (selectedWorkspace?.slug) {
      url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
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
