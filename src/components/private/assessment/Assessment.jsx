import React, { useEffect, useState } from "react";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";
import subjectService from "../../../appwrite/subjectService";
import questionpaperservice from "../../../appwrite/mockTest";
import AssesmentList from "./AssesmentList";
import { useSearchParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";

const Assessment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [modulesData, setModulesData] = useState([]);
  const [subjectsData, setSubjectsData] = useState(null);
  const [papersData, setPapersData] = useState(new Map());
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSubject, setSelectedSubject] = useState(
    searchParams.get("subject") ? { $id: searchParams.get("subject") } : null
  );
  const [selectedTradeYear, setSelectedTradeYear] = useState(
    searchParams.get("year") || "FIRST"
  );
  const redirect = `/assessment?${searchParams.toString()}`;

  const profile = useSelector(selectProfile);

  // Update search params when filters change
  useEffect(() => {
    if (selectedTradeYear && selectedSubject) {
      setSearchParams((params) => ({
        ...Object.fromEntries(params), // Preserve existing params
        year: selectedTradeYear,
        subject: selectedSubject.$id,
      }));
    }
  }, [selectedSubject, selectedTradeYear, setSearchParams]);

  const fetchPapers = async (paperIds) => {
    setIsLoading(true);
    try {
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < paperIds.length; i += batchSize) {
        batches.push(paperIds.slice(i, i + batchSize));
      }
      const requests = batches.map(async (batch) => {
        return questionpaperservice.listQuestions([
          Query.equal("paperId", batch),
          Query.equal("userId", profile.userId),
          Query.select([
            "isOriginal",
            "submitted",
            "score",
            "quesCount",
            "endTime",
            "paperId",
            "userId",
            "$id",
          ]),
          Query.limit(100),
          Query.orderAsc("$createdAt"),
        ]);
      });

      const results = await Promise.all(requests);
      if (!results) {
        setPapersData(null);
        return;
      }
      const paperMap = new Map();
      let progress = { total: paperIds.length, submitted: 0 };
      results?.flat()?.forEach((paper) => {
        if (!paper || paperMap.has(paper?.paperId)) return;
        if (paper?.submitted) {
          progress.submitted += 1;
        }
        paperMap.set(paper?.paperId, paper);
      });
      paperMap.set("progress", progress);
      setPapersData(paperMap);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await subjectService.listSubjects();
      setSubjectsData(data.documents || []);
      if (data.documents && data.documents.length > 0 && !selectedSubject) {
        setSelectedSubject(data.documents[0]);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const data = await moduleServices.listModules([
        Query.equal("tradeId", profile.tradeId),
        Query.equal("subjectId", selectedSubject.$id),
        Query.equal("year", selectedTradeYear),
      ]);

      if (data) {
        // Filter modules with assessmentPaperId and sort by moduleId

        const sortedModules = data.syllabus.sort((a, b) => {
          const moduleIdA = a.moduleId || "";
          const moduleIdB = b.moduleId || "";
          return moduleIdA.localeCompare(moduleIdB, undefined, {
            numeric: true,
          });
        });

        const paperIds = sortedModules
          .filter((module) => module.assessmentPaperId)
          .map((paper) => paper.assessmentPaperId);

        if (paperIds.length > 0) {
          await fetchPapers(paperIds);
        }

        setModulesData(sortedModules);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject && selectedTradeYear) {
      setModulesData(null);
      setPapersData(new Map());
      fetchModules();
    }
  }, [selectedTradeYear, selectedSubject]);

  return (
    <div className="bg-gray-50 min-h-screen dark:bg-gray-900">
      {/* Header */}
      <div className="w-full bg-blue-600 text-white shadow-lg pt-2 dark:bg-blue-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center md:justify-start">
            <ClipboardList
              className="mr-2 text-blue-200 dark:text-blue-100"
              size={24}
            />
            <h1 className="font-bold text-xl md:text-2xl">Assessment Portal</h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-xs p-4 mb-4 dark:bg-gray-800 dark:border dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Select Year */}
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Select Year
            </label>
            <select
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-blue-400"
              value={selectedTradeYear}
              onChange={(e) => setSelectedTradeYear(e.target.value)}
            >
              {["FIRST", "SECOND"].map((year) => (
                <option key={year} value={year}>
                  {year} YEAR
                </option>
              ))}
            </select>
          </div>

          {/* Select Subject */}
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Select Subject
            </label>
            <select
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-blue-400"
              value={selectedSubject?.$id || ""}
              onChange={(e) => {
                const subject = subjectsData.find(
                  (sub) => sub.$id === e.target.value
                );
                setSelectedSubject(subject);
              }}
            >
              {subjectsData &&
                subjectsData.map((subject) => (
                  <option key={subject.$id} value={subject.$id}>
                    {subject.subjectName}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assessment List */}
      <AssesmentList
        modulesData={modulesData || []}
        papersData={papersData}
        redirect={redirect}
      />
    </div>
  );
};

export default Assessment;
