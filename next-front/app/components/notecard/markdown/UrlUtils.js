/**
 * Helper function to safely encode URLs
 * @param {string} url - The URL to encode
 * @returns {string} - The safely encoded URL
 */
export const safeUrlEncode = (url) => {
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
