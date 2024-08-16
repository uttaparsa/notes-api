'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormCheck } from 'react-bootstrap';
import NoteList from './NoteList';
import SearchBar from './SearchBar';
import PaginationComponent from './PaginationComponent';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler'

export default function ClientSideSearchWrapper() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [listSlug, setListSlug] = useState('All');

  const router = useRouter();
  const searchParams = useSearchParams();
  const perPage = 20;

  const getRecords = useCallback(async (query, slug, page) => {
    if (!query) return;
    console.log("getting records for " + query);
    setIsBusy(true);
    try {
      let url = `/api/note/search/?q=${encodeURIComponent(query)}`;
      if (slug && slug !== 'All') {
        url += `&list_slug=${encodeURIComponent(slug)}`;
      }
      url += `&page=${page}`;
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
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    const slug = searchParams.get('list_slug') || 'All';
    if (query) {
      setSearchText(query);
      setListSlug(slug);
      getRecords(query, slug, currentPage);
    }
  }, [searchParams, currentPage, getRecords]);

  const handleSearch = useCallback((newSearchText, newListSlug) => {
    if (newSearchText !== searchText || newListSlug !== listSlug) {
      setSearchText(newSearchText);
      setListSlug(newListSlug);
      setCurrentPage(1);
      let url = `/search/?q=${encodeURIComponent(newSearchText)}`;
      if (newListSlug && newListSlug !== 'All') {
        url += `&list_slug=${encodeURIComponent(newListSlug)}`;
      }
      router.push(url);
    }
  }, [searchText, listSlug, router]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div dir="ltr" className="bg-dark">
      <SearchBar 
        onSearch={handleSearch}
        initialSearchText={searchText}
        initialListSlug={listSlug}
      />
      <div className="container" dir="ltr">
        <PaginationComponent
          currentPage={currentPage}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={handlePageChange}
        />
        <FormCheck
          id="checkbox-1"
          checked={showHidden}
          onChange={(e) => setShowHidden(e.target.checked)}
          label="Show Hidden"
          className="text-light"
        />
        <NoteList 
          notes={notes} 
          isBusy={isBusy} 
          showHidden={showHidden}
          refreshNotes={() => getRecords(searchText, listSlug, currentPage)}
        />
      </div>
    </div>
  );
}