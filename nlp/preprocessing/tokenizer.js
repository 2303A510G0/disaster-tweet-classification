/**
 * Tokenizer module for Disaster Tweets NLP.
 * Splits text into an array of clean word tokens.
 */

export function tokenize(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return [];
  }

  // Matches sequences of alphanumeric characters and words
  const rawTokens = text.trim().split(/\s+/);
  const cleanTokens = [];

  for (const token of rawTokens) {
    const cleaned = token.replace(/^[^\w\d]+|[^\w\d]+$/g, '').trim();
    if (cleaned.length > 0) {
      cleanTokens.push(cleaned);
    }
  }

  return cleanTokens;
}

