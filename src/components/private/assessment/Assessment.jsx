import React, { useEffect, useState } from "react";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";
import subjectService from "../../../appwrite/subjectService";
import questionpaperservice from "../../../appwrite/mockTest";
import AssesmentList from "./AssesmentList";
import { useSearchParams } from "react-router-dom";

const Assessment = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [modulesData, setModulesData] = useState(null);
  const [subjectsData, setSubjectsData] = useState(null);
  // Use "subject" as the query parameter key consistently
  const [selectedSubject, setSelectedSubject] = useState(
    searchParams.get("subject") ? { $id: searchParams.get("subject") } : null
  );
  const [selectedTradeYear, setSelectedTradeYear] = useState(
    searchParams.get("year") || "FIRST"
  );
  const [papersData, setPapersData] = useState(new Map());

  const profile = useSelector(selectProfile);
  // Construct a full redirect URL string including the pathname and search parameters
  const redirect = `${searchParams.toString()}`;

  // Update search params when filters change
  useEffect(() => {
    if (selectedTradeYear && selectedSubject) {
      setSearchParams({
        year: selectedTradeYear,
        subject: selectedSubject.$id,
      });
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
            "submitted",
            "score",
            "quesCount",
            "endTime",
            "paperId",
          ]),
          Query.limit(100),
        ]);
      });

      const results = await Promise.all(requests);
      const paperMap = new Map();
      results.flat().forEach((paper) => {
        paperMap.set(paper.paperId, paper);
      });

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
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-md py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-800">Assessment Portal</h1>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Year
            </label>
            <select
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Subject
            </label>
            <select
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <AssesmentList
          modulesData={modulesData}
          papersData={papersData}
          redirect={redirect}
        />
      )}
    </div>
  );
};

export default Assessment;
