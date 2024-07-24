'use client';

import { useState, useEffect } from 'react';

export default function SearchBar({ onSearch, initialSearchText = '', initialListSlug = 'All' }) {
  const [searchText, setSearchText] = useState(initialSearchText);
  const [listSlug, setListSlug] = useState(initialListSlug);

  useEffect(() => {
    setSearchText(initialSearchText);
    setListSlug(initialListSlug);
  }, [initialSearchText, initialListSlug]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchText, listSlug);
  };

  return (
    <form onSubmit={handleSubmit}>
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
                  <button type="submit" className="input-group-text h-100">
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
  );
}