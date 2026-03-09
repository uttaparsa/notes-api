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
import EditIcon from "../../../components/icons/EditIcon";

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
          <EditIcon />
        </Button>
      )}
    </div>
  );
};

export default SingleNoteView;
