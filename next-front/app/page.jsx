'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Pagination, FormCheck, Row, Col } from 'react-bootstrap';
import { NoteListContext } from '../app/layout';
import NoteList from "./components/NoteList";
import SendMessage from "./components/SendMessage";


export default function NotesPage() {
  const [searchText, setSearchText] = useState('');
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [date, setDate] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const perPage = 20;
  const listSlug = 'All';
  const router = useRouter();
  const noteLists = useContext(NoteListContext);

  useEffect(() => {
    getRecords();
  }, [currentPage, showArchived]);

  const sendSearch = (e) => {
    e.preventDefault();
    router.push(`/search/?q=${searchText}`);
  };

  const showMessagesForDate = (selectedDate) => {
    console.log("showing messages for date " + selectedDate);
    setDate(selectedDate);
    getRecords(selectedDate);
  };

  const getRecords = async (selectedDate = null) => {
    console.log("getting records!");
    setIsBusy(true);
    try {
      let url = `/api/note/${listSlug}/`;
      const params = new URLSearchParams({
        page: currentPage,
        ...(selectedDate && { date: selectedDate }),
      });
      
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();

      setNotes(data.results.map(note => ({
        ...note,
        created_date: Date.parse(note.created_date)
      })));

      setTotalCount(data.count);

      if (selectedDate != null) {
        if (data.next !== null) {
          const nextPage = new URL(data.next).searchParams.get('page');
          setCurrentPage(parseInt(nextPage) - 1);
        } else if (data.previous !== null) {
          const prevPage = new URL(data.previous).searchParams.get('page');
          setCurrentPage(parseInt(prevPage) + 1);
        }
      }

      setIsBusy(false);
    } catch (err) {
      console.error(`Error: ${err}`);
      // Implement error handling here
    }
  };

  const addNewNote = (note) => {
    setNotes(prevNotes => [note, ...prevNotes]);
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
                    placeholder="Search in All"
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <div className="input-group-append">
                    <button type="submit" className="input-group-text">
                      {/* Add search icon SVG here */}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </form>

      <div dir="ltr">
        <Pagination
          className="mt-3 justify-content-center"
          current={currentPage}
          total={totalCount}
          pageSize={perPage}
          onChange={(page) => setCurrentPage(page)}
        />
        
        <FormCheck
          type="checkbox"
          id="show-archived"
          label="Show Archived"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="text-light mb-3"
        />

        <Row className="m-0 p-0">
          <Col lg={2} className="mx-0 mb-3 mb-lg-0">
            <Form.Group>
              <Form.Label className="text-light">Show messages for</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => showMessagesForDate(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col lg={8} className="mx-0 px-3 px-lg-0" dir="ltr">
            <NoteList
              notes={notes}
              isBusy={isBusy}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              refreshNotes={getRecords}
            />
          </Col>

          <Col lg={2}></Col>
        </Row>
      </div>

      <SendMessage onNoteSaved={addNewNote} listSlug={listSlug} />
    </div>
  );
}