import React from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "../../../store/profileSlice";
import { selectUser } from "../../../store/userSlice";

import ProfileForm from "./ProfileForm";
import ProfileView from "./ProfileView";
import SetLabels from "../components/SetLabels";

const Profile = () => {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  // If user has no labels set, show SetLabels component; otherwise, proceed with profile display
  if (
    !user.labels ||
    (!user.labels.includes("Teacher") && !user.labels.includes("Student"))
  ) {
    return <SetLabels />;
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center pb-20 relative">
      {profile ? <ProfileView profileProps={profile} /> : <ProfileForm />}
    </div>
  );
};

export default Profile;
