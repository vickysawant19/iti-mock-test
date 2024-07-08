import React from "react";
import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((state) => state.user);

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Your Profile
        </h1>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-600">Name</h2>
            <p className="text-gray-800">{user.name}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-600">Email</h2>
            <p className="text-gray-800">{user.email}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-600">Contact</h2>
            <p className="text-gray-800">{user.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
