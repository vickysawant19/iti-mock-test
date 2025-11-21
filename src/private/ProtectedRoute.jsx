import { selectProfile, selectProfileLoading } from "@/store/profileSlice";
import { selectUser, selectUserLoading } from "@/store/userSlice";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const user = useSelector(selectUser);
  const userLoading = useSelector(selectUserLoading);
  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect to profile page if:
    // 1. User is authenticated
    // 2. Both user and profile loading have finished
    // 3. Profile doesn't exist
    if (!userLoading && !profileLoading && user && !profile) {
      navigate("/profile");
    }
  }, [user, profile, navigate, userLoading, profileLoading]);

  // Only redirect to login if:
  // 1. Loading has finished (both user and profile)
  // 2. User is not authenticated
  if (!userLoading && !profileLoading && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Show nothing while determining auth state (either user or profile still loading)
  // Or render the outlet if the user is authenticated
  return userLoading || profileLoading ? null : <Outlet />;
};

export default ProtectedRoute;
