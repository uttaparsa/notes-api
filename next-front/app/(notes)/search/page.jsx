'use client';

import { useState, useEffect, Suspense } from 'react';
import { Pagination, FormCheck } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import NoteList from '../../components/NoteList';
import { fetchWithAuth } from '../../lib/api';
import { handleApiError } from '../utils/errorHandler';

// Dynamically import the SearchBar component with ssr disabled
const SearchBar = dynamic(() => import('../../components/SearchBar'), { ssr: false });

// Create a client-side only component for handling search params
const SearchParamsHandler = dynamic(() => 
  import('../../components/SearchParamsHandler').then((mod) => mod.SearchParamsHandler), 
  { ssr: false }
);

export default function SearchPage() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [listSlug, setListSlug] = useState('All');
  const perPage = 20;

  const getRecords = async (query, newListSlug = false) => {
    console.log("getting records for " + query);
    setIsBusy(true);
    try {
      let url = `/api/note/search/?q=${query}`;
      if (newListSlug) {
        url += `&list_slug=${newListSlug}`;
      }
      const response = await fetchWithAuth(`${url}&page=${currentPage}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      setNotes(data.results);
      setTotalCount(data.count);
      if (newListSlug) setListSlug(newListSlug);
    } catch (err) {
      console.error(`Error: ${err}`);
      handleApiError(err);
    } finally {
      setIsBusy(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // You'll need to implement a way to get the current query here
    // For now, let's assume you have a state for the current query
    getRecords(currentQuery, listSlug !== 'All' ? listSlug : false);
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
      <Suspense fallback={<div>Loading...</div>}>
        <SearchBar 
          onSearch={getRecords}
          listSlug={listSlug} 
        />
        <SearchParamsHandler onParamsChange={getRecords} />
      </Suspense>
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