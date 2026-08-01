/**
 * Duplicate Detection Engine for Question Migration
 * Implements 3 levels of duplicate detection:
 * 1. Exact Duplicate Hash (SHA-256 of Question + Options + Answer)
 * 2. Normalized Duplicate Hash (SHA-256 of Normalized Question ignoring punctuation/spaces/case)
 * 3. Partial Duplicate Similarity (Jaccard token similarity & Levenshtein distance)
 */

import { normalizeText, normalizeForHash } from "./textNormalization";

/**
 * Fast, self-contained SHA-256 implementation (works in Browser, Node, and Web Workers)
 */
export const sha256 = (str: string): string => {
  const utf8 = unescape(encodeURIComponent(str));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  const strLen = utf8.length * 8;
  words[strLen >> 5] |= 0x80 << (24 - (strLen % 32));
  words[(((strLen + 64) >> 9) << 4) + 15] = strLen;

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const w = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    for (let j = 0; j < 16; j++) w[j] = words[i + j] || 0;
    for (let j = 16; j < 64; j++) {
      const s0 =
        (w[j - 15] >>> 7 | w[j - 15] << 25) ^
        (w[j - 15] >>> 18 | w[j - 15] << 14) ^
        (w[j - 15] >>> 3);
      const s1 =
        (w[j - 2] >>> 17 | w[j - 2] << 15) ^
        (w[j - 2] >>> 19 | w[j - 2] << 13) ^
        (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (let j = 0; j < 64; j++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  return hash.map((h) => ("00000000" + (h >>> 0).toString(16)).slice(-8)).join("");
};

/**
 * Level 1: Exact Duplicate Hash
 * Hashes question + options + correct answer exactly as normalized
 */
export const generateExactDuplicateHash = (
  question: string,
  options: string[] = [],
  correctAnswer: string = ""
): string => {
  const normQ = normalizeText(question);
  const normOpts = options.map((opt) => normalizeText(opt)).join("|");
  const normAns = normalizeText(correctAnswer);
  const payload = `${normQ}||${normOpts}||${normAns}`;
  return sha256(payload);
};

/**
 * Level 2: Normalized Duplicate Hash
 * Hashes normalized question text ignoring punctuation, spaces, case
 */
export const generateNormalizedHash = (question: string): string => {
  const norm = normalizeForHash(question);
  return sha256(norm);
};

/**
 * Level 3: Partial Duplicate Hash (Canonical Token Cluster Hash)
 * Sorts unique tokens (length >= 3) to group similar questions into clusters
 */
export const generatePartialDuplicateHash = (question: string): string => {
  const norm = normalizeForHash(question);
  const STOPWORDS = new Set([
    "a", "an", "the", "is", "are", "was", "were", "in", "on", "at", "for", "to", "of", "and", "or",
    "with", "by", "from", "that", "this", "it", "as", "be", "has", "have", "had", "do", "does", "did",
    "which", "what", "when", "where", "how", "used", "type", "device", "unit"
  ]);

  const tokens = Array.from(
    new Set(
      norm
        .split(" ")
        .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    )
  ).sort();

  const canonicalTokens = tokens.slice(0, 10).join("_");
  return sha256(canonicalTokens || norm);
};

/**
 * Jaccard Similarity Coefficient between two text strings
 * Returns a score between 0.0 (no similarity) and 1.0 (identical tokens)
 */
export const calculateJaccardSimilarity = (textA: string, textB: string): number => {
  const normA = normalizeForHash(textA);
  const normB = normalizeForHash(textB);

  const tokensA = new Set(normA.split(" ").filter((w) => w.length > 2));
  const tokensB = new Set(normB.split(" ").filter((w) => w.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
};

/**
 * Levenshtein Distance Similarity ratio between 0.0 and 1.0
 */
export const calculateLevenshteinSimilarity = (str1: string, str2: string): number => {
  const a = normalizeForHash(str1);
  const b = normalizeForHash(str2);

  if (a === b) return 1.0;
  if (!a.length || !b.length) return 0.0;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
};

/**
 * Check if two questions are partial duplicates based on configurable threshold (default 0.75)
 */
export const isPartialDuplicate = (
  textA: string,
  textB: string,
  threshold: number = 0.75
): { isDuplicate: boolean; jaccardScore: number; levenshteinScore: number } => {
  const jaccardScore = calculateJaccardSimilarity(textA, textB);
  const levenshteinScore = calculateLevenshteinSimilarity(textA, textB);
  const maxScore = Math.max(jaccardScore, levenshteinScore);

  return {
    isDuplicate: maxScore >= threshold,
    jaccardScore,
    levenshteinScore,
  };
};
