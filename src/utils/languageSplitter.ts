/**
 * Language Detection & Splitting Engine for Question Migration
 * Detects and splits bilingual text (English | Marathi) into standalone fields.
 */

import { normalizeText } from "./textNormalization";

export type LanguageType = "english" | "marathi" | "bilingual" | "unknown";

export interface SplitResult {
  english: string;
  marathi: string;
  languageType: LanguageType;
}

export interface SplitOptionsResult {
  optionsEnglish: string[];
  optionsMarathi: string[];
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const LATIN_REGEX = /[a-zA-Z]/;

/**
 * Checks if a string contains Devanagari (Marathi) characters
 */
export const hasDevanagari = (text: string): boolean => {
  return DEVANAGARI_REGEX.test(text || "");
};

/**
 * Checks if a string contains Latin (English) characters
 */
export const hasLatin = (text: string): boolean => {
  return LATIN_REGEX.test(text || "");
};

/**
 * Split a single bilingual string into English and Marathi components
 */
export const splitLanguage = (rawText: string): SplitResult => {
  if (!rawText || !rawText.trim()) {
    return { english: "", marathi: "", languageType: "unknown" };
  }

  const cleaned = normalizeText(rawText);

  // Strategy 1: Explicit pipe separator ("|", "│", "丨")
  if (/[|│丨]/.test(cleaned)) {
    const parts = cleaned.split(/[|│丨]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      let englishPart = "";
      let marathiPart = "";

      for (const part of parts) {
        if (hasDevanagari(part) && !marathiPart) {
          marathiPart = part;
        } else if (hasLatin(part) && !englishPart) {
          englishPart = part;
        }
      }

      // If one part is assigned, assign the remaining to the other
      if (!englishPart && marathiPart) {
        englishPart = parts.find((p) => p !== marathiPart) || "";
      } else if (!marathiPart && englishPart) {
        marathiPart = parts.find((p) => p !== englishPart) || "";
      }

      if (englishPart && marathiPart) {
        return {
          english: englishPart,
          marathi: marathiPart,
          languageType: "bilingual",
        };
      }
    }
  }

  // Strategy 2: Multiline separator (\n or \r\n)
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => normalizeText(l))
    .filter(Boolean);

  if (lines.length >= 2) {
    let engLines: string[] = [];
    let marLines: string[] = [];

    lines.forEach((line) => {
      if (hasDevanagari(line) && !hasLatin(line)) {
        marLines.push(line);
      } else if (hasLatin(line) && !hasDevanagari(line)) {
        engLines.push(line);
      } else if (hasDevanagari(line) && hasLatin(line)) {
        // Mixed line inside multiline
        if (hasDevanagari(line)) marLines.push(line);
        if (hasLatin(line)) engLines.push(line);
      }
    });

    if (engLines.length > 0 && marLines.length > 0) {
      return {
        english: engLines.join(" "),
        marathi: marLines.join(" "),
        languageType: "bilingual",
      };
    }
  }

  // Strategy 3: Monolingual checks
  const containsMarathi = hasDevanagari(cleaned);
  const containsEnglish = hasLatin(cleaned);

  if (containsEnglish && !containsMarathi) {
    return {
      english: cleaned,
      marathi: "",
      languageType: "english",
    };
  }

  if (containsMarathi && !containsEnglish) {
    return {
      english: "",
      marathi: cleaned,
      languageType: "marathi",
    };
  }

  // Strategy 4: Embedded mixed text without clear separator
  if (containsEnglish && containsMarathi) {
    // Attempt sentence/clause splitting or fall back to unknown while preserving raw text
    return {
      english: cleaned,
      marathi: cleaned,
      languageType: "unknown",
    };
  }

  return {
    english: cleaned,
    marathi: "",
    languageType: "unknown",
  };
};

/**
 * Splits options array into separate optionsEnglish[] and optionsMarathi[] arrays
 */
export const splitOptions = (rawOptions: string[] = []): SplitOptionsResult => {
  const optionsEnglish: string[] = [];
  const optionsMarathi: string[] = [];

  for (const opt of rawOptions) {
    const split = splitLanguage(opt);
    // If English option is missing in bilingual split, fallback to raw option or Marathi
    optionsEnglish.push(split.english || split.marathi || normalizeText(opt));
    optionsMarathi.push(split.marathi || split.english || normalizeText(opt));
  }

  return {
    optionsEnglish,
    optionsMarathi,
  };
};
