'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Pagination, FormCheck } from 'react-bootstrap';
import NoteList from '../../components/NoteList';
import MessageInput from '../../components/MessageInput';
import SearchBar from '../../components/SearchBar';
import { handleApiError } from '@/app/utils/errorHandler';
import { fetchWithAuth } from '@/app/lib/api';

export default function NoteListPage({ params }) {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const noteListRef = useRef();
  const router = useRouter();
  const perPage = 20;
  const { slug } = params;

  useEffect(() => {
    getRecords();
  }, [currentPage, showArchived, slug]);

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
    noteListRef.current.addNewNote(note);
  };

  const showMessagesForDate = (selectedDate) => {
    console.log("showing messages for date " + selectedDate);
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const handleSearch = (searchText) => {
    // Redirect to the SearchPage with the appropriate query parameters
    router.push(`/search/?q=${encodeURIComponent(searchText)}&list_slug=${slug}`);
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / perPage);
    let items = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    items.push(
      <Pagination.First key="first" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />,
      <Pagination.Prev key="prev" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
    );

    if (startPage > 1) {
      items.push(<Pagination.Ellipsis key="ellipsis-start" />);
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => setCurrentPage(number)}>
          {number}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      items.push(<Pagination.Ellipsis key="ellipsis-end" />);
    }

    items.push(
      <Pagination.Next key="next" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />,
      <Pagination.Last key="last" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
    );

    return <Pagination className="custom-pagination justify-content-center mt-3">{items}</Pagination>;
  };


  return (
    <div dir="ltr" className="bg-dark">
      <SearchBar onSearch={handleSearch} listSlug={slug} />

      <div dir="ltr">
        {renderPagination()}

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
              id="show-archived"
              label="Show Archived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="text-light"
            />
          </div>

          <div className="col-lg-8 mx-0 px-3 px-lg-0" dir="ltr">
            <NoteList
              ref={noteListRef}
              notes={notes}
              isBusy={isBusy}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
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