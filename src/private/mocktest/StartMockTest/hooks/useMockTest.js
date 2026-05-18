import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Query } from "appwrite";
import { differenceInSeconds } from "date-fns";
import mockTestService from "@/services/mocktest.service";

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

      userTest.questions = userTest.questions.map((q) => JSON.parse(q));

      const needsHydration = userTest.questions.some(q => q.question === undefined);

      if (needsHydration) {
        const qIds = userTest.questions.map(q => q.$id);
        const { questionService } = await import("@/services/question.service");
        const fetchedQuestions = await questionService.getQuestionsByIds(qIds);
        const questionsLookup = new Map(fetchedQuestions.map(q => [q.$id, q]));

        // If any questions are missing (deleted from DB), try fallback to original paper JSON (for older papers)
        const hasMissing = userTest.questions.some(q => !questionsLookup.has(q.$id));
        if (hasMissing && userTest.isOriginal !== null && !userTest.isOriginal) {
          const originalTestResponse = await mockTestService.listQuestions([
            Query.equal("paperId", userTest.paperId),
            Query.equal("isOriginal", true),
          ]);
          if (originalTestResponse.length > 0) {
            const originalTest = originalTestResponse[0];
            originalTest.questions.map(item => JSON.parse(item)).forEach(oq => {
              if (!questionsLookup.has(oq.$id)) questionsLookup.set(oq.$id, oq);
            });
          }
        }

        userTest.questions = userTest.questions.map(ques => ({
          ...questionsLookup.get(ques.$id),
          response: ques.response ?? null,
        }));
      }

      setMockTest(userTest);
    } catch (error) {
      console.error("Error fetching mock test:", error);
      toast.error("Error loading mock test!");
    } finally {
      setIsLoading(false);
    }
  };

  return { mockTest, setMockTest, isLoading, fetchMockTest };
}
