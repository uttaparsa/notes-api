import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from "react-markdown";
import Link from 'next/link';
// Try using next/compat/router if available, fallback to regular router
import YouTubeLink from './YouTubeLink';
import remarkGfm from "remark-gfm";
import styles from "./NoteCard.module.css";
import { isRTL } from "../utils/stringUtils";
import { copyTextToClipboard } from "../utils/clipboardUtils";
import { Button, } from 'react-bootstrap';


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

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Custom hook for handling hash fragment navigation without relying on Next.js router
const useHashFragment = () => {
  const [currentHash, setCurrentHash] = useState('');
  
  useEffect(() => {
    // Function to handle hash changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        setCurrentHash(id);
        
        // Wait for DOM to be ready
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      }
    };

    // Handle initial hash on page load
    if (window.location.hash) {
      handleHashChange();
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Function to handle internal hash links
  const scrollToHash = (hash) => {
    const id = hash.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  return { scrollToHash, currentHash };
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
  shouldLoadLinks = true,
  showToast = () => {} 
}) => {
  const contentRef = useRef(null);
  const { scrollToHash } = useHashFragment();
  
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

  // Create heading components with proper ID handling
  const createHeadingComponent = (level) => {
    return ({ children, ...props }) => {
      const text = children.toString();
      const slug = slugify(text);
      const HeadingTag = `h${level}`;
      
      const handleClick = (e) => {
        e.preventDefault();
        
        // Update URL without full page reload
        const url = `${window.location.pathname}#${slug}`;
        window.history.pushState({}, '', url);
        
        // Scroll to element
        scrollToHash(`#${slug}`);
      };
      
      return (
        <HeadingTag id={slug} {...props}>
          
          <a 
            href={`#${slug}`}
            onClick={handleClick}
            className='unstyled-link'
            aria-label={`Link to ${text}`}

          >
            {children}
          </a>
        </HeadingTag>
      );
    };
  };

  const customRenderers = {
    h1: createHeadingComponent(1),
    h2: createHeadingComponent(2),
    h3: createHeadingComponent(3),
    h4: createHeadingComponent(4),
    h5: createHeadingComponent(5),
    h6: createHeadingComponent(6),
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

      // Handle internal hash links
      if (href.startsWith('#')) {
        return (
          <a 
            href={encodedHref}
            onClick={(e) => {
              e.preventDefault();
              scrollToHash(href);
              
              // Update URL without full page reload
              const url = `${window.location.pathname}${href}`;
              window.history.pushState({}, '', url);
            }}
          >
            {children}
          </a>
        );
      }

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
      ref={contentRef}
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
  );
};

export default NoteTextRenderer;