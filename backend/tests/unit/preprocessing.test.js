import { describe, it, expect } from 'vitest';
import {
  toLowercase,
  removeUrls,
  removeHtml,
  handleMentions,
  handleHashtags,
  cleanText,
} from '../../../nlp/preprocessing/textCleaner.js';
import { tokenize } from '../../../nlp/preprocessing/tokenizer.js';
import { removeStopWords, isNegationWord } from '../../../nlp/preprocessing/stopWords.js';
import { stemToken, stemTokens } from '../../../nlp/preprocessing/stemmer.js';
import { preprocessText } from '../../../nlp/preprocessing/preprocessText.js';

describe('Text Preprocessing Unit Tests (T06)', () => {
  describe('A. Lowercase conversion', () => {
    it('converts uppercase text into lowercase', () => {
      expect(toLowercase('THIS IS A DISASTER')).toBe('this is a disaster');
      expect(toLowercase('Flash FLOOD in Austin!')).toBe('flash flood in austin!');
    });
  });

  describe('B. URL removal', () => {
    it('removes http, https, and www URLs completely', () => {
      const input = 'Wildfire warning https://t.co/xyz123 and http://disaster.org visit www.emergency.gov';
      const result = removeUrls(input);
      expect(result).not.toMatch(/https?:\/\//);
      expect(result).not.toMatch(/www\./);
      expect(result.trim()).toBe('Wildfire warning and visit');
    });

    it('handles tweet containing only a URL', () => {
      expect(removeUrls('https://example.com/live')).toBe('');
    });
  });

  describe('C. HTML tag removal', () => {
    it('removes HTML tags and unescapes standard entities', () => {
      const input = '<b>Urgent:</b> Storm &amp; flood approaching <a href="#">link</a>';
      expect(removeHtml(input)).toBe('Urgent: Storm and flood approaching link');
    });
  });

  describe('D. Mention handling', () => {
    it('removes @username mentions without accidentally merging neighboring words', () => {
      const input = 'Evacuation notice from @CityPolice to @Citizens stay calm';
      const result = handleMentions(input);
      expect(result).not.toContain('@CityPolice');
      expect(result).toBe('Evacuation notice from to stay calm');
    });
  });

  describe('E. Hashtag handling', () => {
    it('preserves the hashtag word while removing the # symbol', () => {
      const input = 'Massive #FloodRescue underway in #California';
      expect(handleHashtags(input)).toBe('Massive FloodRescue underway in California');
    });
  });

  describe('F. Punctuation and special characters', () => {
    it('strips redundant punctuation while preserving word tokens', () => {
      const input = 'BREAKING!!! Earthquake magnitude 6.5??? Casualties reported...';
      const cleaned = cleanText(input);
      expect(cleaned).toBe('breaking earthquake magnitude 6.5 casualties reported');
    });

    it('handles tweet containing only punctuation', () => {
      expect(cleanText('!@#$%^&*()_+:;,./<>?~`')).toBe('');
    });
  });

  describe('G. Tokenization', () => {
    it('splits text into an array of clean word tokens', () => {
      const input = 'heavy storm causes power outage';
      expect(tokenize(input)).toEqual(['heavy', 'storm', 'causes', 'power', 'outage']);
    });

    it('returns empty array for empty string', () => {
      expect(tokenize('')).toEqual([]);
      expect(tokenize('   ')).toEqual([]);
    });
  });

  describe('H. Stop-word removal with Negation Preservation', () => {
    it('identifies negation words correctly', () => {
      expect(isNegationWord('not')).toBe(true);
      expect(isNegationWord('no')).toBe(true);
      expect(isNegationWord('never')).toBe(true);
      expect(isNegationWord('without')).toBe(true);
      expect(isNegationWord('the')).toBe(false);
    });

    it('removes generic stopwords but preserves crucial negation tokens', () => {
      const tokens = ['there', 'is', 'no', 'fire', 'and', 'we', 'are', 'not', 'in', 'danger'];
      const filtered = removeStopWords(tokens, { preserveNegation: true });
      expect(filtered).toContain('no');
      expect(filtered).toContain('not');
      expect(filtered).toContain('fire');
      expect(filtered).toContain('danger');
      expect(filtered).not.toContain('there');
      expect(filtered).not.toContain('is');
      expect(filtered).not.toContain('and');
    });
  });

  describe('I. Stemming (Porter Stemmer)', () => {
    it('reduces words to their stems using Porter algorithm', () => {
      expect(stemToken('evacuations')).toBe('evacu');
      expect(stemToken('burning')).toBe('burn');
      expect(stemToken('flooded')).toBe('flood');
      expect(stemToken('rescued')).toBe('rescu');
    });

    it('stems an array of tokens', () => {
      const tokens = ['rescuers', 'evacuating', 'burning', 'buildings'];
      expect(stemTokens(tokens)).toEqual(['rescuer', 'evacu', 'burn', 'build']);
    });
  });

  describe('Edge cases and safety', () => {
    it('safely handles empty, null, and non-string inputs', () => {
      expect(preprocessText('').tokens).toEqual([]);
      expect(preprocessText(null).tokens).toEqual([]);
      expect(preprocessText(undefined).tokens).toEqual([]);
      expect(preprocessText(12345).cleaned_text).toBe('12345');
    });

    it('handles unicode text properly', () => {
      const input = 'Fire in Tokyo 東京 emergency alert!';
      const res = preprocessText(input);
      expect(res.tokens).toContain('fire');
      expect(res.tokens).toContain('tokyo');
      expect(res.tokens).toContain('alert');
    });
  });

  describe('Full Preprocessing Pipeline', () => {
    it('executes end-to-end preprocessing pipeline returning structured stages', () => {
      const input = 'BREAKING! Flood rescue needed NOW! https://t.co/live #FloodRescue @user';
      const res = preprocessText(input, { removeStopWords: true, stemming: true });

      expect(res.original_text).toBe(input);
      expect(res.cleaned_text).toBe('breaking flood rescue needed now floodrescue');
      expect(res.tokens).toEqual(['breaking', 'flood', 'rescue', 'needed', 'now', 'floodrescue']);
      expect(res.filtered_tokens).toEqual(['breaking', 'flood', 'rescue', 'needed', 'floodrescue']);
      expect(res.stemmed_tokens).toEqual(['break', 'flood', 'rescu', 'need', 'floodrescu']);
      expect(res.final_text).toBe('break flood rescu need floodrescu');
      expect(res.options.removeStopWords).toBe(true);
      expect(res.options.stemming).toBe(true);
    });
  });
});
