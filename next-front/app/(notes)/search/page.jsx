'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination, FormCheck } from 'react-bootstrap';
import NoteList from '../../components/NoteList';
import SearchBar from '../../components/SearchBar';
import { fetchWithAuth } from '../../lib/api';
import { handleApiError } from '../utils/errorHandler';

export default function SearchPage() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const perPage = 20;

  const getRecords = useCallback(async (query, listSlug) => {
    if (!query) return;
    console.log("getting records for " + query);
    setIsBusy(true);
    try {
      let url = `/api/note/search/?q=${encodeURIComponent(query)}`;
      if (listSlug && listSlug !== 'All') {
        url += `&list_slug=${encodeURIComponent(listSlug)}`;
      }
      url += `&page=${currentPage}`;
      const response = await fetchWithAuth(url);
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
  }, [currentPage]);

  useEffect(() => {
    const query = searchParams.get('q');
    const listSlug = searchParams.get('list_slug') || 'All';
    if (query) {
      getRecords(query, listSlug);
    }
  }, [searchParams, getRecords]);

  const handleSearch = (searchText, listSlug) => {
    const currentQuery = searchParams.get('q');
    const currentListSlug = searchParams.get('list_slug');
    if (searchText !== currentQuery || listSlug !== currentListSlug) {
      let url = `/search/?q=${encodeURIComponent(searchText)}`;
      if (listSlug && listSlug !== 'All') {
        url += `&list_slug=${encodeURIComponent(listSlug)}`;
      }
      router.push(url);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const query = searchParams.get('q');
    const listSlug = searchParams.get('list_slug') || 'All';
    if (query) {
      getRecords(query, listSlug);
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
      <SearchBar 
        onSearch={handleSearch}
        initialSearchText={searchParams.get('q') || ''}
        listSlug={searchParams.get('list_slug') || 'All'}
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
          refreshNotes={() => {
            const query = searchParams.get('q');
            const listSlug = searchParams.get('list_slug') || 'All';
            if (query) {
              getRecords(query, listSlug);
            }
          }}
        />
      </div>
    </div>
  );
}