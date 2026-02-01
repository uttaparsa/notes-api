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
import { SelectedWorkspaceContext } from "./layout";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [newNoteId, setNewNoteId] = useState(null);
  const [highlightNoteId, setHighlightNoteId] = useState(null);
  const [showCreateCollectionModal, setShowCreateCollectionModal] =
    useState(false);
  const perPage = 20;
  const listSlug = null;

  useEffect(() => {
    const page = searchParams.get("page");
    const highlight = searchParams.get("highlight");
    if (page) {
      setCurrentPage(parseInt(page));
    }
    if (highlight) {
      setHighlightNoteId(highlight);
      // Clear highlight from URL after reading it
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("highlight");
      const newUrl = newParams.toString()
        ? `?${newParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
    getRecords();
  }, [showHidden, selectedWorkspace]);

  useEffect(() => {
    if (currentPage !== 1 || showHidden) {
      // Avoid double call on initial load
      getRecords();
    }
  }, [currentPage]);

  const showMessagesForDate = (selectedDate) => {
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const getRecords = async (selectedDate = null) => {
    setIsBusy(true);
    try {
      let url = `/api/note/feed/`;
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
          setCurrentPage(parseInt(nextPage) - 1);
        } else if (data.previous !== null) {
          const prevPage = new URL(data.previous).searchParams.get("page");
          setCurrentPage(parseInt(prevPage) + 1);
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
      if (selectedWorkspace && selectedWorkspace.categories) {
        // If we have a workspace, include its categories in the search
        const workspaceCategorySlugs = selectedWorkspace.categories
          .map((cat) => cat.slug)
          .join(",");
        url += `&list_slug=${encodeURIComponent(workspaceCategorySlugs)}`;
        url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
      }
      router.push(url);
    },
    [router, selectedWorkspace],
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(`?page=${newPage}`, undefined, { shallow: true });
  };

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
            <FormCheck
              type="checkbox"
              id="show-hidden"
              label="Show Hidden"
              checked={showHidden}
              onChange={(e) => {
                setShowHidden(!showHidden);
                setCurrentPage(1);
              }}
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
              listSlug={listSlug}
              selectedWorkspace={selectedWorkspace}
              showHidden={showHidden}
            />
          </Col>
        </Row>
      </div>
      <MessageInput
        onNoteSaved={addNewNote}
        listSlug={"All"}
        selectedWorkspace={selectedWorkspace}
      />
      <CreateCollectionModal
        show={showCreateCollectionModal}
        onHide={() => setShowCreateCollectionModal(false)}
        onCreated={getRecords}
      />
    </div>
  );
}
