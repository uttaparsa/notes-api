'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Pagination, FormCheck } from 'react-bootstrap';
import NoteList from '../components/NoteList';

export default function SearchPage() {
  const [searchText, setSearchText] = useState('');
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const perPage = 20;

  const router = useRouter();
  const searchParams = useSearchParams();

  const listSlug = searchParams.get('list_slug') || 'All';

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchText(query);
      getRecords(query, searchParams.get('list_slug'));
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
      const response = await fetch(`${url}&page=${currentPage}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      setNotes(data.results);
      setTotalCount(data.count);
    } catch (err) {
      console.error(`Error: ${err}`);
      // Implement error handling here
    } finally {
      setIsBusy(false);
    }
  };

  const sendSearch = (e) => {
    e.preventDefault();
    let url = `/search/?q=${searchText}`;
    if (listSlug !== 'All') {
      url += `&list_slug=${listSlug}`;
    }
    router.push(url);
    getRecords(searchText, listSlug !== 'All' ? listSlug : false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    getRecords(searchText, listSlug !== 'All' ? listSlug : false);
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
      <form onSubmit={sendSearch}>
        <nav className="navbar navbar-dark bg-info py-1">
          <div className="container px-0" dir="auto">
            <div className="d-flex row justify-content-center w-100 px-0 px-lg-5 mx-0">
              <div className="col-10 d-flex flex-row px-0 px-lg-5">
                <div className="input-group">
                  <input
                    dir="auto"
                    className="rounded form-control"
                    placeholder={`Search in ${listSlug}`}
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
                      class="bi bi-search"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
                      />
                    </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </form>
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