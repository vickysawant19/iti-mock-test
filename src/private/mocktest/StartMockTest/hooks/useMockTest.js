import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Query } from "appwrite";
import { differenceInSeconds } from "date-fns";
import mockTestService from "@/services/academic/mocktest.service";

/**
 * Fetches, hydrates, and manages the mock test state for the exam session.
 *
 * @param {string} paperId - The paper document ID from the URL.
 */
export function useMockTest(paperId) {
  const [mockTest, setMockTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMockTest = async () => {
    if (!paperId) {
      navigate(`/show-mock-test/${paperId}`);
      return;
    }
    try {
      const userTestResponse = await mockTestService.listQuestions([
        Query.equal("$id", paperId),
        Query.limit(1),
      ]);

      const userTest = userTestResponse[0];

      if (!userTest) {
        toast.error("Mock test not found!");
        navigate(`/all-mock-tests`);
        return;
      }

      if (userTest.submitted) {
        navigate(`/show-mock-test/${paperId}`);
        return;
      }

      userTest.questions = (userTest.questions || [])
        .map((q) => {
          if (typeof q === "string") {
            try {
              return JSON.parse(q);
            } catch {
              return null;
            }
          }
          return q;
        })
        .filter(Boolean);

      const needsHydration = userTest.questions.some((q) => q.question === undefined);

      if (needsHydration) {
        const qIds = userTest.questions
          .map((q) => q?.$id || q?.id)
          .filter((id) => typeof id === "string" && id.trim().length > 0 && id !== "null");

        const { questionService } = await import("@/services/academic/question.service");
        const fetchedQuestions = qIds.length > 0 ? await questionService.getQuestionsByIds(qIds) : [];
        const questionsLookup = new Map((fetchedQuestions || []).map((q) => [q.$id || q.id, q]));

        // If any questions are missing (deleted from DB), try fallback to original paper JSON (for older papers)
        const hasMissing = userTest.questions.some((q) => {
          const id = q?.$id || q?.id;
          return !id || !questionsLookup.has(id);
        });

        if (hasMissing && userTest.isOriginal !== null && !userTest.isOriginal) {
          try {
            const baseId = userTest.paperId ? userTest.paperId.slice(0, -2) : "";
            const originalQueries = [
              Query.equal("isOriginal", true),
              Query.limit(1),
            ];
            if (baseId) {
              originalQueries.push(Query.startsWith("paperId", baseId));
            }
            const originalTestResponse = await mockTestService.listQuestions(originalQueries);
            if (originalTestResponse.length > 0) {
              const originalTest = originalTestResponse[0];
              (originalTest.questions || [])
                .map((item) => {
                  try {
                    return typeof item === "string" ? JSON.parse(item) : item;
                  } catch {
                    return null;
                  }
                })
                .filter(Boolean)
                .forEach((oq) => {
                  const oqId = oq?.$id || oq?.id;
                  if (oqId && !questionsLookup.has(oqId)) questionsLookup.set(oqId, oq);
                });
            }
          } catch (fallbackErr) {
            console.warn("Fallback to original paper failed:", fallbackErr);
          }
        }

        userTest.questions = userTest.questions.map((ques) => {
          const qId = ques?.$id || ques?.id;
          const hydrated = qId ? questionsLookup.get(qId) : null;
          return {
            ...ques,
            ...(hydrated || {}),
            response: ques?.response ?? null,
          };
        });
      }

      // ── Audit Questions for Diagnostics & Debugging ──
      const { auditQuestions } = await import("@/utils/questionV2Helper");
      const audit = auditQuestions(userTest.questions);
      userTest.audit = audit;

      if (import.meta.env.DEV || audit.hasIssues) {
        console.group(`🔍 [MockTest Questions Audit] Paper: ${userTest.paperId || paperId}`);
        console.log(
          `📊 Total: ${audit.total} | Valid: ${audit.validCount} | V2: ${audit.v2Count} | V1: ${audit.v1Count} | Bilingual: ${audit.bilingualCount}`
        );
        if (audit.hasIssues) {
          console.warn(`⚠️ Detected ${audit.issues.length} question issue(s):`);
          audit.issues.forEach((iss) => {
            console.warn(`  - Question #${iss.index + 1} (ID: ${iss.questionId || "null"}): ${iss.reason}`);
          });
        } else {
          console.log("✅ All questions in this paper loaded and hydrated successfully.");
        }
        console.groupEnd();
      }

      setMockTest(userTest);
    } catch (error) {
      console.error("Error fetching mock test:", error);
      toast.error("Error loading mock test!");
    } finally {
      setIsLoading(false);
    }
  };

  return { mockTest, setMockTest, isLoading, fetchMockTest, audit: mockTest?.audit };
}
