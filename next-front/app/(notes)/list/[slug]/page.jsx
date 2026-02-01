"use client";

import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, FormCheck, Row, Col, Button } from "react-bootstrap";
import NoteList from "../../../components/NoteList";
import CollectionCard from "../../../components/CollectionCard";
import CreateCollectionModal from "../../../components/CreateCollectionModal";
import MessageInput from "../../../components/MessageInput";
import SearchBar from "../../../components/search/SearchBar";
import PaginationComponent from "../../../components/PaginationComponent";
import ImportantNotesSidebar from "../../../components/ImportantNotesSidebar";
import { handleApiError } from "@/app/utils/errorHandler";
import { fetchWithAuth } from "@/app/lib/api";
import { NoteListContext } from "../../layout";
import { SelectedWorkspaceContext } from "../../layout";

export default function NoteListPage({ params }) {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [newNoteId, setNewNoteId] = useState(null);
  const [highlightNoteId, setHighlightNoteId] = useState(null);
  const [isCategoryInWorkspace, setIsCategoryInWorkspace] = useState(true);
  const [showCreateCollectionModal, setShowCreateCollectionModal] =
    useState(false);
  const noteListRef = useRef();
  const router = useRouter();
  const searchParams = useSearchParams();
  const perPage = 20;
  const { slug } = params;
  const noteLists = useContext(NoteListContext);
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) : 1;
  });

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
    getRecords();
  }, [currentPage, showHidden, slug, selectedWorkspace]);

  useEffect(() => {
    const currentList = noteLists.find((lst) => lst.slug === slug);
    if (currentList) {
      document.title = `${currentList.name} - Notes`;
      if (selectedWorkspace && !selectedWorkspace.is_default) {
        setIsCategoryInWorkspace(
          selectedWorkspace.categories.some((c) => c.id === currentList.id),
        );
      } else {
        setIsCategoryInWorkspace(true);
      }
    } else {
      document.title = "Notes";
      setIsCategoryInWorkspace(true);
    }
  }, [noteLists, slug, selectedWorkspace]);

  const getRecords = async (selectedDate = null) => {
    console.log("getting records!");
    setIsBusy(true);
    try {
      let url = `/api/note/feed/${slug}/`;
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

      setIsBusy(false);
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
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

  const showMessagesForDate = (selectedDate) => {
    console.log("showing messages for date " + selectedDate);
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const handleSearch = useCallback(
    (newSearchText, newListSlugs) => {
      console.log("handleSearch", newSearchText, newListSlugs);

      let url = `/search/?q=${encodeURIComponent(newSearchText || "")}`;
      // Always include the current category slug when searching from a category page
      url += `&list_slug=${encodeURIComponent(slug)}`;
      if (selectedWorkspace) {
        url += `&workspace=${encodeURIComponent(selectedWorkspace.slug)}`;
      }
      router.push(url);
    },
    [router, slug, selectedWorkspace],
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(`?page=${newPage}`, undefined, { shallow: true });
  };

  return (
    <div dir="ltr">
      <SearchBar onSearch={handleSearch} initialListSlug={slug || "All"} />

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
                setShowHidden(e.target.checked);
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
            {isCategoryInWorkspace ? (
              isBusy ? (
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
                      ref={noteListRef}
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
              )
            ) : (
              <div className="text-center mt-5">
                <h4>This category is not in the current workspace.</h4>
                <p>
                  Please select a different workspace or switch to
                  &quot;All&quot; to view this category.
                </p>
              </div>
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
              listSlug={slug}
              basePath={`/list/${slug}`}
              selectedWorkspace={selectedWorkspace}
              showHidden={showHidden}
            />
          </Col>
        </Row>
      </div>
      <MessageInput onNoteSaved={addNewNote} listSlug={slug} />
      <CreateCollectionModal
        show={showCreateCollectionModal}
        onHide={() => setShowCreateCollectionModal(false)}
        defaultCategory={noteLists.find((lst) => lst.slug === slug)?.id}
        onCreated={getRecords}
      />
    </div>
  );
}
