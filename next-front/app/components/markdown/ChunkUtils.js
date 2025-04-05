/**
 * Find the chunk that contains a specific text position
 * @param {number} position - The position in text
 * @param {Array} chunks - Array of chunks
 * @returns {Object|null} - The matching chunk or null
 */
export const findChunkForPosition = (position, chunks) => {
  if (!chunks || chunks.length === 0) return null;
  
  let currentPos = 0;
  for (const chunk of chunks) {
    const chunkLength = chunk.chunk_text.length;
    if (position >= currentPos && position < currentPos + chunkLength) {
      return chunk;
    }
    currentPos += chunkLength;
  }
  return null;
};

/**
 * Get the chunk for a specific text
 * @param {string} text - The text to find in chunks
 * @param {Array} chunks - Array of chunks
 * @param {string} fullText - The complete note text
 * @returns {Object|null} - The matching chunk or null
 */
export const getChunkForText = (text, chunks, fullText) => {
  if (!chunks || chunks.length === 0) return null;
  
  // Try to find an exact match first
  const exactMatch = chunks.find(chunk => chunk.chunk_text === text);
  if (exactMatch) return exactMatch;
  
  // If no exact match, try to find the first chunk that contains this text
  const containingChunk = chunks.find(chunk => chunk.chunk_text.includes(text));
  if (containingChunk) return containingChunk;
  
  // If all else fails, find position in the full text
  const position = fullText.indexOf(text);
  if (position >= 0) {
    return findChunkForPosition(position, chunks);
  }
  
  return null;
};

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
