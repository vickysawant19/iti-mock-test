/**
 * Duplicate Reporting & Analytics Engine for Question Migration
 * Analyzes collection documents, identifies duplicate clusters, and generates grouped reports & CSV downloads.
 */

import {
  generateExactDuplicateHash,
  generateNormalizedHash,
  generatePartialDuplicateHash,
  calculateJaccardSimilarity,
} from "../../utils/duplicateDetector";

export interface DuplicateGroup {
  hashKey: string;
  type: "exact" | "normalized" | "partial";
  canonicalQuestionId: string;
  tradeId?: string;
  subjectId?: string;
  moduleId?: string;
  questionText: string;
  duplicates: Array<{
    $id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    tradeId?: string;
    subjectId?: string;
    moduleId?: string;
    similarityScore?: number;
  }>;
}

export interface DuplicateReportSummary {
  totalQuestions: number;
  exactDuplicatesCount: number;
  normalizedDuplicatesCount: number;
  partialDuplicatesCount: number;
  uniqueQuestionsCount: number;
  groups: DuplicateGroup[];
  groupedByTrade: Record<string, DuplicateGroup[]>;
  groupedBySubject: Record<string, DuplicateGroup[]>;
  groupedByModule: Record<string, DuplicateGroup[]>;
}

/**
 * Generates a full Duplicate Report from an array of Question documents
 */
export const generateDuplicateReport = (
  documents: any[],
  similarityThreshold: number = 0.75
): DuplicateReportSummary => {
  const exactMap = new Map<string, any[]>();
  const normalizedMap = new Map<string, any[]>();
  const partialGroups: DuplicateGroup[] = [];
  const processedExactIds = new Set<string>();

  // Step 1: Map exact and normalized hashes
  for (const doc of documents) {
    const qText = doc.question || doc.questionEnglish || "";
    const opts = doc.options || doc.optionsEnglish || [];
    const ans = doc.correctAnswer || "";

    const exactHash = doc.exactDuplicateHash || generateExactDuplicateHash(qText, opts, ans);
    const normHash = doc.normalizedHash || generateNormalizedHash(qText);

    if (!exactMap.has(exactHash)) exactMap.set(exactHash, []);
    exactMap.get(exactHash)!.push(doc);

    if (!normalizedMap.has(normHash)) normalizedMap.set(normHash, []);
    normalizedMap.get(normHash)!.push(doc);
  }

  const groups: DuplicateGroup[] = [];
  let exactDuplicatesCount = 0;
  let normalizedDuplicatesCount = 0;
  let partialDuplicatesCount = 0;

  // Process Exact Duplicate Groups
  for (const [hash, docs] of exactMap.entries()) {
    if (docs.length > 1) {
      const canonical = docs[0];
      docs.forEach((d) => processedExactIds.add(d.$id));
      exactDuplicatesCount += docs.length - 1;

      groups.push({
        hashKey: hash,
        type: "exact",
        canonicalQuestionId: canonical.$id,
        tradeId: canonical.tradeId,
        subjectId: canonical.subjectId,
        moduleId: canonical.moduleId,
        questionText: canonical.question || canonical.questionEnglish,
        duplicates: docs.map((d) => ({
          $id: d.$id,
          question: d.question || d.questionEnglish,
          options: d.options || d.optionsEnglish || [],
          correctAnswer: d.correctAnswer,
          tradeId: d.tradeId,
          subjectId: d.subjectId,
          moduleId: d.moduleId,
          similarityScore: 1.0,
        })),
      });
    }
  }

  // Process Normalized Duplicate Groups (excluding exact matches already processed)
  for (const [hash, docs] of normalizedMap.entries()) {
    const unhandledDocs = docs.filter((d) => !processedExactIds.has(d.$id));
    if (unhandledDocs.length > 1) {
      const canonical = unhandledDocs[0];
      normalizedDuplicatesCount += unhandledDocs.length - 1;

      groups.push({
        hashKey: hash,
        type: "normalized",
        canonicalQuestionId: canonical.$id,
        tradeId: canonical.tradeId,
        subjectId: canonical.subjectId,
        moduleId: canonical.moduleId,
        questionText: canonical.question || canonical.questionEnglish,
        duplicates: unhandledDocs.map((d) => ({
          $id: d.$id,
          question: d.question || d.questionEnglish,
          options: d.options || d.optionsEnglish || [],
          correctAnswer: d.correctAnswer,
          tradeId: d.tradeId,
          subjectId: d.subjectId,
          moduleId: d.moduleId,
          similarityScore: 0.95,
        })),
      });
    }
  }

  // Process Partial Duplicates pairwise for remaining unique questions
  const uniqueDocs = documents.filter(
    (d) =>
      !groups.some((g) => g.duplicates.some((dup) => dup.$id === d.$id))
  );

  for (let i = 0; i < uniqueDocs.length; i++) {
    for (let j = i + 1; j < uniqueDocs.length; j++) {
      const docA = uniqueDocs[i];
      const docB = uniqueDocs[j];
      const textA = docA.question || docA.questionEnglish || "";
      const textB = docB.question || docB.questionEnglish || "";

      const sim = calculateJaccardSimilarity(textA, textB);
      if (sim >= similarityThreshold) {
        partialDuplicatesCount++;
        groups.push({
          hashKey: generatePartialDuplicateHash(textA),
          type: "partial",
          canonicalQuestionId: docA.$id,
          tradeId: docA.tradeId,
          subjectId: docA.subjectId,
          moduleId: docA.moduleId,
          questionText: textA,
          duplicates: [
            {
              $id: docA.$id,
              question: textA,
              options: docA.options || [],
              correctAnswer: docA.correctAnswer,
              tradeId: docA.tradeId,
              subjectId: docA.subjectId,
              moduleId: docA.moduleId,
              similarityScore: 1.0,
            },
            {
              $id: docB.$id,
              question: textB,
              options: docB.options || [],
              correctAnswer: docB.correctAnswer,
              tradeId: docB.tradeId,
              subjectId: docB.subjectId,
              moduleId: docB.moduleId,
              similarityScore: sim,
            },
          ],
        });
      }
    }
  }

  const groupedByTrade: Record<string, DuplicateGroup[]> = {};
  const groupedBySubject: Record<string, DuplicateGroup[]> = {};
  const groupedByModule: Record<string, DuplicateGroup[]> = {};

  for (const group of groups) {
    const trade = group.tradeId || "Unassigned";
    const subject = group.subjectId || "Unassigned";
    const module = group.moduleId || "Unassigned";

    if (!groupedByTrade[trade]) groupedByTrade[trade] = [];
    groupedByTrade[trade].push(group);

    if (!groupedBySubject[subject]) groupedBySubject[subject] = [];
    groupedBySubject[subject].push(group);

    if (!groupedByModule[module]) groupedByModule[module] = [];
    groupedByModule[module].push(group);
  }

  const uniqueQuestionsCount = documents.length - (exactDuplicatesCount + normalizedDuplicatesCount);

  return {
    totalQuestions: documents.length,
    exactDuplicatesCount,
    normalizedDuplicatesCount,
    partialDuplicatesCount,
    uniqueQuestionsCount,
    groups,
    groupedByTrade,
    groupedBySubject,
    groupedByModule,
  };
};

/**
 * Converts Duplicate Report Summary to CSV string for download
 */
export const exportDuplicateReportCSV = (summary: DuplicateReportSummary): string => {
  const rows: string[] = [
    "Group Type,Canonical ID,Duplicate Question ID,Trade ID,Subject ID,Module ID,Similarity Score,Question Text",
  ];

  for (const grp of summary.groups) {
    for (const dup of grp.duplicates) {
      const cleanText = (dup.question || "").replace(/"/g, '""').replace(/[\r\n]+/g, " ");
      rows.push(
        `"${grp.type}","${grp.canonicalQuestionId}","${dup.$id}","${dup.tradeId || ""}","${
          dup.subjectId || ""
        }","${dup.moduleId || ""}","${(dup.similarityScore || 1.0).toFixed(2)}","${cleanText}"`
      );
    }
  }

  return rows.join("\n");
};
