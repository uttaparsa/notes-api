import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../NoteCard.module.css";
import { isRTL } from "../../../utils/stringUtils";
import { createCustomRenderers } from './MarkdownRenderers';
import HoverableSimilarChunks from '../HoverableSimilarChunks'; // Import HoverableSimilarChunks

// Helper function to process text for hashtags
const processTextForHashtags = (text) => {
  if (!text) return "";
  // Split by code blocks and process only non-code parts
  const parts = text.split(/(```[\s\S]*?```)/);
  const processed = parts.map((part, index) => {
    // Even indices are non-code blocks
    if (index % 2 === 0) {
      // Use negative lookbehind to avoid matching hashtags in URLs
      return part.replace(
        /(?<!https?:\/\/[^\s]*)#(\w+)/g,
        (match, tag) => `[${match}](/search?q=%23${tag}&list_slug=All)`
      );
    }
    // Odd indices are code blocks - leave unchanged
    return part;
  });
  return processed.join('');
};

/**
 * Standard Display Renderer - Renders markdown with proper formatting
 * Integrates similarity highlight and interactions when similarityModeEnabled is true.
 */
export const DisplayRenderer = ({ 
  note, 
  singleView = false, 
  isExpanded = false, 
  onExpand = () => {}, 
  shouldLoadLinks = true,
  showToast = () => {},
  similarityModeEnabled = false,
  chunks = [] 
}) => {

  const renderContent = () => {
    if (similarityModeEnabled && chunks && chunks.length > 0) {
      // Render content based on backend chunks
      // Renderers for *inside* the chunk's markdown. These should NOT add another layer of HoverableSimilarChunks.
      const insideChunkRenderers = createCustomRenderers(note, false, singleView, shouldLoadLinks, showToast);

      return chunks.map((chunk, index) => {
        const chunkTextContent = chunk.chunk_text || chunk.text || "";
        const processedChunkText = processTextForHashtags(chunkTextContent);

        return (
          <HoverableSimilarChunks
            key={index}
            noteId={note.id}
            enabled={true}
            chunkText={chunkTextContent} // The text of the entire backend chunk
            isChunkContainer={true}     // Style as a chunk container
          >
            <ReactMarkdown
              components={insideChunkRenderers}
              remarkPlugins={[remarkGfm]}
              className={`${isRTL(chunkTextContent) ? styles.rtlMarkdown : ''} ${styles.chunkMarkdownContent}`}
            >
              {processedChunkText}
            </ReactMarkdown>
          </HoverableSimilarChunks>
        );
      });
    } else {
      // Default rendering for the whole note or when similarity mode is off / no backend chunks
      const customRenderersForFullNote = createCustomRenderers(
        note,
        similarityModeEnabled, // If true, will wrap individual elements
        singleView,
        shouldLoadLinks,
        showToast
      );

      let textToRender = singleView || note.text.length < 1000 || isExpanded
        ? note.text
        : note.text.substring(0, 1000);
      
      textToRender = processTextForHashtags(textToRender);

      return (
        <>
          <ReactMarkdown 
            components={customRenderersForFullNote} 
            remarkPlugins={[remarkGfm]} 
            className={`${isRTL(note.text) ? styles.rtlMarkdown : ''}`}
          >
            {textToRender}
          </ReactMarkdown>
          
          {!singleView && note.text.length > 1000 && !isExpanded && (
            <span 
              onClick={() => onExpand()} 
              className="h4 mx-2 px-1 rounded py-0 text-secondary border flex-sn-wrap"
            >
              <b>...</b>
            </span>
          )}
        </>
      );
    }
  };

  return (
    <span // Outer span to maintain structure, dir/className applied here
      className={`card-text ${isRTL(note.text) ? "text-end" : ""}`}
      dir={isRTL(note.text) ? "rtl" : "ltr"}
    >
      {renderContent()}
    </span>
  );
};

// Create compact renderers for headers to be same size as text
const createCompactRenderers = () => {
  return {
    h1: ({ children }) => <span>{children}</span>,
    h2: ({ children }) => <span>{children}</span>,
    h3: ({ children }) => <span>{children}</span>,
    h4: ({ children }) => <span>{children}</span>,
    h5: ({ children }) => <span>{children}</span>,
    h6: ({ children }) => <span>{children}</span>,
  };
};

/**
 * Compact Markdown Renderer - Renders markdown with headers as normal text size
 * Useful for sidebars, similar notes, and linked notes displays
 */
export const CompactMarkdownRenderer = ({ children, className = '', ...props }) => {
  const text = children || '';
  const processedText = processTextForHashtags(text);
  const compactRenderers = createCompactRenderers();

  return (
    <ReactMarkdown 
      components={compactRenderers}
      remarkPlugins={[remarkGfm]}
      className={className}
      {...props}
    >
      {processedText}
    </ReactMarkdown>
  );
};
