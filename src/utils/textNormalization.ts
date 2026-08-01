/**
 * Text Normalization Module for Question Migration
 * Standardizes raw text before language splitting, hashing, and index creation.
 */

// Strip HTML tags (<p>, <br>, <b>, etc.)
export const stripHtml = (text: string): string => {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, " ");
};

// Strip Markdown formatting (*bold*, _italic_, `code`, etc.)
export const stripMarkdown = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
};

// Remove invisible unicode characters (zero-width spaces, BOM, control chars)
export const removeInvisibleUnicode = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ") // Zero-width spaces, BOM, NBSP
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " "); // Control characters
};

// Strip prefix option markers like "A.", "A)", "(A)", "A -", "1.", "a:"
export const stripOptionPrefix = (text: string): string => {
  if (!text) return "";
  return text.replace(/^(?:[A-Da-d1-4][\s.:)\-]+\s*|\([A-Da-d1-4]\)\s*)/, "").trim();
};

// Remove duplicate consecutive punctuation (e.g., "???" -> "?", "..." -> ".")
export const normalizePunctuation = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\?{2,}/g, "?")
    .replace(/!{2,}/g, "!")
    .replace(/\.{2,}/g, ".")
    .replace(/,{2,}/g, ",")
    .replace(/-{2,}/g, "-");
};

// Normalize Unicode (NFKC), clean extra spaces, tabs, line breaks
export const normalizeWhitespace = (text: string): string => {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .replace(/[\r\n\t\v]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Standard Full Text Normalization
 * Used for general text cleaning and preparing searchable content
 */
export const normalizeText = (text: string): string => {
  if (!text) return "";
  let cleaned = stripHtml(text);
  cleaned = stripMarkdown(cleaned);
  cleaned = removeInvisibleUnicode(cleaned);
  cleaned = stripOptionPrefix(cleaned);
  cleaned = normalizePunctuation(cleaned);
  cleaned = normalizeWhitespace(cleaned);
  return cleaned;
};

/**
 * Strict Normalization for Hashing and Duplicate Matching
 * Lowercases English, removes all punctuation, converts to compact form
 */
export const normalizeForHash = (text: string): string => {
  if (!text) return "";
  let cleaned = normalizeText(text).toLowerCase();
  // Keep alphanumeric English, Devanagari (\u0900-\u097F), numbers and spaces
  cleaned = cleaned.replace(/[^\w\s\u0900-\u097F]/gi, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
};
