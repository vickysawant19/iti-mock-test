import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Functions } from "appwrite";
import { useNavigate } from "react-router-dom";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import { appwriteService } from "@/services/appwriteClient";
import { useListTradesQuery } from "@/store/api/tradeApi";
import { useListCollegesQuery } from "@/store/api/collegeApi";
import conf from "@/config/config";
import subjectService from "@/appwrite/subjectService";
import moduleServices from "@/appwrite/moduleServices";

export function useCreateMockTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [isFetchingModules, setIsFetchingModules] = useState(false);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const navigate = useNavigate();

  const { data: tradesResponse, isLoading: isLoadingTrades } = useListTradesQuery(undefined, { skip: !profile });
  const tradesList = tradesResponse?.documents || [];

  const { data: collegesResponse } = useListCollegesQuery();

  const fetchSubjects = useCallback(async () => {
    try {
      const resp = await subjectService.listSubjects();
      setSubjects(resp.rows || []);   // listSubjects() uses listRows() → returns { rows }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    }
  }, []);

  // ── Fetch subjects on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const fetchModules = useCallback(async (tradeId, subjectId, year) => {
    if (!tradeId || !subjectId || !year) return;
    setIsFetchingModules(true);
    try {
      const response = await moduleServices.getNewModulesData(tradeId, subjectId, year);
      setModules(
        response.sort((a, b) => {
          const aMatch = a.moduleId.match(/\d+/);
          const bMatch = b.moduleId.match(/\d+/);
          return (aMatch ? parseInt(aMatch[0]) : 0) - (bMatch ? parseInt(bMatch[0]) : 0);
        })
      );
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to fetch modules");
    } finally {
      setIsFetchingModules(false);
    }
  }, []);

  const submitMockTest = async (data) => {
    setIsLoading(true);
    try {
      const selectedTrade = tradesList.find(t => t.$id === data.tradeId);

      const payload = {
        // ── action ─────────────────────────────────────────────────────
        action: "generateMockTestNew",

        // ── identity ───────────────────────────────────────────────────
        userName: user.name,
        userId:   user.$id,
        tradeName: selectedTrade?.tradeName || "",

        // ── mode & selectors ───────────────────────────────────────────
        mode:              data.mode,
        tradeId:           data.tradeId,
        year:              data.year,
        subjectId:         data.subjectId   || null,
        subjectIds:        data.subjectIds  || [],
        selectedModules:   data.selectedModules  || [],
        selectedQuestions: data.selectedQuestions || [],
        tags:              data.tags || [],

        // ── test metadata ──────────────────────────────────────────────
        title:           data.title || "",
        negativeMarking: data.negativeMarking || false,
        visibility:      data.visibility || "draft",
        difficultyLevel: data.difficultyLevel || "mixed",

        // ── config ─────────────────────────────────────────────────────
        quesCount:    data.quesCount,
        totalMinutes: data.totalMinutes,

        // ── collection refs ────────────────────────────────────────────
        databaseId:                  conf.databaseId,
        quesCollectionId:            conf.quesCollectionId,
        questionPapersCollectionId:  conf.questionPapersCollectionId,
        newModulesDataCollectionId:  conf.newModulesDataCollectionId,
      };

      const functions = new Functions(appwriteService.getClient());
      const res = await functions.createExecution(
        conf.mockTestFunctionId,
        JSON.stringify(payload)
      );

      const { responseBody } = res;
      if (!responseBody) throw new Error("No response received from the server.");

      const parsedRes = JSON.parse(responseBody);
      if (parsedRes.error) throw new Error(parsedRes.error);

      toast.success(`Mock test created successfully! (${parsedRes.quesCount} questions)`);
      navigate("/all-mock-tests");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(`Error creating mock test: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isFetchingModules,
    subjects,
    modules,
    tradesList,
    isLoadingTrades,
    fetchSubjects,
    fetchModules,
    submitMockTest,
  };
}
