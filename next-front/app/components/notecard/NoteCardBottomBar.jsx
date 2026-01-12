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
            const listSlug = getListSlug() || 'All';
            const response = await fetchWithAuth(`/api/note/message/${note.id}/page/?slug=${listSlug}`);
            if (!response.ok) throw new Error('Failed to get note page');
            const data = await response.json();
            router.push(`/list/${listSlug}?page=${data.page}&highlight=${note.id}`);
        } catch (err) {
            console.error('Error navigating to note:', err);
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
                        style={{ textDecoration: 'none' }}
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
                            className="bi bi-pin"
                            viewBox="0 0 16 16"
                        >
                            <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354zm1.58 1.408-.002-.001.002.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a4.922 4.922 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a4.915 4.915 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.775 1.775 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14c.06.1.133.191.214.271a1.78 1.78 0 0 0 .37.282z" />
                        </svg>
                        <span className="ms-1">{note.importance}</span>
                    </>
                )}
            </div>

            <div className="me-2" >
                <Link
                    href={`/list/${getListSlug()}/`}
                    className={ styles.categoryLink}
                >
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

            <div >
                <span className="d-md-none">
                    {formatDateSmall(note.created_at)}
                </span>
                <span className="d-none d-md-block">
                    {formatDateLarge(note.created_at)}
                </span>
            </div>
        </div>
    );
});

NoteCardBottomBar.displayName = "NoteCardBottomBar";

export default NoteCardBottomBar;
