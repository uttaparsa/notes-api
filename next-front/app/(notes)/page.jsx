'use client';

import { useState, useEffect, useCallback } from 'react';
import { Form, FormCheck, Row, Col } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import NoteList from "../components/NoteList";
import MessageInput from '../components/MessageInput';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import SearchBar from '../components/search/SearchBar';
import PaginationComponent from '../components/PaginationComponent';
import { sortNotesList } from './noteUtils';

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [newNoteId, setNewNoteId] = useState(null);
  const perPage = 20;
  const listSlug = 'All';

  useEffect(() => {
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [searchParams]);

  useEffect(() => {
    getRecords();
  }, [currentPage, showHidden]);

  const showMessagesForDate = (selectedDate) => {
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const getRecords = async (selectedDate = null) => {
    setIsBusy(true);
    try {
      let url = `/api/note/${listSlug}/`;
      const params = new URLSearchParams({
        page: currentPage,
        ...(selectedDate && { date: selectedDate }),
      });
      
      const response = await fetchWithAuth(`${url}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();

      setNotes(data.results.map(note => ({
        ...note,
        created_date: Date.parse(note.created_date)
      })));

      setTotalCount(data.count);

      if (selectedDate != null) {
        if (data.next !== null) {
          const nextPage = new URL(data.next).searchParams.get('page');
          setCurrentPage(parseInt(nextPage) - 1);
        } else if (data.previous !== null) {
          const prevPage = new URL(data.previous).searchParams.get('page');
          setCurrentPage(parseInt(prevPage) + 1);
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
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  };

  const deleteNote = async (noteId) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  };

  const addNewNote = (note) => {
    // Add note at top initially (unsorted)
    setNotes(prevNotes => [note, ...prevNotes]);
    setNewNoteId(note.id);
    
    // Sort notes after entrance animation completes
    setTimeout(() => {
      setNotes(prevNotes => sortNotesList(prevNotes));
    }, 1000); // Extended from 600ms to 1000ms
    
    // Clear the newNoteId after all animations complete
    setTimeout(() => setNewNoteId(null), 2000); // Extended from 1200ms to 2000ms
  };


  const handleSearch = useCallback((newSearchText, newListSlugs) => {
    let url = `/search/?q=${encodeURIComponent(newSearchText || '')}`;
    if (newListSlugs && newListSlugs !== 'All') {
      url += `&list_slug=${encodeURIComponent(newListSlugs)}`;
      router.push(url);
    }
  }, [router]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(`?page=${newPage}`, undefined, { shallow: true });
  };

  return (
    <div dir="ltr" style={{ minHeight: '100vh', overflow: 'auto' }}>
      <SearchBar onSearch={handleSearch} />
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
              onChange={(e) => setShowHidden(!showHidden)}
              className="mb-3 text-body-emphasis mt-2"
            />
            <Form.Group>
              <Form.Label className='text-body-secondary small'>Show messages for</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => showMessagesForDate(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col lg={8} className="mx-0 px-3 px-lg-0" dir="ltr">
            <NoteList
              notes={notes}
              isBusy={isBusy}
              showHidden={showHidden}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              refreshNotes={getRecords}
              newNoteId={newNoteId}
            />
          </Col>
          <Col lg={2}></Col>
        </Row>
      </div>
      <MessageInput onNoteSaved={addNewNote} listSlug={''} />
    </div>
  );
}