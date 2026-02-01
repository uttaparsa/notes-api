"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { Form, FormCheck, Row, Col, Button } from "react-bootstrap";
import { useRouter, useSearchParams } from "next/navigation";
import NoteList from "../components/NoteList";
import CollectionCard from "../components/CollectionCard";
import CreateCollectionModal from "../components/CreateCollectionModal";
import MessageInput from "../components/MessageInput";
import { fetchWithAuth } from "../lib/api";
import { handleApiError } from "../utils/errorHandler";
import SearchBar from "../components/search/SearchBar";
import PaginationComponent from "../components/PaginationComponent";
import ImportantNotesSidebar from "../components/ImportantNotesSidebar";
import CategorySelector from "../components/CategorySelector";
import { SelectedWorkspaceContext, NoteListContext } from "./layout";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const noteLists = useContext(NoteListContext);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [newNoteId, setNewNoteId] = useState(null);
  const [highlightNoteId, setHighlightNoteId] = useState(null);
  const [showCreateCollectionModal, setShowCreateCollectionModal] =
    useState(false);
  const perPage = 20;

  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedCategorySlug = searchParams.get("category") || null;

  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (highlight) {
      setHighlightNoteId(highlight);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("highlight");
      const newUrl = newParams.toString()
        ? `?${newParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    getRecords();
  }, [currentPage, showHidden, selectedWorkspace, selectedCategorySlug]);

  const showMessagesForDate = (selectedDate) => {
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const getRecords = async (selectedDate = null) => {
    setIsBusy(true);
    try {
      let url = selectedCategorySlug
        ? `/api/note/feed/${selectedCategorySlug}/`
        : `/api/note/feed/`;
      const params = new URLSearchParams({
        page: currentPage,
        archived: showHidden,
        ...(selectedDate && { date: selectedDate }),
        ...(selectedWorkspace && { workspace: selectedWorkspace.slug }),
      });

      const response = await fetchWithAuth(`${url}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch feed");
      const data = await response.json();

      setItems(data.results);
      setTotalCount(data.count);

      if (selectedDate != null) {
        if (data.next !== null) {
          const nextPage = new URL(data.next).searchParams.get("page");
          updateUrlParams({ page: parseInt(nextPage) - 1 });
        } else if (data.previous !== null) {
          const prevPage = new URL(data.previous).searchParams.get("page");
          updateUrlParams({ page: parseInt(prevPage) + 1 });
        }
        if (data.highlight_note_id) {
          setHighlightNoteId(data.highlight_note_id);
        }
      }
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
    } finally {
      setIsBusy(false);
    }
  };

  const updateUrlParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`, undefined, { shallow: true });
  };

  const updateNote = async (noteId, updates) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.type === "note" && item.id === noteId
          ? { ...item, ...updates }
          : item,
      ),
    );
  };

  const deleteNote = async (noteId) => {
    setItems((prevItems) =>
      prevItems.filter((item) => !(item.type === "note" && item.id === noteId)),
    );
  };

  const deleteCollection = async (collectionId) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.type === "collection" && item.id === collectionId),
      ),
    );
  };

  const addNewNote = (note) => {
    const noteWithType = { ...note, type: "note" };
    setItems((prevItems) => [noteWithType, ...prevItems]);
    setNewNoteId(note.id);

    setTimeout(() => setNewNoteId(null), 2000);
  };

  const handleSearch = useCallback(
    (newSearchText, newListSlugs) => {
      let url = `/search/?q=${encodeURIComponent(newSearchText || "")}`;
      if (selectedCategorySlug) {
        url += `&list_slug=${encodeURIComponent(selectedCategorySlug)}`;
      } else if (selectedWorkspace && selectedWorkspace.categories) {
        const workspaceCategorySlugs = selectedWorkspace.categories
          .map((cat) => cat.slug)
          .join(",");
        url += `&list_slug=${encodeURIComponent(workspaceCategorySlugs)}`;
      }
      if (selectedWorkspace) {
        url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
      }
      router.push(url);
    },
    [router, selectedWorkspace, selectedCategorySlug],
  );

  const handlePageChange = (newPage) => {
    updateUrlParams({ page: newPage });
  };

  const handleCategoryChange = (categorySlug) => {
    updateUrlParams({ category: categorySlug, page: 1 });
  };

  useEffect(() => {
    const selectedList = selectedCategorySlug
      ? noteLists.find((lst) => lst.slug === selectedCategorySlug)
      : null;
    if (selectedList) {
      document.title = `${selectedList.name} - Notes`;
    } else {
      document.title = "Feed - Notes";
    }
  }, [selectedCategorySlug, noteLists]);

  return (
    <div dir="ltr" style={{ minHeight: "100vh", overflow: "auto" }}>
      <SearchBar onSearch={handleSearch} />
      <div dir="ltr">
        <PaginationComponent
          currentPage={currentPage}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={handlePageChange}
        />

        <Row className="m-0 p-0">
          <Col xs={12} lg={2} className="mx-0 mb-3 mb-lg-0 order-2 order-lg-1">
            <CategorySelector
              selectedSlug={selectedCategorySlug}
              onSelectCategory={handleCategoryChange}
            />
            <FormCheck
              type="checkbox"
              id="show-hidden"
              label="Show Hidden"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              className="mb-3 text-body-emphasis mt-2"
            />
            <Form.Group>
              <Form.Label className="text-body-secondary small">
                Show messages for
              </Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => showMessagesForDate(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col
            xs={12}
            lg={8}
            className="mx-0 px-3 px-lg-0 order-3 order-lg-2"
            dir="ltr"
          >
            {isBusy ? (
              <div className="text-center py-5">Loading...</div>
            ) : (
              items.map((item) =>
                item.type === "collection" ? (
                  <CollectionCard
                    key={`collection-${item.id}`}
                    collection={item}
                    onDeleteCollection={deleteCollection}
                    refreshCollections={getRecords}
                  />
                ) : (
                  <NoteList
                    key={`note-${item.id}`}
                    notes={[item]}
                    isBusy={false}
                    showHidden={showHidden}
                    onUpdateNote={updateNote}
                    onDeleteNote={deleteNote}
                    refreshNotes={getRecords}
                    newNoteId={newNoteId}
                    highlightNoteId={highlightNoteId}
                  />
                ),
              )
            )}
          </Col>
          <Col xs={12} lg={2} className="mb-3 mb-lg-0 order-1 order-lg-3">
            <Button
              variant="outline-primary"
              className="w-100 mb-3"
              onClick={() => setShowCreateCollectionModal(true)}
            >
              + New Collection
            </Button>
            <ImportantNotesSidebar
              listSlug={selectedCategorySlug}
              selectedWorkspace={selectedWorkspace}
              showHidden={showHidden}
              basePath="/"
            />
          </Col>
        </Row>
      </div>
      <MessageInput
        onNoteSaved={addNewNote}
        listSlug={selectedCategorySlug || "All"}
        selectedWorkspace={selectedWorkspace}
      />
      <CreateCollectionModal
        show={showCreateCollectionModal}
        onHide={() => setShowCreateCollectionModal(false)}
        defaultCategory={
          selectedCategorySlug
            ? noteLists.find((lst) => lst.slug === selectedCategorySlug)?.id
            : null
        }
        onCreated={getRecords}
      />
    </div>
  );
}
