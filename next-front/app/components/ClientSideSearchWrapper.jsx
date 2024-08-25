'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormCheck, Row, Col } from 'react-bootstrap';
import NoteList from './NoteList';
import SearchBar from './SearchBar';
import PaginationComponent from './PaginationComponent';
import { fetchWithAuth } from '../lib/api';
import { handleApiError } from '../utils/errorHandler';

export default function ClientSideSearchWrapper() {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [listSlug, setListSlug] = useState('All');
  const router = useRouter();
  const searchParams = useSearchParams();
  const perPage = 20;

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page) : 1;
  });

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
    const page = searchParams.get('page');
    if (query) {
      setSearchText(query);
      setListSlug(slug);
      if (page) {
        setCurrentPage(parseInt(page));
      }
      getRecords(query, slug, page || currentPage);
    }
  }, [searchParams, getRecords]);

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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    let url = `/search/?q=${encodeURIComponent(searchText)}`;
    if (listSlug && listSlug !== 'All') {
      url += `&list_slug=${encodeURIComponent(listSlug)}`;
    }
    url += `&page=${newPage}`;
    router.push(url, undefined, { shallow: true });
  };

  return (
<div dir="ltr">
  <SearchBar
    onSearch={handleSearch}
    initialSearchText={searchText}
    initialListSlug={listSlug}
  />
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
          onChange={(e) => setShowHidden(e.target.checked)}
          className="mb-3 text-body-emphasis mt-2"
        />
        {/* You might want to add the date picker here as well, if needed */}
      </Col>
      <Col lg={8} className="mx-0 px-3 px-lg-0" dir="ltr">
        <NoteList
          notes={notes}
          isBusy={isBusy}
          showHidden={showHidden}
          refreshNotes={() => getRecords(searchText, listSlug, currentPage)}
        />
      </Col>
      <Col lg={2}></Col>
    </Row>
  </div>
  {/* You might want to add the MessageInput component here if needed */}
</div>
  );
}