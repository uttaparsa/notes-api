import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { DisplayRenderer } from './ChunkRenderers';

const NoteTextRenderer = ({ 
  note, 
  singleView = false, 
  isExpanded = false, 
  onExpand = () => {}, 
  shouldLoadLinks = true,
  showToast = () => {}
}) => {
  const searchParams = useSearchParams();
  const highlightStart = searchParams ? parseInt(searchParams.get('highlight_start')) : null;
  const highlightEnd = searchParams ? parseInt(searchParams.get('highlight_end')) : null;
  
  useEffect(() => {
    if (singleView && !isNaN(highlightStart) && !isNaN(highlightEnd)) {
      setTimeout(() => {
        const highlightedElement = document.querySelector('.highlighted-reminder-text');
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [singleView, highlightStart, highlightEnd]);

  return (
    <DisplayRenderer
      note={note}
      singleView={singleView}
      isExpanded={isExpanded}
      onExpand={onExpand}
      shouldLoadLinks={shouldLoadLinks}
      showToast={showToast}
      highlightStart={!isNaN(highlightStart) ? highlightStart : null}
      highlightEnd={!isNaN(highlightEnd) ? highlightEnd : null}
    />
  );
};

export default NoteTextRenderer;