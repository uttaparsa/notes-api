import React from 'react';
import Link from 'next/link';
import { Button } from 'react-bootstrap';
import styles from "../NoteCard.module.css";
import { isRTL } from "../../utils/stringUtils";
import { copyTextToClipboard } from "../../utils/clipboardUtils";
import ResponsiveImage from './ResponsiveImage';
import YouTubeLink from '../YouTubeLink';
import { safeUrlEncode } from './UrlUtils';
import { getHighlightStyle } from './ChunkUtils';
import HoverableSimilarChunks from '../HoverableSimilarChunks';

/**
 * Creates a component with applied styling based on similarity if needed
 */
export const withSimilarityStyles = (Component, props, elementType, note, similarityModeEnabled) => {
  // Skip style application if similarity mode not enabled
  if (!similarityModeEnabled) {
    return <Component {...props} />;
  }
  
  // If similarity mode is enabled, wrap the component in HoverableSimilarChunks
  // to get the hover effects and margin sidebar integration
  return (
    <HoverableSimilarChunks 
      noteId={note.id} 
      enabled={similarityModeEnabled} 
      chunkText={props.children}
    >
      <Component {...props} />
    </HoverableSimilarChunks>
  );
};

/**
 * Creates a set of custom renderers for markdown components
 */
export const createCustomRenderers = (
  note, 
  similarityModeEnabled, 
  chunks, 
  singleView, 
  shouldLoadLinks,
  showToast
) => ({
  p: (props) => withSimilarityStyles('p', props, 'p', note, similarityModeEnabled, chunks),
  
  h1: props => withSimilarityStyles('h1', props, 'h1', note, similarityModeEnabled, chunks),
  h2: props => withSimilarityStyles('h2', props, 'h2', note, similarityModeEnabled, chunks),
  h3: props => withSimilarityStyles('h3', props, 'h3', note, similarityModeEnabled, chunks),
  h4: props => withSimilarityStyles('h4', props, 'h4', note, similarityModeEnabled, chunks),
  h5: props => withSimilarityStyles('h5', props, 'h5', note, similarityModeEnabled, chunks),
  h6: props => withSimilarityStyles('h6', props, 'h6', note, similarityModeEnabled, chunks),
  
  li: props => withSimilarityStyles('li', props, 'li', note, similarityModeEnabled, chunks),
  
  blockquote: (props) => {
    const isRTLContent = props.children && 
      typeof props.children === 'string' && 
      isRTL(props.children);
    
    // Create blockquote with RTL support
    const blockquoteProps = {
      ...props,
      className: `${styles.blockquote} border-start ps-3 my-3 text-body-secondary`,
      dir: isRTLContent ? "rtl" : "ltr"
    };
    
    return withSimilarityStyles('blockquote', blockquoteProps, 'blockquote', note, similarityModeEnabled, chunks);
  },
  
  pre: ({ node, inline, className, children, ...props }) => {
    const codeString = String(children.props.children).replace(/\n$/, '');
    const copyCode = () => {
      copyTextToClipboard(codeString);
      showToast("Success", "Code copied to clipboard", 3000, "success");
    };
    
    return (
      <div className={styles.codeBlockWrapper}>
        <pre className={styles.codeBlock + " bg-body border"}>
          {children}
        </pre>
        <Button onClick={copyCode} variant="outline-primary" size="sm" className={styles.copyButton}>
          Copy
        </Button>
      </div>
    );
  },
  
  code: ({ node, ...props }) => {
    const codeString = String(props.children).replace(/\n$/, '');
    const copyCode = (event) => {
      // Check if parent element is not pre by checking the DOM hierarchy
      const parentPre = event.target.closest('pre');
      if (!parentPre || parentPre.contains(event.target) && parentPre !== event.target) {
        copyTextToClipboard(codeString);
        showToast("Success", "Code copied to clipboard", 3000, "success");
      }
    };
    
    return (
      <code onClick={copyCode} className={styles.codeSnippet}>
        {props.children}
      </code>
    );
  },
  
  a: ({ href, children }) => {
    // Encode URLs with spaces
    const encodedHref = safeUrlEncode(href);

    if (href.includes('youtube.com') || href.includes('youtu.be')) {
      return <YouTubeLink url={encodedHref} shouldLoadLinks={shouldLoadLinks} />;
    }
    
    return <Link href={encodedHref} rel="noopener noreferrer">{children}</Link>;
  },
  
  img: (props) => {
    // Encode image URLs with spaces
    const encodedSrc = safeUrlEncode(props.src);
    
    // Create responsive image component
    return <ResponsiveImage {...props} src={encodedSrc} />;
  },
});

/**
 * Process note text for markdown rendering
 */
export const processNoteText = (note, singleView, isExpanded) => {
  let text = singleView || note.text.length < 1000 || isExpanded
    ? note.text
    : note.text.substring(0, 1000);

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
