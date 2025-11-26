import { useState, useEffect, useContext } from 'react';
import { NoteListContext } from '../../(notes)/layout';
import { Form, Button, InputGroup } from 'react-bootstrap';

export default function SearchBar({ onSearch, initialSearchText = '', initialListSlug = 'All' }) {
  const [searchText, setSearchText] = useState(initialSearchText);
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const noteLists = useContext(NoteListContext);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  
  // Separate archived and non-archived lists
  const activeLists = noteLists?.filter(list => !list.archived) || [];
  const archivedLists = noteLists?.filter(list => list.archived) || [];
  
  // Update selected categories when initialListSlug changes
  useEffect(() => {
    if (noteLists) {
      if (initialListSlug === 'All') {
        // Only select non-archived categories by default
        setSelectedCategories(new Set(activeLists.map(list => list.slug)));
      } else if (initialListSlug.includes(',')) {
        setSelectedCategories(new Set(initialListSlug.split(',')));
      } else {
        // When viewing a specific category, only select that category
        setSelectedCategories(new Set([initialListSlug]));
      }
    }
  }, [noteLists, initialListSlug]);

  useEffect(() => {
    setSearchText(initialSearchText);
  }, [initialSearchText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedSlugs = Array.from(selectedCategories);
    // If we're in a specific category view and no categories are selected,
    // default to the current category
    const searchSlugs = selectedSlugs.length === 0 && initialListSlug !== 'All' 
      ? initialListSlug 
      : (selectedSlugs.length === 0 ? 'All' : selectedSlugs.join(','));
    
    onSearch(searchText, searchSlugs);
    setShowFilters(false);
  };

  const handleCategoryToggle = (slug) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedCategories(newSelected);
  };

  const selectAll = () => {
    // Only select non-archived categories
    setSelectedCategories(new Set(activeLists.map(list => list.slug)));
  };

  const deselectAll = () => {
    setSelectedCategories(new Set());
  };

  // Get the display text for the search placeholder
  const getPlaceholderText = () => {
    if (initialListSlug !== 'All' && selectedCategories.size === 1 && selectedCategories.has(initialListSlug)) {
      const currentCategory = noteLists?.find(list => list.slug === initialListSlug)?.name;
      return `Search in ${currentCategory || initialListSlug}`;
    }
    return `Search in ${selectedCategories.size === activeLists?.length ? 'All' : `${selectedCategories.size} categories`}`;
  };

  return (
    <Form onSubmit={handleSubmit}>
      <nav className="navbar navbar-dark shadow-sm bg-body-tertiary py-1">
        <div className="container px-0" dir="auto">
          <div className="d-flex row justify-content-center w-100 px-0 px-lg-5 mx-0">
            <div className="col-10 d-flex flex-row px-0 px-lg-5">
              <InputGroup className="position-relative">
                <Form.Control
                  dir="auto"
                  className="rounded"
                  placeholder={getPlaceholderText()}
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onFocus={() => setShowFilters(true)}
                />
                <Button variant="outline-secondary" type="submit">
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
                </Button>
                
                {showFilters && (
                  <div className="position-absolute top-100 start-0 w-100 mt-1 bg-body border rounded shadow-sm p-3 z-1">
                    <div className="d-flex justify-content-between mb-2">
                      <Button 
                        variant="outline-primary"
                        size="sm"
                        onClick={selectAll}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline-secondary"
                        size="sm"
                        onClick={deselectAll}
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="mb-2">
                      {activeLists?.map((list) => (
                        <Form.Check
                          key={list.slug}
                          type="checkbox"
                          id={`category-${list.slug}`}
                          label={list.name}
                          checked={selectedCategories.has(list.slug)}
                          onChange={() => handleCategoryToggle(list.slug)}
                          className="mb-2"
                        />
                      ))}
                      
                      {archivedLists.length > 0 && (
                        <>
                          <div className="mt-3 mb-2">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setShowArchived(!showArchived)}
                              className="p-0 text-decoration-none"
                            >
                              {showArchived ? '▼' : '▶'} Archived ({archivedLists.length})
                            </Button>
                          </div>
                          {showArchived && archivedLists.map((list) => (
                            <Form.Check
                              key={list.slug}
                              type="checkbox"
                              id={`category-${list.slug}`}
                              label={list.name}
                              checked={selectedCategories.has(list.slug)}
                              onChange={() => handleCategoryToggle(list.slug)}
                              className="mb-2 ms-3"
                            />
                          ))}
                        </>
                      )}
                    </div>
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowFilters(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </InputGroup>
            </div>
          </div>
        </div>
      </nav>
    </Form>
  );
}