'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Form, FormCheck } from 'react-bootstrap';
import NoteList from '../../../components/NoteList';
import MessageInput from '../../../components/MessageInput';
import SearchBar from '../../../components/SearchBar';
import PaginationComponent from '../../../components/PaginationComponent';
import { handleApiError } from '@/app/utils/errorHandler';
import { fetchWithAuth } from '@/app/lib/api';

export default function NoteListPage({ params }) {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const noteListRef = useRef();
  const router = useRouter();
  const perPage = 20;
  const { slug } = params;

  useEffect(() => {
    getRecords();
  }, [currentPage, showHidden, slug]);

  const getRecords = async (selectedDate = null) => {
    console.log("getting records!");
    setIsBusy(true);
    try {
      let url = `/api/note/${slug}/`;
      const params = new URLSearchParams({
        page: currentPage,
        ...(selectedDate && { date: selectedDate }),
      });
      
      const response = await fetchWithAuth(`${url}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();

      if (selectedDate != null) {
        if (data.next !== null) {
          const nextPage = new URL(data.next).searchParams.get('page');
          setCurrentPage(parseInt(nextPage) - 1);
        } else if (data.previous !== null) {
          const prevPage = new URL(data.previous).searchParams.get('page');
          setCurrentPage(parseInt(prevPage) + 1);
        }
      }

      setNotes(data.results.map(note => ({
        ...note,
        created_date: Date.parse(note.created_date)
      })));

      setTotalCount(data.count);
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

  const showMessagesForDate = (selectedDate) => {
    console.log("showing messages for date " + selectedDate);
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const handleSearch = (searchText) => {
    router.push(`/search/?q=${encodeURIComponent(searchText)}&list_slug=${slug}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div dir="ltr" className="bg-dark">
      <SearchBar onSearch={handleSearch} listSlug={slug} />

      <div dir="ltr">
        <PaginationComponent
          currentPage={currentPage}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={handlePageChange}
        />

        <div className="d-flex row m-0 p-0">
          <div className="col-lg-2 mx-0 mb-3 mb-lg-0">
            <Form.Group>
              <Form.Label className="text-light">Show messages for</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => showMessagesForDate(e.target.value)}
              />
            </Form.Group>
            <FormCheck
              id="show-hidden"
              label="Show Hidden"
              checked={showHidden}
              onChange={(e) => {
                console.log("e.target.checked is " + e.target.checked);                                                 
                setShowHidden(e.target.checked)

              }}
              className="text-light"
            />
          </div>

          <div className="col-lg-8 mx-0 px-3 px-lg-0" dir="ltr">
            <NoteList
              ref={noteListRef}
              notes={notes}
              isBusy={isBusy}
              showHidden={showHidden}
              refreshNotes={getRecords}
            />
          </div>

          <div className="col-lg-2"></div>
        </div>
      </div>

      <MessageInput onNoteSaved={addNewNote} listSlug={slug} />
    </div>
  );
}