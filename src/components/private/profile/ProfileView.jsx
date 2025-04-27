import React, { useEffect, useState } from "react";

import { format } from "date-fns";
import { UserCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AiOutlineEdit } from "react-icons/ai";

import batchService from "../../../appwrite/batchService";
import userProfileService from "../../../appwrite/userProfileService";
import authService from "../../../appwrite/auth";
import { useGetCollegeQuery } from "../../../store/api/collegeApi";
import { useGetTradeQuery } from "../../../store/api/tradeApi";
import { Query } from "appwrite";
import Loader from "@/components/components/Loader";

const ProfileView = ({ profileProps }) => {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { userId } = useParams();

  const { data: college, isLoading: collegeDataLoading } = useGetCollegeQuery(
    profile?.collegeId,
    { skip: !profile?.collegeId }
  );
  const { data: trade, isLoading: tradeDataLoading } = useGetTradeQuery(
    profile?.tradeId,
    { skip: !profile?.tradeId }
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
      const [batchesRes] = await Promise.all([
        batchService.getBatch(profile.batchId, [
          Query.select(["$id", "BatchName"]),
        ]),
      ]);
      setBatches(batchesRes);
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
      <Loader isLoading={isLoading || collegeDataLoading || tradeDataLoading} />
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          No profile data available.
        </p>
      </div>
    );
  }

  const renderField = (label, value) => (
    <div className="flex flex-col space-y-1">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">
        {value || "Not provided"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 w-full">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs mb-6 p-6 relative">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-50 dark:ring-gray-700"
              />
            ) : (
              <UserCircle className="w-24 h-24 text-gray-300 dark:text-gray-500" />
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.userName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {profile.email}
              </p>
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                {profile.role.map((label, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm rounded-full bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-300 font-medium"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to={
                profileProps ? "/profile/edit" : `/manage-batch/edit/${userId}`
              }
              className="absolute top-4 right-4 flex gap-2"
            >
              <AiOutlineEdit
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                size={24}
              />
              <h1 className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Edit
              </h1>
            </Link>

            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  profile.status === "Active"
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {profile.status}
              </span>
            </div>
          </div>

          {userId === undefined && (
            <div className="mt-4 flex gap-6 justify-center sm:justify-start border-t-2 border-gray-200 dark:border-gray-700 pt-2">
              <Link
                to="/change-password"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change Password
              </Link>
              <button className="text-red-600 dark:text-red-400 hover:underline">
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Personal Information
              </h2>
              <div className="space-y-4">
                {renderField("Phone", profile.phone)}
                {renderField(
                  "Date of Birth",
                  profile.DOB
                    ? format(new Date(profile.DOB), "dd MMMM yyyy")
                    : null
                )}
                {renderField("Parent Contact", profile.parentContact)}
                {renderField("Address", profile.address)}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Academic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {renderField("Student ID", profile.studentId)}
                {renderField("Registration ID", profile.registerId)}
                {renderField("College", college?.collageName)}
                {renderField("Trade", trade?.tradeName)}
                {renderField("Batch", batches?.BatchName)}
                {renderField("Enrollment Status", profile.enrollmentStatus)}
                {renderField(
                  "Enrolled At",
                  profile.enrolledAt
                    ? format(new Date(profile.enrolledAt), "dd MMMM yyyy")
                    : null
                )}
                {profile.assignedBatches &&
                  renderField("Assigned Batches", profile.assignedBatches)}
              </div>
            </div>

            {/* Teacher-specific Information */}
            {profile.role.includes("Teacher") && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Teaching Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {renderField("Specialization", profile.specialization)}
                  {renderField("Grade Level", profile.gradeLevel)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics/Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Enrollment Duration
            </div>
            <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              {format(new Date(profile.enrolledAt), "MMM yyyy")} - Present
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Profile Status
            </div>
            <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              {profile.status}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Role</div>
            <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              {profile.role.join(", ")}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last Updated
            </div>
            <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              {format(new Date(), "dd MMM yyyy")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
