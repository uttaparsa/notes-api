"use client";

import { useRef, useContext, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Spinner } from "react-bootstrap";
import NoteCard from "../../../components/notecard/NoteCard";
import { NoteListContext } from "../../layout";
import { useNoteData } from "./hooks/useNoteData";
import RefreshPrompt from "./components/RefreshPrompt";
import Backlinks from "./components/Backlinks";
import SimilarNotes from "./components/SimilarNotes";
import NoteEditView from "./components/NoteEditView";
import editStyles from "./components/NoteEditView.module.css";

const SingleNoteView = () => {
  const noteComponentRef = useRef(null);
  const noteContainerRef = useRef(null);
  const params = useParams();
  const noteLists = useContext(NoteListContext);
  const [activeTab, setActiveTab] = useState("preview");

  const {
    noteBusy,
    note,
    similarNotes,
    similarNotesLoaded,
    shouldShowRefreshPrompt,
    editNote,
  } = useNoteData(params.slug, noteLists);

  if (noteBusy) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (activeTab === "edit" && note) {
    return (
      <div className="container-fluid py-4" dir="ltr">
        <NoteEditView
          note={note}
          editNote={editNote}
          onDone={() => setActiveTab("preview")}
        />
      </div>
    );
  }

  return (
    <div className="container-fluid py-5" dir="ltr">
      <RefreshPrompt show={shouldShowRefreshPrompt} />

      <div className="row">
        <div className="col-lg-2"></div>
        <div className="col-lg-8 position-relative" ref={noteContainerRef}>
          <NoteCard
            ref={noteComponentRef}
            note={note}
            onEditNote={editNote}
            singleView={true}
          />
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

      {note && (
        <Button
          className={editStyles.editFab}
          variant="primary"
          onClick={() => setActiveTab("edit")}
          aria-label="Edit note"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
            <path
              fillRule="evenodd"
              d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
            />
          </svg>
        </Button>
      )}
    </div>
  );
};

export default SingleNoteView;
