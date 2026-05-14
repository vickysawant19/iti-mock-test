import { Query } from "node-appwrite";

/**
 * generateMockTestNew
 *
 * Handles all test creation modes from the new Create Mock Test UI:
 *
 *   mode = "subject"  → filter by tradeId + year + subjectId (+ optional tags)
 *   mode = "module"   → filter by tradeId + year + subjectId + specific modules
 *   mode = "mixed"    → filter by tradeId + year + multiple subjectIds
 *   mode = "manual"   → use the explicit selectedQuestions array (doc $ids)
 *   mode = "auto"     → filter by tradeId + year + optional subject/modules,
 *                       auto-pick quesCount questions randomly
 *
 * The document written to questionPaperData is identical in shape to the one
 * created by the original generateMockTest action — no schema changes required.
 */
const generateMockTestNew = async ({
  // ── Caller identity ───────────────────────────────────────────────────────
  userId,
  userName,
  tradeName,
  tradeId,
  year,

  // ── Test mode ─────────────────────────────────────────────────────────────
  mode = "subject",           // "subject" | "module" | "mixed" | "manual" | "auto"

  // ── Mode-specific selectors ───────────────────────────────────────────────
  subjectId,                  // single subject  (subject / module / auto modes)
  subjectIds = [],            // multiple subjects (mixed mode)
  selectedModules = [],       // array of newModulesData doc $ids  (module / mixed / auto)
  selectedQuestions = [],     // array of questionData doc $ids    (manual mode)
  tags = [],

  // ── Test configuration ────────────────────────────────────────────────────
  title = "",
  quesCount = 20,
  totalMinutes = 30,
  negativeMarking = false,
  visibility = "draft",
  difficultyLevel = "mixed",

  // ── Appwrite infra ────────────────────────────────────────────────────────
  error,
  database,
  databaseId: passedDatabaseId,
  quesCollectionId: passedQuesCollectionId,
  questionPapersCollectionId: passedQuestionPapersCollectionId,
  newModulesDataCollectionId: passedNewModulesDataCollectionId,
}) => {
  // ── Resolve collection IDs ─────────────────────────────────────────────────
  const databaseId               = passedDatabaseId               || process.env.APPWRITE_DATABASE_ID;
  const quesCollectionId         = passedQuesCollectionId         || process.env.APPWRITE_QUES_COLLECTION_ID;
  const questionPapersCollectionId = passedQuestionPapersCollectionId || process.env.QUESTIONPAPER_COLLECTION_ID;
  const newModulesDataCollectionId = passedNewModulesDataCollectionId || "newmodulesdata";

  // ── Helpers ────────────────────────────────────────────────────────────────
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const getISTDate = () => {
    const now = new Date();
    return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  };

  const generatePaperId = (name) => {
    const prefix = (name || "TST").slice(0, 3).toUpperCase();
    const d = getISTDate();
    const date = d.toISOString().split("T")[0].replace(/-/g, "");
    const time = d.toTimeString().split(" ")[0].replace(/:/g, "").slice(0, 4);
    const rnd  = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `${prefix}${date}${time}${rnd}`;
  };

  /**
   * Resolve module $ids → logical moduleId strings used on questionData.
   * Returns [] when no modules specified (meaning "all modules").
   */
  const resolveLogicalModuleIds = async (moduleDocIds) => {
    if (!moduleDocIds || moduleDocIds.length === 0) return [];
    const resp = await database.listDocuments(
      databaseId,
      newModulesDataCollectionId,
      [Query.equal("$id", moduleDocIds), Query.select(["moduleId"])]
    );
    return resp.documents.map((d) => d.moduleId);
  };

  /**
   * Paginated fetch of question $ids from questionData using caller-supplied queries.
   */
  const fetchQuestionIds = async (baseQueries) => {
    const ids    = [];
    let   offset = 0;
    let   hasMore = true;

    while (hasMore) {
      const resp = await database.listDocuments(
        databaseId,
        quesCollectionId,
        [...baseQueries, Query.limit(100), Query.offset(offset), Query.select(["$id"])]
      );
      resp.documents.forEach((d) => ids.push(d.$id));
      offset  += resp.documents.length;
      hasMore  = offset < resp.total && resp.documents.length > 0;
    }

    return ids;
  };

  // ── Main logic ─────────────────────────────────────────────────────────────
  try {
    let questionDocIds = [];   // We'll collect question $ids here

    // ── MODE: manual ──────────────────────────────────────────────────────────
    if (mode === "manual") {
      if (!selectedQuestions || selectedQuestions.length === 0) {
        throw new Error("Manual mode requires at least one selected question.");
      }
      questionDocIds = selectedQuestions;
    }

    // ── MODE: subject ─────────────────────────────────────────────────────────
    else if (mode === "subject") {
      if (!subjectId) throw new Error("Subject mode requires a subjectId.");
      const queries = [
        Query.equal("tradeId",   tradeId),
        Query.equal("year",      year),
        Query.equal("subjectId", subjectId),
      ];
      if (Array.isArray(tags) && tags.length > 0) queries.push(Query.contains("tags", tags));
      questionDocIds = await fetchQuestionIds(queries);
    }

    // ── MODE: module ──────────────────────────────────────────────────────────
    else if (mode === "module") {
      if (!subjectId)                   throw new Error("Module mode requires a subjectId.");
      if (selectedModules.length === 0) throw new Error("Module mode requires at least one selected module.");

      const logicalIds = await resolveLogicalModuleIds(selectedModules);
      const queries = [
        Query.equal("tradeId",   tradeId),
        Query.equal("year",      year),
        Query.equal("subjectId", subjectId),
        Query.equal("moduleId",  logicalIds),
      ];
      if (Array.isArray(tags) && tags.length > 0) queries.push(Query.contains("tags", tags));
      questionDocIds = await fetchQuestionIds(queries);
    }

    // ── MODE: mixed ───────────────────────────────────────────────────────────
    else if (mode === "mixed") {
      const subjects = subjectIds.length > 0
        ? subjectIds
        : subjectId ? [subjectId] : null;

      if (!subjects) throw new Error("Mixed mode requires at least one subject.");

      // Resolve modules (optional)
      const logicalIds = await resolveLogicalModuleIds(selectedModules);

      const queries = [
        Query.equal("tradeId", tradeId),
        Query.equal("year",    year),
        Query.equal("subjectId", subjects),    // Appwrite IN query
      ];
      if (logicalIds.length > 0) queries.push(Query.equal("moduleId", logicalIds));
      if (Array.isArray(tags) && tags.length > 0) queries.push(Query.contains("tags", tags));
      questionDocIds = await fetchQuestionIds(queries);
    }

    // ── MODE: auto (default fallback) ─────────────────────────────────────────
    else {
      // Same as subject but fully optional — broadest possible pool
      const queries = [Query.equal("tradeId", tradeId), Query.equal("year", year)];
      if (subjectId)                            queries.push(Query.equal("subjectId", subjectId));
      if (subjectIds && subjectIds.length > 0)  queries.push(Query.equal("subjectId", subjectIds));
      const logicalIds = await resolveLogicalModuleIds(selectedModules);
      if (logicalIds.length > 0)                queries.push(Query.equal("moduleId", logicalIds));
      if (Array.isArray(tags) && tags.length > 0) queries.push(Query.contains("tags", tags));
      questionDocIds = await fetchQuestionIds(queries);
    }

    // ── Validate pool ──────────────────────────────────────────────────────────
    if (questionDocIds.length === 0) {
      throw new Error(
        `No questions found for mode="${mode}". Check your filters (trade, year, subject, modules, tags).`
      );
    }

    // ── Pick random subset ─────────────────────────────────────────────────────
    const count   = Math.min(parseInt(quesCount), questionDocIds.length);
    const pickedIds = shuffle([...questionDocIds]).slice(0, count);

    // ── Fetch full question documents ──────────────────────────────────────────
    const qRes = await database.listDocuments(
      databaseId,
      quesCollectionId,
      [
        Query.equal("$id", pickedIds),
        Query.limit(pickedIds.length),
        Query.select(["$id", "question", "options", "userId", "userName", "correctAnswer", "moduleId"]),
      ]
    );

    // ── Shuffle final list & build serialised format ───────────────────────────
    const serialized = shuffle(qRes.documents).map((q) =>
      JSON.stringify({
        $id:           q.$id,
        question:      q.question,
        options:       q.options,
        userId:        q.userId,
        userName:      q.userName,
        correctAnswer: q.correctAnswer,
        moduleId:      q.moduleId || "",
        response:      null,
      })
    );

    // ── Build questionPaperData document (fits existing schema exactly) ────────
    const paperId = generatePaperId(tradeName);

    const paperDoc = {
      userId,
      userName,
      tradeId,
      tradeName,
      year,
      paperId,
      title:           title || "",
      questions:       serialized,
      quesCount:       serialized.length,
      totalMinutes:    parseInt(totalMinutes) || 60,
      negativeMarking: Boolean(negativeMarking),
      visibility:      visibility || "draft",
      difficultyLevel: difficultyLevel || "mixed",
      score:           null,
      submitted:       false,
      isOriginal:      true,
      isProtected:     true,
    };

    const created = await database.createDocument(
      databaseId,
      questionPapersCollectionId,
      "unique()",
      paperDoc
    );

    return { paperId: created.$id, paperCode: paperId, quesCount: serialized.length };
  } catch (err) {
    error(err.message || err);
    return { error: err.message || String(err) };
  }
};

export default generateMockTestNew;
