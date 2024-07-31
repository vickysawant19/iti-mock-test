import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AiOutlineEdit } from "react-icons/ai";

import { ClipLoader } from "react-spinners";
import ProfileForm from "../ProfileForm";
import ProfileView from "../ProfileView";

const Profile = () => {
  const profile = useSelector((state) => state.profile);
  const isLoading = useSelector((state) => state.loading);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <ClipLoader color="#123abc" size={50} />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center pb-20">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 relative">
        {profile ? (
          <>
            <ProfileView profile={profile} />
            <Link to="/profile/edit" className="absolute top-4 right-4">
              <AiOutlineEdit
                className="text-gray-500 hover:text-gray-700"
                size={24}
              />
            </Link>
          </>
        ) : (
          <ProfileForm />
        )}
      </div>
    </div>
  );
};

export default Profile;
