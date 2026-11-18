import {
  toLowercase,
  removeUrls,
  removeHtml,
  handleMentions,
  handleHashtags,
  cleanText,
} from './textCleaner.js';
import { tokenize } from './tokenizer.js';
import { removeStopWords } from './stopWords.js';
import { stemTokens } from './stemmer.js';

/**
 * Executes the complete NLP preprocessing pipeline on an input text.
 *
 * @param {string} rawText - Input raw tweet string.
 * @param {Object} [customOptions] - Preprocessing options.
 * @returns {Object} Structured preprocessing results across each stage.
 */
export function preprocessText(rawText, customOptions = {}) {
  const original = rawText === null || rawText === undefined ? '' : String(rawText);

  const options = {
    lowercase: customOptions.lowercase !== false,
    removeUrls: customOptions.removeUrls !== false,
    removeHtml: customOptions.removeHtml !== false,
    handleMentions: customOptions.handleMentions !== false,
    handleHashtags: customOptions.handleHashtags !== false,
    removeStopWords: customOptions.removeStopWords !== false,
    preserveNegation: customOptions.preserveNegation !== false,
    stemming: customOptions.stemming !== false,
  };

  // Intermediate transformations for transparency
  const lowercaseText = toLowercase(original);
  const urlCleanedText = removeUrls(original);
  const htmlCleanedText = removeHtml(urlCleanedText);
  const mentionHashtagText = handleHashtags(handleMentions(htmlCleanedText));

  // Cleaned text representation
  const cleanedText = cleanText(original, options);

  // Tokenization
  const tokens = tokenize(cleanedText);

  // Stop-word filtering
  let filteredTokens = tokens;
  if (options.removeStopWords) {
    filteredTokens = removeStopWords(tokens, {
      preserveNegation: options.preserveNegation,
    });
  }

  // Stemming
  let stemmedTokens = filteredTokens;
  if (options.stemming) {
    stemmedTokens = stemTokens(filteredTokens);
  }

  const finalText = stemmedTokens.join(' ');

  return {
    original_text: original,
    lowercase_text: lowercaseText,
    url_cleaned_text: urlCleanedText,
    html_cleaned_text: htmlCleanedText,
    mention_hashtag_text: mentionHashtagText,
    cleaned_text: cleanedText,
    tokens,
    filtered_tokens: filteredTokens,
    stemmed_tokens: stemmedTokens,
    final_text: finalText,
    options,
  };
}

