'use client';

import { useState, useEffect, useRef } from 'react';
import { Pagination } from 'react-bootstrap';
import NoteList from '../../components/NoteList';
import { handleApiError } from '@/app/utils/errorHandler';

export default function PaginatedNoteList({ initialNotes = [] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const noteListRef = useRef();
  const perPage = 20;

  useEffect(() => {
    getRecords();
  }, [currentPage]);

  const getRecords = async (selectedDate = null) => {
    console.log("getting records!");
    setIsBusy(true);
    try {
      let url = '/api/note/pp/';
      const params = new URLSearchParams({
        page: currentPage,
        ...(selectedDate && { date: selectedDate }),
      });
      
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();

      console.log("results " + data.results);
      setNotes(data.results.map(note => ({
        ...note,
        created_date: Date.parse(note.created_date)
      })));

      setTotalCount(data.count);
      setIsBusy(false);
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err)
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <div className="container" dir="ltr">
        <Pagination className="mt-3 justify-content-center">
          <Pagination.First onClick={() => handlePageChange(1)} />
          <Pagination.Prev onClick={() => handlePageChange(Math.max(1, currentPage - 1))} />
          <Pagination.Item>{currentPage}</Pagination.Item>
          <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} />
          <Pagination.Last onClick={() => handlePageChange(Math.ceil(totalCount / perPage))} />
        </Pagination>
        <NoteList
          ref={noteListRef}
          notes={notes}
          isBusy={isBusy}
          hideEdits={true}
          showArchived={false}
          refreshNotes={getRecords}
        />
      </div>
    </div>
  );
}