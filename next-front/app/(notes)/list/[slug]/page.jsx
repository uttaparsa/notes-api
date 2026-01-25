'use client';

import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, FormCheck , Row, Col} from 'react-bootstrap';
import NoteList from '../../../components/NoteList';
import MessageInput from '../../../components/MessageInput';
import SearchBar from '../../../components/search/SearchBar';
import PaginationComponent from '../../../components/PaginationComponent';
import ImportantNotesSidebar from '../../../components/ImportantNotesSidebar';
import { handleApiError } from '@/app/utils/errorHandler';
import { fetchWithAuth } from '@/app/lib/api';
import { NoteListContext } from '../../layout';

export default function NoteListPage({ params }) {
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [newNoteId, setNewNoteId] = useState(null);
  const [highlightNoteId, setHighlightNoteId] = useState(null);
  const noteListRef = useRef();
  const router = useRouter();
  const searchParams = useSearchParams();
  const perPage = 20;
  const { slug } = params;
  const noteLists = useContext(NoteListContext);

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page) : 1;
  });

  useEffect(() => {
    const page = searchParams.get('page');
    const highlight = searchParams.get('highlight');
    if (page) {
      setCurrentPage(parseInt(page));
    }
    if (highlight) {
      setHighlightNoteId(highlight);
      // Clear highlight from URL after reading it
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('highlight');
      const newUrl = newParams.toString() ? `?${newParams.toString()}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    getRecords();
  }, [currentPage, showHidden, slug]);

  useEffect(() => {
    const currentList = noteLists.find(lst => lst.slug === slug);
    if (currentList) {
      document.title = `${currentList.name} - Notes`;
    } else {
      document.title = 'Notes';
    }
  }, [noteLists, slug]);

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
        if (data.highlight_note_id) {
          setHighlightNoteId(data.highlight_note_id);
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


  const updateNote = async (noteId, updates) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  };

  const deleteNote = async (noteId) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  };


  const addNewNote = (note) => {
    // Add note at top initially (unsorted)
    setNotes(prevNotes => [note, ...prevNotes]);
    setNewNoteId(note.id);
    
    // Clear the newNoteId after all animations complete
    setTimeout(() => setNewNoteId(null), 2000); // Extended from 1200ms to 2000ms
  };


  const showMessagesForDate = (selectedDate) => {
    console.log("showing messages for date " + selectedDate);
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const handleSearch = useCallback((newSearchText, newListSlugs) => {
    console.log('handleSearch', newSearchText, newListSlugs);
  
    
    let url = `/search/?q=${encodeURIComponent(newSearchText || '')}`;
    if (newListSlugs && newListSlugs !== 'All') {
      url += `&list_slug=${encodeURIComponent(newListSlugs)}`;
      router.push(url);
    }
  }, [  router]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(`?page=${newPage}`, undefined, { shallow: true });
  };

  return (
<div dir="ltr">
  <SearchBar 
    onSearch={handleSearch} 
    initialListSlug={slug || 'All'} 
  />

  <div dir="ltr">
    <PaginationComponent
      currentPage={currentPage}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={handlePageChange}
    />
    <Row className="m-0 p-0">
      <Col xs={12} lg={2} className="mx-0 mb-3 mb-lg-0 order-2 order-lg-1">
        <FormCheck
          type="checkbox"
          id="show-hidden"
          label="Show Hidden"
          checked={showHidden}
          onChange={(e) => setShowHidden(e.target.checked)}
          className="mb-3 text-body-emphasis mt-2"
        />
        <Form.Group>
          <Form.Label className='text-body-secondary small'>Show messages for</Form.Label>
          <Form.Control
            type="date"
            value={date}
            onChange={(e) => showMessagesForDate(e.target.value)}
          />
        </Form.Group>
      </Col>
      <Col xs={12} lg={8} className="mx-0 px-3 px-lg-0 order-3 order-lg-2" dir="ltr">
      <NoteList
        ref={noteListRef}
        notes={notes}
        isBusy={isBusy}
        showHidden={showHidden}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
        refreshNotes={getRecords}
        newNoteId={newNoteId}
        highlightNoteId={highlightNoteId}
      />
      </Col>
      <Col xs={12} lg={2} className="mb-3 mb-lg-0 order-1 order-lg-3">
        <ImportantNotesSidebar listSlug={slug} basePath={`/list/${slug}`} />
      </Col>
    </Row>
  </div>
  <MessageInput onNoteSaved={addNewNote} listSlug={slug} />
</div>
  );
}