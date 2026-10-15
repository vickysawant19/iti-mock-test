import { splitLanguage, hasDevanagari, hasLatin } from "./languageSplitter";

/**
 * Resolves question content with full Version 2 (schemaVersion: 2) multilingual support.
 * Handles English, Marathi, Bilingual (English + Marathi), option images, and provides diagnostics.
 *
 * @param {Object} question - The raw or hydrated question object
 * @param {"bilingual" | "english" | "marathi"} languageMode - Current language view mode
 * @returns {Object} Normalized question ready for rendering
 */
export function resolveQuestion(question, languageMode = "bilingual") {
  if (!question || typeof question !== "object") {
    return {
      isValid: false,
      isMissing: true,
      missingReason: "Question item is null or invalid in exam paper data.",
      questionId: null,
      questionText: "",
      questionEnglish: "",
      questionMarathi: "",
      options: [],
      schemaVersion: 1,
      languageType: "unknown",
      images: [],
    };
  }

  const questionId = question.$id || question.id || null;
  const schemaVersion = question.schemaVersion || 1;

  // 1. Resolve Question Texts (English & Marathi)
  let qEng = (question.questionEnglish || "").trim();
  let qMar = (question.questionMarathi || "").trim();

  if (!qEng && !qMar && question.question) {
    const rawQ = String(question.question).trim();
    if (rawQ.includes("|") || rawQ.includes("│") || rawQ.includes("丨")) {
      const split = splitLanguage(rawQ);
      qEng = split.english || rawQ.split(/[|│丨]/)[0].trim();
      qMar = split.marathi || rawQ.split(/[|│丨]/)[1]?.trim() || "";
    } else if (hasDevanagari(rawQ) && !hasLatin(rawQ)) {
      qMar = rawQ;
    } else {
      qEng = rawQ;
    }
  }

  // 2. Resolve Options
  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const rawOptsEng = Array.isArray(question.optionsEnglish) ? question.optionsEnglish : [];
  const rawOptsMar = Array.isArray(question.optionsMarathi) ? question.optionsMarathi : [];
  const optionImageUrls = Array.isArray(question.optionImageUrls) ? question.optionImageUrls : [];

  const maxOptionsCount = Math.max(rawOptions.length, rawOptsEng.length, rawOptsMar.length, 0);
  const resolvedOptions = [];

  for (let i = 0; i < maxOptionsCount; i++) {
    let optEng = (rawOptsEng[i] || "").trim();
    let optMar = (rawOptsMar[i] || "").trim();
    const rawOpt = rawOptions[i] ? String(rawOptions[i]).trim() : "";

    if (!optEng && !optMar && rawOpt) {
      if (rawOpt.includes("|") || rawOpt.includes("│") || rawOpt.includes("丨")) {
        const split = splitLanguage(rawOpt);
        optEng = split.english || rawOpt.split(/[|│丨]/)[0].trim();
        optMar = split.marathi || rawOpt.split(/[|│丨]/)[1]?.trim() || "";
      } else if (hasDevanagari(rawOpt) && !hasLatin(rawOpt)) {
        optMar = rawOpt;
      } else {
        optEng = rawOpt;
      }
    }

    const optImageUrl = optionImageUrls[i] || null;

    resolvedOptions.push({
      index: i,
      letter: String.fromCharCode(65 + i),
      english: optEng,
      marathi: optMar,
      raw: rawOpt,
      imageUrl: optImageUrl,
      hasBilingual: !!(optEng && optMar),
    });
  }

  // 3. Resolve Images (V1 legacy array + V2 direct URL + imageId)
  const resolvedImages = [];
  if (question.questionImageUrl && typeof question.questionImageUrl === "string" && question.questionImageUrl.trim()) {
    resolvedImages.push({
      id: "v2-q-img",
      url: question.questionImageUrl.trim(),
      name: "Question Image",
    });
  }

  if (Array.isArray(question.images) && question.images.length > 0) {
    question.images.forEach((img, idx) => {
      try {
        const parsed = typeof img === "string" ? JSON.parse(img) : img;
        if (parsed?.url) {
          resolvedImages.push({
            id: parsed.id || `v1-img-${idx}`,
            url: parsed.url,
            name: parsed.name || "Question Diagram",
          });
        }
      } catch {}
    });
  }

  // 4. Missing / Broken Question Detection & Diagnostics
  const hasText = !!(qEng || qMar || question.question);
  const hasOptions = resolvedOptions.length >= 2;
  const isMissing = !hasText && !hasOptions;

  let missingReason = null;
  if (!questionId) {
    missingReason = "Missing question ID in exam paper record.";
  } else if (isMissing) {
    missingReason = `Question document "${questionId}" was not found in Appwrite (likely deleted from Question Bank).`;
  } else if (!hasOptions) {
    missingReason = `Question has insufficient MCQ options (${resolvedOptions.length} found).`;
  }

  const isBilingual = !!(qEng && qMar);
  const languageType = question.languageType || (isBilingual ? "bilingual" : (qMar ? "marathi" : "english"));

  return {
    isValid: !isMissing && hasOptions,
    isMissing,
    missingReason,
    questionId,
    schemaVersion,
    languageType,
    isBilingual,
    questionEnglish: qEng,
    questionMarathi: qMar,
    questionRaw: question.question || "",
    options: resolvedOptions,
    images: resolvedImages,
    correctAnswer: question.correctAnswer || null,
    explanationEnglish: question.explanationEnglish || "",
    explanationMarathi: question.explanationMarathi || "",
    response: question.response ?? null,
  };
}

/**
 * Performs a comprehensive audit of all questions in a mock test paper.
 * Returns statistics, version breakdown, and pinpoints broken questions.
 */
export function auditQuestions(questionsList) {
  const list = Array.isArray(questionsList) ? questionsList : [];
  const total = list.length;
  let v1Count = 0;
  let v2Count = 0;
  let bilingualCount = 0;
  let missingIdCount = 0;
  let missingDocCount = 0;
  let missingOptionsCount = 0;
  let validCount = 0;
  const issues = [];

  list.forEach((q, index) => {
    const resolved = resolveQuestion(q);
    if (resolved.schemaVersion === 2) v2Count++;
    else v1Count++;

    if (resolved.isBilingual) bilingualCount++;

    if (!resolved.questionId) {
      missingIdCount++;
      issues.push({
        index,
        questionId: null,
        reason: "Missing question ID (null/undefined in paper)",
        raw: q,
      });
    } else if (resolved.isMissing) {
      missingDocCount++;
      issues.push({
        index,
        questionId: resolved.questionId,
        reason: `Question ID "${resolved.questionId}" not found in database (deleted or unhydrated)`,
        raw: q,
      });
    } else if (resolved.options.length < 2) {
      missingOptionsCount++;
      issues.push({
        index,
        questionId: resolved.questionId,
        reason: `Question has fewer than 2 options (${resolved.options.length} found)`,
        raw: q,
      });
    } else {
      validCount++;
    }
  });

  return {
    total,
    validCount,
    v1Count,
    v2Count,
    bilingualCount,
    missingIdCount,
    missingDocCount,
    missingOptionsCount,
    issues,
    hasIssues: issues.length > 0,
  };
}
