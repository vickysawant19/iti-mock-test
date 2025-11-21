import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { selectUser } from "@/store/userSlice";

import ProfileForm from "./ProfileForm";
import ProfileView from "./ProfileView";

import { useNavigate } from "react-router-dom";
import SetLabels from "./SetLabels";

const Profile = () => {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // If user has no labels set, show SetLabels component; otherwise, proceed with profile display
  if (
    !user.labels ||
    (!user.labels.includes("Teacher") && !user.labels.includes("Student"))
  ) {
    return <SetLabels />;
  }

  return profile ? <ProfileView profileProps={profile} /> : <ProfileForm />;
};

export default Profile;
