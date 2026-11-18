/**
 * Stop-word removal module with Negation Preservation.
 *
 * In disaster tweets and sentiment analysis, negation words (e.g. "no fire", "not in danger")
 * dramatically alter semantic classification and must be retained.
 */

export const NEGATION_WORDS = new Set([
  'no',
  'not',
  'never',
  'neither',
  'nor',
  'none',
  'without',
  'hardly',
  'barely',
  'scarcely',
  'cannot',
  "can't",
  "won't",
  "don't",
  "didn't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  "couldn't",
  "shouldn't",
  "wouldn't",
]);

// Standard English stop-words (from NLTK/scikit-learn minus negation)
export const STANDARD_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself',
  'him', 'himself', 'his', 'how', "how's",
  'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', 'it', "it's", 'its', 'itself',
  'let', "let's",
  'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', "she'd", "she'll", "she's", 'should', 'so', 'some', 'such',
  'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', "there's", 'these',
  'they', "they'd", "they'll", "they're", "they've", 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up',
  'very',
  'was', 'we', "we'd", "we'll", "we're", "we've", 'were', 'what', "what's", 'when', "when's", 'where', "where's",
  'which', 'while', 'who', "who's", 'whom', 'why', "why's", 'with', 'would',
  'you', "you'd", "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves',
]);

/**
 * Checks if a token is a negation word.
 *
 * @param {string} token
 * @returns {boolean}
 */
export function isNegationWord(token) {
  if (typeof token !== 'string') return false;
  return NEGATION_WORDS.has(token.toLowerCase());
}

/**
 * Filters out stop words from a token array, optionally preserving negation tokens.
 *
 * @param {string[]} tokens - Array of word tokens.
 * @param {Object} [options] - Options object.
 * @param {boolean} [options.preserveNegation=true] - Whether to keep negation words.
 * @returns {string[]} Filtered tokens.
 */
export function removeStopWords(tokens, options = {}) {
  if (!Array.isArray(tokens)) return [];
  const preserveNegation = options.preserveNegation !== false;

  return tokens.filter((token) => {
    const lower = token.toLowerCase();

    if (preserveNegation && isNegationWord(lower)) {
      return true;
    }

    return !STANDARD_STOP_WORDS.has(lower);
  });
}
