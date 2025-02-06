import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../store/userSlice";
import { selectProfile } from "../../../store/profileSlice";
import batchService from "../../../appwrite/batchService";
import tradeservice from "../../../appwrite/tradedetails";
import subjectService from "../../../appwrite/subjectService";
import moduleServices from "../../../appwrite/moduleServices";
import { Query } from "appwrite";

const AddModules = () => {
  const [selectedTradeID, setSelectedTradeID] = useState(null);
  const [selectedSubjectID, setSelectedSubjectID] = useState(null);

  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const fetchTrades = async () => {
    try {
      const data = await tradeservice.listTrades();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.listSubjects();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchModules = async () => {
    try {
      const data = await moduleServices.listModules([
        Query.equal("tradeId", ""),
        Query.equal("SubjectId", ""),
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white grid grid-cols-2 p-3">
      <h1>Add Modules</h1>
      <div className="bg-white col-span-full flex">
        <div className="flex flex-col">
          <label htmlFor="selectTrade"> Select Trade</label>
          <select name="" id="selectTrade" className="w-32">
            <option>Trade1</option>
            <option>Trade2</option>
            <option>Trade3</option>
            <option>Trade4</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="selectTrade"> Select Subject</label>
          <select name="" id="selectTrade" className="w-32">
            <option>Subject 1</option>
            <option>Subject 2</option>
            <option>Subject 3</option>
            <option>Subject 4</option>
          </select>
        </div>
      </div>

      <div></div>
    </div>
  );
};

export default AddModules;
