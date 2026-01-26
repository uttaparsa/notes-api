import React, { forwardRef, useContext } from "react";
import { formatDateSmall, formatDateLarge } from "../../utils/dateFormatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NoteListContext } from "../../(notes)/layout";
import { fetchWithAuth } from "../../lib/api";
import { handleApiError } from "../../utils/errorHandler";
import styles from "./NoteCardBottomBar.module.css";

const NoteCardBottomBar = forwardRef(({ note, singleView }, ref) => {
  const noteLists = useContext(NoteListContext);
  const router = useRouter();

  const getListName = () => {
    const list = noteLists.find((lst) => lst.id === note.list);
    return list ? list.name : "";
  };

  const getListSlug = () => {
    const list = noteLists.find((lst) => lst.id === note.list);
    return list ? list.slug : "";
  };

  const handleNavigateToNote = async () => {
    try {
      const listSlug = getListSlug() || "All";
      const response = await fetchWithAuth(
        `/api/note/message/${note.id}/page/?slug=${listSlug}`,
      );
      if (!response.ok) throw new Error("Failed to get note page");
      const data = await response.json();
      router.push(`/list/${listSlug}?page=${data.page}&highlight=${note.id}`);
    } catch (err) {
      console.error("Error navigating to note:", err);
      handleApiError(err);
    }
  };

  return (
    <div className="mt-2 mb-0 d-flex ">
      <div className="me-auto">
        {singleView ? (
          <button
            onClick={handleNavigateToNote}
            className="btn btn-link p-0"
            style={{ textDecoration: "none" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-link"
              viewBox="0 0 16 16"
            >
              <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" />
              <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z" />
            </svg>
          </button>
        ) : (
          <Link href={`/message/${note.id}/`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-link"
              viewBox="0 0 16 16"
            >
              <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" />
              <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z" />
            </svg>
          </Link>
        )}
      </div>
      <div className="me-2 text-info">
        {note.importance > 0 && (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-star-fill"
              viewBox="0 0 16 16"
            >
              <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
            </svg>
            <span className="ms-1">{note.importance}</span>
          </>
        )}
      </div>

      <div className="me-2">
        <Link href={`/list/${getListSlug()}/`} className={styles.categoryLink}>
          {getListName()}
        </Link>
      </div>

      <div>
        <span className="text-info mx-2">
          {note.archived && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 512 512"
            >
              <path d="M32 448c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32V160H32v288zm160-212c0-6.6 5.4-12 12-12h104c6.6 0 12 5.4 12 12v8c0 6.6-5.4 12-12 12H204c-6.6 0-12-5.4-12-12v-8zM480 32H32C14.3 32 0 46.3 0 64v48c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16V64c0-17.7-14.3-32-32-32z" />
            </svg>
          )}
        </span>
      </div>

      <div>
        <span className="d-md-none">{formatDateSmall(note.created_at)}</span>
        <span className="d-none d-md-block">
          {formatDateLarge(note.created_at)}
        </span>
      </div>
    </div>
  );
});

NoteCardBottomBar.displayName = "NoteCardBottomBar";

export default NoteCardBottomBar;
