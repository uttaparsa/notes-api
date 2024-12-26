'use client';

import { useState, useEffect, Suspense } from 'react';
import { Form, FormCheck, Row, Col } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import NoteList from "../components/NoteList";
import MessageInput from '../components/MessageInput';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';
import SearchBar from '../components/SearchBar';
import PaginationComponent from '../components/PaginationComponent';

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const [showHidden, setShowHidden] = useState(false);
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
    console.log("showing messages for date " + selectedDate);
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const getRecords = async (selectedDate = null) => {
    console.log("getting records!");
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

      setIsBusy(false);
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
    }
  };

  const addNewNote = (note) => {
    setNotes(prevNotes => [note, ...prevNotes]);
    sortNotes();
  };

  const sortNotes = () => {
    setNotes(prevNotes => [...prevNotes].sort((a, b) => {
      if (a.pinned === b.pinned) {
        if (a.archived === b.archived) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return a.archived > b.archived ? 1 : -1;
      }
      return a.pinned < b.pinned ? 1 : -1;
    }));
  };


  const handleSearch = useCallback((newSearchText, newListSlugs) => {
    console.log('handleSearch', newSearchText, newListSlugs);
    
    if (newSearchText !== searchText || newListSlugs !== listSlug) {
      setSearchText(newSearchText);
      setListSlug(newListSlugs);
      setCurrentPage(1);
      
      let url = `/search/?q=${encodeURIComponent(newSearchText || '')}`;
      if (newListSlugs && newListSlugs !== 'All') {
        url += `&list_slug=${encodeURIComponent(newListSlugs)}`;
      }
      router.push(url);
    }
  }, [searchText, listSlug, router]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(`?page=${newPage}`, undefined, { shallow: true });
  };

  // Add this function to handle initial page load
  const handleInitialPageLoad = () => {
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(parseInt(page));
    }
  };

  // Use this effect to handle initial page load
  useEffect(() => {
    handleInitialPageLoad();
  }, []);

  return (
    <div dir="ltr" >
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
              setShowHidden={setShowHidden}
              refreshNotes={getRecords}
            />
          </Col>
          <Col lg={2}></Col>
        </Row>
      </div>
      <MessageInput onNoteSaved={addNewNote} listSlug={''} />
    </div>
  );
}