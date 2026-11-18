/**
 * Text Cleaner module for Disaster Tweets NLP.
 * Handles lowercasing, URL removal, HTML removal, mentions, hashtags, and punctuation.
 */

export function toLowercase(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase();
}

export function removeUrls(text) {
  if (typeof text !== 'string') return '';
  // Removes http://, https://, and www. links
  return text
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function removeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/gi, 'and')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function handleMentions(text) {
  if (typeof text !== 'string') return '';
  // Replaces @user with space so neighboring words don't concatenate
  return text.replace(/@\w+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function handleHashtags(text) {
  if (typeof text !== 'string') return '';
  // Removes # but keeps the word e.g. #FloodRescue -> FloodRescue
  return text.replace(/#(\w+)/g, '$1').replace(/\s+/g, ' ').trim();
}

export function removePunctuation(text) {
  if (typeof text !== 'string') return '';
  // Retains alphanumerics, spaces, and intra-word hyphens or periods if in numbers
  return text
    .replace(/[^\w\s\.]|_/g, ' ')
    // Remove periods that are not between numbers (e.g., 6.5 kept, word... stripped)
    .replace(/(?<!\d)\.|\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executes standard text cleaning pipeline.
 *
 * @param {string} text - Raw input tweet text.
 * @param {Object} [options] - Configurable options.
 * @returns {string} Cleaned text.
 */
export function cleanText(text, options = {}) {
  if (text === null || text === undefined) return '';
  let str = typeof text === 'string' ? text : String(text);

  if (options.removeHtml !== false) {
    str = removeHtml(str);
  }

  if (options.removeUrls !== false) {
    str = removeUrls(str);
  }

  if (options.handleMentions !== false) {
    str = handleMentions(str);
  }

  if (options.handleHashtags !== false) {
    str = handleHashtags(str);
  }

  if (options.lowercase !== false) {
    str = toLowercase(str);
  }

  if (options.removePunctuation !== false) {
    str = removePunctuation(str);
  }

  return str.replace(/\s+/g, ' ').trim();
}

