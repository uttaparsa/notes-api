'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NoteList from "./components/NoteList";
import SendMessage from "./components/SendMessage";

export default function NotesIndex() {
  const [searchText, setSearchText] = useState('');
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const perPage = 20;
  const listSlug = 'All';

  const getRecords = useCallback(async (fetchDate = null) => {
    setIsBusy(true);
    try {
      const url = new URL(`/api/note/${listSlug}`, window.location.origin);
      url.searchParams.append('page', currentPage.toString());
      if (fetchDate) {
        url.searchParams.append('date', fetchDate);
      }

      const response = await fetch(url);
      const data = await response.json();

      setNotes(data.results.map(note => ({
        ...note,
        created_date: Date.parse(note.created_date)
      })));

      setTotalCount(data.count);

      if (fetchDate) {
        if (data.next) {
          const nextPage = new URL(data.next).searchParams.get('page');
          setCurrentPage(parseInt(nextPage) - 1);
        } else if (data.previous) {
          const prevPage = new URL(data.previous).searchParams.get('page');
          setCurrentPage(parseInt(prevPage) + 1);
        }
      }
    } catch (err) {
      console.error(`Error: ${err}`);
      // Implement error handling here
    } finally {
      setIsBusy(false);
    }
  }, [currentPage, listSlug]);

  useEffect(() => {
    getRecords();
  }, [getRecords]);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/search?q=${searchText}`);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    getRecords();
  };

  const showMessagesForDate = (newDate) => {
    setDate(newDate);
    getRecords(newDate);
  };

  const addNewNote = (note) => {
    setNotes(prevNotes => [note, ...prevNotes]);
  };

  return (
    <div dir="ltr" className="bg-dark">
      <form onSubmit={handleSearch}>
        <nav className="navbar navbar-dark bg-info py-1">
          <div className="container px-0" dir="auto">
            <div className="d-flex row justify-content-center w-100 px-0 px-lg-5 mx-0">
              <div className="col-10 d-flex flex-row px-0 px-lg-5">
                <div className="input-group">
                  <input
                    dir="auto"
                    className="rounded form-control"
                    placeholder="Search in All"
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <div className="input-group-append">
                    <button type="submit" className="input-group-text">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-search"
                        viewBox="0 0 16 16"
                      >
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </form>

      <div dir="ltr">
        {/* Pagination component (you may need to implement this) */}
        <div className="mt-3 d-flex justify-content-center">
          {/* Implement pagination controls here */}
        </div>

        <div className="form-check text-light">
          <input
            type="checkbox"
            className="form-check-input"
            id="showArchivedCheck"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="showArchivedCheck">
            Show Archived
          </label>
        </div>

        <div className="d-flex row m-0 p-0">
          <div className="col-lg-2 mx-0 mb-3 mb-lg-0">
            <label className="text-light" htmlFor="datePicker">
              Show messages for
            </label>
            <input
              type="date"
              id="datePicker"
              className="form-control"
              value={date}
              onChange={(e) => showMessagesForDate(e.target.value)}
            />
          </div>

          <div className="col-lg-8 mx-0 px-3 px-lg-0" dir="ltr">
            <NoteList
              notes={notes}
              isBusy={isBusy}
              showArchived={showArchived}
              onRefresh={getRecords}
            />
          </div>

          <div className="col-lg-2"></div>
        </div>
      </div>

      <SendMessage onNoteSaved={addNewNote} listSlug={listSlug} />
    </div>
  );
}