import React from 'react';
import Link from 'next/link';
import { Button } from 'react-bootstrap';
import styles from "../NoteCard.module.css";
import { isRTL } from "../../utils/stringUtils";
import { copyTextToClipboard } from "../../utils/clipboardUtils";
import HoverableSimilarChunks from '../HoverableSimilarChunks';
import ResponsiveImage from './ResponsiveImage';
import YouTubeLink from '../YouTubeLink';
import { safeUrlEncode } from './UrlUtils';
import { getChunkForText, getHighlightStyle } from './ChunkUtils';

/**
 * Creates a component wrapped with hoverable similarity feature
 */
export const withHoverableSimilarity = (Component, props, elementType, note, similarityModeEnabled, chunks, singleView) => {
  // Skip wrapping if not in single view or similarity mode not enabled
  if (!singleView || !similarityModeEnabled) {
    return <Component {...props} />;
  }
  
  // Generate a key for this component - safely extract text from props
  let keyText;
  if (typeof props.children === 'string') {
    keyText = props.children.slice(0, 20);
  } else {
    // Generate a safe identifier without stringifying the entire props object
    keyText = `${elementType}-${Math.random().toString(36).substring(2, 7)}`;
  }
  const key = `${elementType}-${keyText}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Look up chunk information for this content if it's a paragraph
  const chunk = elementType === 'p' && typeof props.children === 'string' 
    ? getChunkForText(props.children, chunks, note.text) 
    : null;
  
  // Apply highlighting style
  const style = getHighlightStyle(chunk, true);
  
  // Add data attributes for chunk tracking
  const dataAttributes = chunk ? {
    'data-chunk-index': chunk.chunk_index,
  } : {};
  
  // Create a new element with the combined props
  const updatedProps = {
    ...props,
    style: {...(props.style || {}), ...style},
    ...dataAttributes
  };
  
  return (
    <HoverableSimilarChunks 
      noteId={note.id} 
      key={key} 
      enabled={similarityModeEnabled}
    >
      <Component {...updatedProps} />
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
  p: (props) => withHoverableSimilarity('p', props, 'p', note, similarityModeEnabled, chunks, singleView),
  
  h1: props => withHoverableSimilarity('h1', props, 'h1', note, similarityModeEnabled, chunks, singleView),
  h2: props => withHoverableSimilarity('h2', props, 'h2', note, similarityModeEnabled, chunks, singleView),
  h3: props => withHoverableSimilarity('h3', props, 'h3', note, similarityModeEnabled, chunks, singleView),
  h4: props => withHoverableSimilarity('h4', props, 'h4', note, similarityModeEnabled, chunks, singleView),
  h5: props => withHoverableSimilarity('h5', props, 'h5', note, similarityModeEnabled, chunks, singleView),
  h6: props => withHoverableSimilarity('h6', props, 'h6', note, similarityModeEnabled, chunks, singleView),
  
  li: props => withHoverableSimilarity('li', props, 'li', note, similarityModeEnabled, chunks, singleView),
  
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
    
    return withHoverableSimilarity('blockquote', blockquoteProps, 'blockquote', note, similarityModeEnabled, chunks, singleView);
  },
  
  pre: ({ node, inline, className, children, ...props }) => {
    const codeString = String(children.props.children).replace(/\n$/, '');
    const copyCode = () => {
      copyTextToClipboard(codeString);
      showToast("Success", "Code copied to clipboard", 3000, "success");
    };
    
    const codeBlock = (
      <div className={styles.codeBlockWrapper}>
        <pre className={styles.codeBlock + " bg-body border"}>
          {children}
        </pre>
        <Button onClick={copyCode} variant="outline-primary" size="sm" className={styles.copyButton}>
          Copy
        </Button>
      </div>
    );
    
    return singleView && similarityModeEnabled ? (
      <HoverableSimilarChunks 
        noteId={note.id}
        enabled={similarityModeEnabled}
        key={`pre-${codeString.slice(0, 20)}-${Math.random().toString(36).substring(2, 7)}`}
      >
        {codeBlock}
      </HoverableSimilarChunks>
    ) : codeBlock;
  },
  
  code: ({ node, ...props }) => {
    const codeString = String(props.children).replace(/\n$/, '');
    const copyCode = (element) => {
      // check if parent element is not pre
      if (element.target.parentElement.tagName !== 'PRE') {
        copyTextToClipboard(codeString);
        showToast("Success", "Code copied to clipboard", 3000, "success");
      }
    };
    
    const codeElement = (
      <code onClick={copyCode} className={styles.codeSnippet}>
        {props.children}
      </code>
    );
    
    // Safely check if this is not inside a pre tag
    const isInlineCode = !(node.parent && node.parent.tagName === 'pre');
    
    // Inline code should be hoverable when not inside pre
    if (singleView && similarityModeEnabled && isInlineCode) {
      return (
        <HoverableSimilarChunks 
          noteId={note.id}
          enabled={similarityModeEnabled}
          key={`code-${codeString.slice(0, 20)}-${Math.random().toString(36).substring(2, 7)}`}
        >
          {codeElement}
        </HoverableSimilarChunks>
      );
    }
    
    return codeElement;
  },
  
  a: ({ href, children }) => {
    // Encode URLs with spaces
    const encodedHref = safeUrlEncode(href);

    if (href.includes('youtube.com') || href.includes('youtu.be')) {
      return <YouTubeLink url={encodedHref} shouldLoadLinks={shouldLoadLinks} />;
    }
    
    // Wrap links in HoverableSimilarChunks when in similarity mode
    const linkElement = <Link href={encodedHref} rel="noopener noreferrer">{children}</Link>;
    
    if (singleView && similarityModeEnabled) {
      return (
        <HoverableSimilarChunks 
          noteId={note.id} 
          enabled={similarityModeEnabled}
          key={`link-${href.slice(0, 20)}-${Math.random().toString(36).substring(2, 7)}`}
        >
          {linkElement}
        </HoverableSimilarChunks>
      );
    }
    
    return linkElement;
  },
  
  img: (props) => {
    // Encode image URLs with spaces
    const encodedSrc = safeUrlEncode(props.src);
    
    // Create responsive image component
    const imageComponent = <ResponsiveImage {...props} src={encodedSrc} />;
    
    // Make images hoverable for similarity search
    if (singleView && similarityModeEnabled) {
      return (
        <HoverableSimilarChunks 
          noteId={note.id} 
          enabled={similarityModeEnabled}
          key={`img-${props.src?.slice(0, 20)}-${Math.random().toString(36).substring(2, 7)}`}
        >
          <span>{imageComponent}</span>
        </HoverableSimilarChunks>
      );
    }
    
    return imageComponent;
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
