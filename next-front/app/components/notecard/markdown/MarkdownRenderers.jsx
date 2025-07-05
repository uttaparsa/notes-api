import React from 'react';
import Link from 'next/link';
import { Button } from 'react-bootstrap';
import styles from "../NoteCard.module.css";
import { isRTL } from "../../../utils/stringUtils";
import { copyTextToClipboard } from "../../../utils/clipboardUtils";
import ResponsiveImage from './ResponsiveImage';
import YouTubeLink from '../YouTubeLink';
import { safeUrlEncode } from './UrlUtils';
import HoverableSimilarChunks from '../HoverableSimilarChunks'; // Import HoverableSimilarChunks


// Helper to extract text from ReactMarkdown children
const getNodeText = (childrenInput) => {
  let text = '';
  const recurse = (children) => {
    if (children === null || children === undefined) return;
    if (Array.isArray(children)) {
      children.forEach(recurse);
    } else if (typeof children === 'string') {
      text += children;
    } else if (typeof children === 'number') {
      text += String(children);
    } else if (typeof children === 'object' && children.props) {
      if (children.props.children) {
        recurse(children.props.children);
      } else if (typeof children.props.value === 'string') {
        text += children.props.value;
      }
    }
  };
  recurse(childrenInput);
  return text;
};

export const createCustomRenderers = (
  note, 
  similarityModeEnabled, 
  singleView, 
  shouldLoadLinks,
  showToast
) => {
  const baseRenderers = {
    p: (props) => <p {...props} />,
    h1: (props) => <h1 {...props} />,
    h2: (props) => <h2 {...props} />,
    h3: (props) => <h3 {...props} />,
    h4: (props) => <h4 {...props} />,
    h5: (props) => <h5 {...props} />,
    h6: (props) => <h6 {...props} />,
    li: (props) => <li {...props} />,
    blockquote: (props) => {
      const isRTLContent = props.children && 
        typeof props.children === 'string' && 
        isRTL(props.children);
      
      const blockquoteProps = {
        ...props,
        className: `${styles.blockquote} border-start ps-3 my-3 text-body-secondary`,
        dir: isRTLContent ? "rtl" : "ltr"
      };
      return <blockquote {...blockquoteProps}>{props.children}</blockquote>;
    },
    pre: ({ node, inline, className, children, ...props }) => {
      // Extract code string for copy functionality and potentially for chunkText
      const codeString = getNodeText(children).replace(/\n$/, '');
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
    code: ({ node, ...props }) => (
      <code className={styles.codeSnippet}>
        {props.children}
      </code>
    ),
    a: ({ href, children }) => {
      const encodedHref = safeUrlEncode(href);
      if (href.includes('youtube.com') || href.includes('youtu.be')) {
        return <YouTubeLink url={encodedHref} shouldLoadLinks={shouldLoadLinks} />;
      }
      return <Link href={encodedHref} rel="noopener noreferrer">{children}</Link>;
    },
    img: (props) => {
      const encodedSrc = safeUrlEncode(props.src);
      return <ResponsiveImage {...props} src={encodedSrc} />;
    },
    td: (props) => {
      // add padding to table cells
      return (
        <td {...props} style={{ padding: '0px 10px' }}>
          {props.children}
        </td>
      );
    },
    th: (props) => {
      // add padding to table header cells
      return (
        <th {...props} style={{ padding: '0px 10px' }}>
          {props.children}
        </th>
      );
    }
  };

  if (similarityModeEnabled) {
    const finalRenderers = { ...baseRenderers };
    const elementsToWrap = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre'];
    
    for (const elementType of elementsToWrap) {
      const originalRenderer = baseRenderers[elementType];
      if (!originalRenderer) continue;

      finalRenderers[elementType] = (props) => {
        const renderedElement = originalRenderer(props);
        const elementText = getNodeText(props.children); 

        if (elementText && elementText.trim()) {
          return (
            <HoverableSimilarChunks
              noteId={note.id}
              enabled={true}
              chunkText={elementText.trim()}
              // isChunkContainer will be false by default, appropriate for individual elements
            >
              {renderedElement}
            </HoverableSimilarChunks>
          );
        }
        return renderedElement;
      };
    }
    return finalRenderers;
  }

  return baseRenderers;
};
