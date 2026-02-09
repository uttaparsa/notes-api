"use client";

import { useRef, useContext } from "react";
import { useParams } from "next/navigation";
import NoteCard from "../../../components/notecard/NoteCard";
import { Spinner } from "react-bootstrap";
import { NoteListContext } from "../../layout";
import { useNoteData } from "./hooks/useNoteData";
import RefreshPrompt from "./components/RefreshPrompt";
import Backlinks from "./components/Backlinks";
import SimilarNotes from "./components/SimilarNotes";

const SingleNoteView = () => {
  const noteComponentRef = useRef(null);
  const noteContainerRef = useRef(null);
  const params = useParams();
  const noteLists = useContext(NoteListContext);

  const {
    noteBusy,
    note,
    similarNotes,
    similarNotesLoaded,
    shouldShowRefreshPrompt,
    editNote,
  } = useNoteData(params.slug, noteLists);

  return (
    <div className="container-fluid py-5" dir="ltr">
      <RefreshPrompt show={shouldShowRefreshPrompt} />

      <div className="row">
        <div className="col-lg-2"></div>
        <div className="col-lg-8 position-relative" ref={noteContainerRef}>
          {noteBusy ? (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          ) : (
            <NoteCard
              ref={noteComponentRef}
              note={note}
              onEditNote={editNote}
              singleView={true}
            />
          )}
        </div>
        <div className="col-lg-2 pl-lg-0">
          {note && (
            <>
              <Backlinks sourceLinks={note.source_links} />
              <SimilarNotes notes={similarNotes} loaded={similarNotesLoaded} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleNoteView;
