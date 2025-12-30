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

/**
 * Check if a URL is external (not on the same domain)
 * @param {string} href - The URL to check
 * @returns {boolean} - True if the URL is external
 */
export const isExternalLink = (href) => {
  if (!href) return false;
  
  if (href.startsWith('/') || href.startsWith('#')) {
    return false;
  }
  
  try {
    const url = new URL(href, window.location.origin);
    return url.origin !== window.location.origin;
  } catch {
    return href.startsWith('http://') || href.startsWith('https://');
  }
};
