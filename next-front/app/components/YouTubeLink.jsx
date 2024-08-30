import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import styles from './NoteCard.module.css';

const getMetadata = async (url) => {
  const videoUrl = encodeURIComponent(url);
  const requestUrl = `https://youtube.com/oembed?url=${videoUrl}&format=json`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    return null;
  }
};

const YouTubeLink = ({ url, shouldLoadLinks }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMetadata = async () => {
      if (!shouldLoadLinks) return;

      // Check if the title is already in local storage
      const storedTitle = localStorage.getItem(url);
      if (storedTitle) {
        setMetadata({ title: storedTitle });
        return;
      }

      try {
        setLoading(true);
        const data = await getMetadata(url);
        if (isMounted) {
          setMetadata(data);
          setLoading(false);
          // Save the title to local storage
          if (data && data.title) {
            localStorage.setItem(url, data.title);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [url, shouldLoadLinks]);

  if (!shouldLoadLinks || error || (!loading && !metadata)) {
    return <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>;
  }

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  return (
    <span className={styles.youtubeLink}>
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.youtubeUrl}>
        {url}
      </a>
      <span className={styles.youtubeTitleWrapper}>
        <span className={styles.youtubeIcon}>▶</span>
        <span className={styles.youtubeTitle} title={metadata.title}>
          {metadata.title}
        </span>
      </span>
    </span>
  );
};

export default YouTubeLink;