import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../NoteCard.module.css";
import { isRTL } from "../../utils/stringUtils";
import { createCustomRenderers } from './MarkdownRenderers';
import {  getHighlightStyle } from './ChunkUtils';
import HoverableSimilarChunks from '../HoverableSimilarChunks';

/**
 * Standard Display Renderer - Renders markdown with proper formatting
 * No similarity highlight or interactions
 */
export const DisplayRenderer = ({ 
  note, 
  singleView = false, 
  isExpanded = false, 
  onExpand = () => {}, 
  shouldLoadLinks = true,
  showToast = () => {},
}) => {
  const customRenderers = createCustomRenderers(
    note,
    false, // No similarity highlighting for display renderer
    [],    // No chunks needed for display renderer
    singleView,
    shouldLoadLinks,
    showToast
  );

  // Process the text
  let processedText = singleView || note.text.length < 1000 || isExpanded
    ? note.text
    : note.text.substring(0, 1000);
  
  // Process text for hashtags
  const parts = processedText.split(/(```[\s\S]*?```)/);
  const processed = parts.map((part, index) => {
    if (index % 2 === 0) {
      return part.replace(
        /(?<!https?:\/\/[^\s]*)#(\w+)/g,
        (match, tag) => `[${match}](/search?q=%23${tag}&list_slug=All)`
      );
    }
    return part;
  });
  
  processedText = processed.join('');

  return (
    <>
      <span
        className={`card-text ${isRTL(note.text) ? "text-end" : ""}`}
        dir={isRTL(note.text) ? "rtl" : "ltr"}
      >
        <ReactMarkdown 
          components={customRenderers} 
          remarkPlugins={[remarkGfm]} 
          className={`${isRTL(note.text) ? styles.rtlMarkdown : ''}`}
        >
          {processedText}
        </ReactMarkdown>
        
        {!singleView && note.text.length > 1000 && !isExpanded && (
          <span 
            onClick={() => onExpand()} 
            className="h4 mx-2 px-1 rounded py-0 text-secondary border flex-sn-wrap"
          >
            <b>...</b>
          </span>
        )}
      </span>
    </>
  );
};

/**
 * Similarity Chunk Renderer - Focuses on highlighting chunks and fetching similarities
 * Renders all content as simple text blocks that can be highlighted
 */
export const SimilarityChunkRenderer = ({
  note,
  chunks = [],
  showToast = () => {},
}) => {
  if (!note || !note.text) return null;
  
  // Add debug logging to see what's in the chunks
  console.log("Chunks received in renderer:", chunks);
  
  // Check if chunks array is empty
  if (!chunks || chunks.length === 0) {
    return (
      <div className="alert alert-warning">
        No chunks available to display. Please try reloading the page.
      </div>
    );
  }
  
  return (
    <div className={`card-text similarity-mode ${isRTL(note.text) ? "text-end" : ""}`}
         dir={isRTL(note.text) ? "rtl" : "ltr"}>
      {chunks.map((chunk, index) => {
        const style = getHighlightStyle(chunk, true);
        
        // Account for different chunk data structures
        const chunkText = chunk.chunk_text || chunk.text || '';
        const chunkIndex = chunk.chunk_index !== undefined ? chunk.chunk_index : index;
        
        // Check for code blocks
        const isCodeBlock = chunkText.trim().match(/^```[\s\S]*```$/);
        
        // Content to render - handle code blocks specially
        const content = isCodeBlock ? (
          <pre 
            className="bg-body border p-3 my-3"
            data-chunk-index={chunkIndex}
            style={style}
          >
            {chunkText.replace(/^```([\s\S]*?)```$/g, (_, code) => code.trim())}
          </pre>
        ) : (
          <p 
            style={style}
            data-chunk-index={chunkIndex}
            className="mb-3 border-start border-primary ps-2"
          >
            {chunkText}
          </p>
        );
        
        // Always wrap in HoverableSimilarChunks
        return (
          <HoverableSimilarChunks 
            key={`chunk-${index}`}
            noteId={note.id} 
            enabled={true}
            chunkText={chunkText}
          >
            {content}
          </HoverableSimilarChunks>
        );
      })}
    </div>
  );
};
