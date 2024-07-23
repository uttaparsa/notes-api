'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pagination, FormCheck } from 'react-bootstrap';
import NoteList from '../components/NoteList';
import SearchBar from '../components/SearchBar'; // Import the new SearchBar component
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';

export default function SearchPage() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const perPage = 20;

  const searchParams = useSearchParams();
  const listSlug = searchParams.get('list_slug') || 'All';

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      getRecords(query, listSlug);
    }
  }, [searchParams]);

  const getRecords = async (query, listSlug = false) => {
    console.log("getting records for " + query);
    setIsBusy(true);
    try {
      let url = `/api/note/search/?q=${query}`;
      if (listSlug) {
        url += `&list_slug=${listSlug}`;
      }
      const response = await fetchWithAuth(`${url}&page=${currentPage}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      setNotes(data.results);
      setTotalCount(data.count);
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
    } finally {
      setIsBusy(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const query = searchParams.get('q');
    if (query) {
      getRecords(query, listSlug !== 'All' ? listSlug : false);
    }
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
      <Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1} />,
      <Pagination.Prev key="prev" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
    );

    if (startPage > 1) {
      items.push(<Pagination.Ellipsis key="ellipsis-start" />);
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
          {number}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      items.push(<Pagination.Ellipsis key="ellipsis-end" />);
    }

    items.push(
      <Pagination.Next key="next" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />,
      <Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
    );

    return <Pagination
        className="custom-pagination justify-content-center mt-3"
    >{items}</Pagination>;
  };

  return (
    <div dir="ltr" className="bg-dark">
      <SearchBar 
        onSearch={getRecords} 
        initialSearchText={searchParams.get('q') || ''} 
        listSlug={listSlug} 
      />
      <div className="container" dir="ltr">
        {renderPagination()}
        <FormCheck
          id="checkbox-1"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          label="Show Archived"
          className="text-light"
        />
        <NoteList 
          notes={notes} 
          isBusy={isBusy} 
          showArchived={showArchived}
          refreshNotes={getRecords}
        />
      </div>
    </div>
  );
}