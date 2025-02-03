import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const user = useSelector((state) => state.user);
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && !profile) {
      navigate("/profile");
    }
  }, [user, profile, navigate]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
