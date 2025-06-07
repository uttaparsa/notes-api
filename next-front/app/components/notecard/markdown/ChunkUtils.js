

/**
 * Get highlight style for a chunk
 * @param {Object} chunk - The chunk object
 * @param {boolean} highlightChunks - Whether chunks should be highlighted
 * @returns {Object} - Style object for the chunk
 */
export const getHighlightStyle = (chunk, highlightChunks) => {
  if (highlightChunks && chunk) {
    return {
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      transition: 'background-color 0.5s ease-out',
      padding: '5px',
      borderRadius: '3px',
      marginBottom: '10px',
      borderLeft: '2px solid rgba(0, 123, 255, 0.5)',
    };
  }
  return {};
};
