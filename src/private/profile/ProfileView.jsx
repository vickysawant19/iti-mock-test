import React, { useEffect, useState } from "react";

import { format } from "date-fns";
import { UserCircle, GraduationCap, MapPin, Phone, Building, Briefcase, Calendar, ShieldCheck, User } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AiOutlineEdit } from "react-icons/ai";

import batchService from "@/appwrite/batchService";
import userProfileService from "@/appwrite/userProfileService";
import authService from "@/services/auth.service";
import batchStudentService from "@/appwrite/batchStudentService";
import { useGetCollegeQuery } from "@/store/api/collegeApi";
import { useGetTradeQuery } from "@/store/api/tradeApi";
import { Query } from "appwrite";
import Loader from "@/components/components/Loader";

const ProfileView = ({ profileProps }) => {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { userId } = useParams();

  const [studentBatchData, setStudentBatchData] = useState(null);
  const [collegeIdFromBatch, setCollegeIdFromBatch] = useState(null);
  const [tradeIdFromBatch, setTradeIdFromBatch] = useState(null);

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    collegeIdFromBatch,
    { skip: !collegeIdFromBatch }
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    tradeIdFromBatch,
    { skip: !tradeIdFromBatch }
  );

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      if (profileProps) {
        setProfile(profileProps);
      } else {
        const res = await userProfileService.getUserProfile(userId);
        setProfile(res);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch batches using batchStudentService instead of legacy profile.batchId
      let fetchedBatches = [];
      if (profile?.role?.includes("Teacher")) {
        const teacherBatches = await batchService.listBatches([Query.equal("teacherId", profile.userId || userId)]);
        if (teacherBatches && teacherBatches.documents.length > 0) {
           fetchedBatches = teacherBatches.documents[0]; // just grab the first one for display natively
        }
      } else {
         const studentBatches = await batchStudentService.getStudentBatches(profile?.userId || userId);
         if (studentBatches && studentBatches.length > 0) {
            setStudentBatchData(studentBatches[0]);
            const firstBatchRes = await batchService.getBatch(studentBatches[0].batchId, [
              Query.select(["$id", "BatchName", "collegeId", "tradeId"]),
            ]);
            fetchedBatches = firstBatchRes;
         }
      }
      
      if (fetchedBatches && fetchedBatches.$id) {
        setBatches(fetchedBatches);
        setCollegeIdFromBatch(fetchedBatches.collegeId?.$id || fetchedBatches.collegeId);
        setTradeIdFromBatch(fetchedBatches.tradeId?.$id || fetchedBatches.tradeId);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchProfile();
  }, [userId, profileProps]);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const handleLogout = async () => {
    try {
      if (user) {
        await authService.logout();
        dispatch(removeUser());
        dispatch(removeProfile());
        navigate("/login");
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (isLoading || collegeDataLoading || tradeDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-pink-100 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          No profile data available.
        </p>
      </div>
    );
  }

  const renderField = (icon, label, value) => (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors border border-transparent hover:border-white/20">
      <div className="p-2 bg-pink-50 text-pink-600 dark:bg-slate-800 dark:text-pink-400 rounded-lg shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="font-medium text-slate-900 dark:text-white mt-1 break-words">
          {value || "Not provided"}
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Ambient Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Glassmorphism Hero Section */}
        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500"></div>
          
          <div className="px-6 sm:px-10 pb-10 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:-mt-12 -mt-16 mb-4">
              <div className="relative group">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl object-cover ring-8 ring-white/80 dark:ring-slate-900 shadow-xl transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 ring-8 ring-white/80 dark:ring-slate-900 shadow-xl flex items-center justify-center">
                    <UserCircle className="w-16 h-16 text-slate-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile.userName}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{profile.email}</p>
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  {profile.role?.map((label, index) => (
                    <span
                      key={index}
                      className="px-4 py-1.5 text-xs rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 font-semibold uppercase tracking-wider"
                    >
                    </span>
                  ))}
                </div>
              </div>

              <Link
                to={profileProps ? "/profile/edit" : `/manage-batch/edit/${userId}`}
                className="shrink-0 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-slate-200"
              >
                <AiOutlineEdit size={18} />
                <span>Edit Profile</span>
              </Link>
            </div>

            {userId === undefined && (
              <div className="mt-6 flex flex-wrap gap-4 justify-center sm:justify-start border-t border-slate-200/50 dark:border-slate-800/50 pt-5">
                <Link to="/change-password" className="text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 hover:underline underline-offset-4 transition-all">
                  Change Password
                </Link>
                <button
                  className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:underline underline-offset-4 transition-all"
                >
                  Sign Out Securely
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modular KPI Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Primary Role", value: profile.role?.[0] || "User" },
            { label: "Last Updated", value: format(new Date(), "dd MMM yyyy") }
          ].map((stat, idx) => (
             <div key={idx} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/40 dark:border-slate-800/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</div>
                <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white truncate">{stat.value}</div>
             </div>
          ))}
        </div>

        {/* Content Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/50 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-white/40 dark:border-slate-800/50 flex items-center gap-3">
                <User className="text-pink-500" size={20} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Personal Info</h2>
              </div>
              <div className="p-4 grid gap-1 divide-y divide-slate-100/50 dark:divide-slate-800/30">
                {renderField(<Phone size={18}/>, "Phone", profile.phone)}
                {renderField(
                  <Calendar size={18}/>,
                  "Date of Birth",
                  profile.DOB ? format(new Date(profile.DOB), "dd MMMM yyyy") : null
                )}
                {renderField(<Phone size={18}/>, "Parent Contact", profile.parentContact)}
                {renderField(<MapPin size={18}/>, "Address", profile.address)}
              </div>
            </div>
          </div>

          {/* Right Column - Academic / Teaching Info */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/50 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-white/40 dark:border-slate-800/50 flex items-center gap-3">
                <GraduationCap className="text-amber-500" size={20} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Academic Profile</h2>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-1 gap-x-4">
                {renderField(<ShieldCheck size={18}/>, "Roll Number", studentBatchData?.rollNumber)}
                {renderField(<ShieldCheck size={18}/>, "Registration ID", studentBatchData?.registerId)}
                {renderField(<Building size={18}/>, "College", college?.collageName)}
                {renderField(<Briefcase size={18}/>, "Trade Overview", trade?.tradeName)}
                {renderField(<GraduationCap size={18}/>, "Assigned Batch", batches?.BatchName)}
              </div>
            </div>

            {profile.role?.includes("Teacher") && (
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/50 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-white/40 dark:border-slate-800/50 flex items-center gap-3">
                  <Briefcase className="text-purple-500" size={20} />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Teaching Credentials</h2>
                </div>
                <div className="p-4 grid grid-cols-1 gap-1">
                  {renderField(<GraduationCap size={18}/>, "Specialization", profile.specialization)}
                  {renderField(<Building size={18}/>, "Grade Level", profile.gradeLevel)}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
