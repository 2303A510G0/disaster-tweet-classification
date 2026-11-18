/**
 * Canonical Porter Stemmer Implementation (Martin Porter, 1980).
 * Self-contained, dependency-free implementation for JavaScript NLP.
 */

const step2list = {
  ational: 'ate',
  tional: 'tion',
  enci: 'ence',
  anci: 'ance',
  izer: 'ize',
  bli: 'ble',
  alli: 'al',
  entli: 'ent',
  eli: 'e',
  ousli: 'ous',
  ization: 'ize',
  ation: 'ate',
  ator: 'ate',
  alism: 'al',
  iveness: 'ive',
  fulness: 'ful',
  ousness: 'ous',
  aliti: 'al',
  iviti: 'ive',
  biliti: 'ble',
  logi: 'log',
};

const step3list = {
  icate: 'ic',
  ative: '',
  alize: 'al',
  iciti: 'ic',
  ical: 'ic',
  ful: '',
  ness: '',
};

const c = '[^aeiou]'; // consonant
const v = '[aeiouy]'; // vowel
const C = `${c}[^aeiouy]*`; // consonant sequence
const V = `${v}[aeiou]*`; // vowel sequence

const mgr0 = new RegExp(`^(${C})?${V}${C}`); // m > 0
const meq1 = new RegExp(`^(${C})?${V}${C}(${V})?$`); // m == 1
const mgr1 = new RegExp(`^(${C})?${V}${C}${V}${C}`); // m > 1
const s_v = new RegExp(`^(${C})?${v}`); // vowel in stem

/**
 * Applies the Porter Stemming algorithm to an English word.
 *
 * @param {string} word - Lowercase word to stem.
 * @returns {string} Stemmed word.
 */
export function stemToken(word) {
  if (typeof word !== 'string' || word.trim() === '') return '';
  const w = word.trim().toLowerCase();
  if (w.length < 3) return w;

  let stem;
  let suffix;
  let firstch = w.slice(0, 1);
  let str = w;

  if (firstch === 'y') {
    str = 'Y' + str.slice(1);
  }

  // Step 1a
  let re = /^(.+?)(ss|i)es$/;
  let re2 = /^(.+?)([^s])s$/;

  if (re.test(str)) {
    str = str.replace(re, '$1$2');
  } else if (/^(.+?)ies$/.test(str)) {
    str = str.replace(/^(.+?)ies$/, '$1i');
  } else if (/^(.+?)ss$/.test(str)) {
    // keep ss
  } else if (re2.test(str)) {
    str = str.replace(re2, '$1$2');
  }

  // Step 1b
  re = /^(.+?)eed$/;
  re2 = /^(.+?)(ed|ing)$/;
  if (re.test(str)) {
    const fp = re.exec(str);
    re = new RegExp(mgr0);
    if (re.test(fp[1])) {
      re = /.$/;
      str = str.replace(re, '');
    }
  } else if (re2.test(str)) {
    const fp = re2.exec(str);
    stem = fp[1];
    re2 = new RegExp(s_v);
    if (re2.test(stem)) {
      str = stem;
      re2 = /(at|bl|iz)$/;
      if (re2.test(str)) {
        str = str + 'e';
      } else if (new RegExp('([^aeiouylsz])\\1$').test(str)) {
        re = /.$/;
        str = str.replace(re, '');
      } else if (new RegExp(`^${C}${v}[^aeiouwxy]$`).test(str)) {
        str = str + 'e';
      }
    }
  }

  // Step 1c
  re = /^(.+?)y$/;
  if (re.test(str)) {
    const fp = re.exec(str);
    stem = fp[1];
    re = new RegExp(s_v);
    if (re.test(stem)) {
      str = stem + 'i';
    }
  }

  // Step 2
  re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (re.test(str)) {
    const fp = re.exec(str);
    stem = fp[1];
    suffix = fp[2];
    re = new RegExp(mgr0);
    if (re.test(stem)) {
      str = stem + step2list[suffix];
    }
  }

  // Step 3
  re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (re.test(str)) {
    const fp = re.exec(str);
    stem = fp[1];
    suffix = fp[2];
    re = new RegExp(mgr0);
    if (re.test(stem)) {
      str = stem + step3list[suffix];
    }
  }

  // Step 4
  re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  re2 = /^(.+?)(s|t)(ion)$/;
  if (re.test(str)) {
    const fp = re.exec(str);
    stem = fp[1];
    re = new RegExp(mgr1);
    if (re.test(stem)) {
      str = stem;
    }
  } else if (re2.test(str)) {
    const fp = re2.exec(str);
    stem = fp[1] + fp[2];
    re2 = new RegExp(mgr1);
    if (re2.test(stem)) {
      str = stem;
    }
  }

  // Step 5
  re = /^(.+?)e$/;
  if (re.test(str)) {
    const fp = re.exec(str);
    stem = fp[1];
    re = new RegExp(mgr1);
    re2 = new RegExp(meq1);
    const re3 = new RegExp(`^${C}${v}[^aeiouwxy]$`);
    if (re.test(stem) || (re2.test(stem) && !re3.test(stem))) {
      str = stem;
    }
  }

  re = /ll$/;
  re2 = new RegExp(mgr1);
  if (re.test(str) && re2.test(str)) {
    re = /.$/;
    str = str.replace(re, '');
  }

  if (firstch === 'y') {
    str = 'y' + str.slice(1);
  }

  return str;
}

/**
 * Stems an array of word tokens.
 *
 * @param {string[]} tokens - Words to stem.
 * @returns {string[]} Array of stems.
 */
export function stemTokens(tokens) {
  if (!Array.isArray(tokens)) return [];
  return tokens.map((t) => stemToken(t)).filter((t) => t.length > 0);
}
