import React from 'react';
import ReactMarkdown from "react-markdown";
import Link from 'next/link';
import YouTubeLink from './YouTubeLink';
import remarkGfm from "remark-gfm";
import styles from "./NoteCard.module.css";
import { isRTL } from "../utils/stringUtils";

// Helper function to safely encode URLs
const safeUrlEncode = (url) => {
  try {
    // First, check if it's already a valid URL
    new URL(url);
    // If it is, encode spaces and other problematic characters
    return url.replace(/ /g, '%20');
  } catch {
    // If not a valid URL, return the original string
    return url;
  }
};

const ResponsiveImage = ({ src, alt, title }) => {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <span 
        ref={containerRef} 
        className={`${styles.markdownImage} ${isFullscreen ? styles.fullscreenContainer : ''}`}
        onClick={toggleFullscreen}
      >
        <img
          src={src}
          alt={alt || ''}
          title={title || ''}
          className={`${styles.responsiveImage} ${isFullscreen ? styles.fullscreenImage : ''}`}
        />
      </span>

      {isFullscreen && (
        <div 
          className={styles.overlay}
          onClick={toggleFullscreen}
        />
      )}
    </>
  );
};

const NoteTextRenderer = ({ 
  note, 
  singleView = false, 
  isExpanded = false, 
  onExpand = () => {}, 
  shouldLoadLinks = true 
}) => {
  const processNoteText = (note) => {
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

  const customRenderers = {
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
            Copy </Button>
        </div>
      );
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
      return <ResponsiveImage {...props} src={encodedSrc} />;
    }, 
  };

  const processedText = processNoteText(note);

  return (
    <span
      className={`card-text ${isRTL(note.text) ? "text-end" : ""}`}
      dir={isRTL(note.text) ? "rtl" : "ltr"}
    >
      <ReactMarkdown 
        components={customRenderers} 
        remarkPlugins={[remarkGfm]} 
        className={` ${isRTL(note.text) ? styles.rtlMarkdown : ''}`}
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
  );
};

export default NoteTextRenderer;