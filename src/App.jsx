import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import { addUser, selectUser } from "./store/userSlice";
import { addProfile, selectProfile } from "./store/profileSlice";
import { initializeActiveBatch } from "./store/activeBatchSlice";
import { store } from "./store/store";
import authService from "./services/auth.service";
import userProfileService from "./appwrite/userProfileService";
import Navbar from "./components/navbar/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { usePresence } from "./hooks/usePresence";

import { ThemeProvider } from "./ThemeProvider";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSelector(selectProfile);

  // Track the current user's live presence (online / away / heartbeat / cleanup on logout)
  usePresence();

  const isQuotaExceededPage = location.pathname === "/quota-exceeded";

  const checkUserStatus = async () => {
    dispatch(addUser({ isLoading: true }));
    dispatch(addProfile({ isLoading: true }));
    try {
      const currentUser = await authService.getCurrentUser();
      console.log("[DEBUG App.jsx] currentUser from authService:", currentUser);
      
      if (currentUser) {
        // Detect login user change to prevent data swapping
        const lastUserId = localStorage.getItem("last_active_user");
        if (lastUserId && lastUserId !== currentUser.$id) {
          console.warn("[App.jsx] Logged-in user changed. Cleaning localStorage user caches...");
          const theme = localStorage.getItem("app-theme");
          localStorage.clear();
          if (theme) {
            localStorage.setItem("app-theme", theme);
          }
        }
        localStorage.setItem("last_active_user", currentUser.$id);

        dispatch(addUser({ data: currentUser, isLoading: false }));

        // Read profile from live Redux state to avoid stale closure bug
        const freshProfile = store.getState().profile.data;

        if (!freshProfile) {
          const profileRes = await userProfileService.getUserProfile(
            currentUser.$id
          );
          if (profileRes) {
            dispatch(addProfile({ data: profileRes, isLoading: false }));
            dispatch(initializeActiveBatch(profileRes));
            if (window.location.pathname === "/") {
              navigate("/arena");
            }
          } else {
            // No profile in DB — send to onboarding
            dispatch(addProfile({ isLoading: false }));
            if (currentUser.labels && currentUser.labels.includes("Teacher")) {
              navigate("/onboarding/teacher");
            } else {
              navigate("/onboarding");
            }
          }
        } else {
          // Profile already in Redux — just sync batch, no extra DB call
          dispatch(addUser({ isLoading: false }));
          dispatch(addProfile({ isLoading: false }));
          dispatch(initializeActiveBatch(freshProfile));
        }
      } else {
        // Not logged in
        localStorage.removeItem("last_active_user");
        dispatch(addUser({ isLoading: false }));
        dispatch(addProfile({ isLoading: false }));
      }
    } catch (error) {
      console.error("Error checking user status: ", error);
      dispatch(addUser({ isLoading: false }));
      dispatch(addProfile({ isLoading: false }));
      if (error?.code === 402 || error?.type === "limit_databases_reads_exceeded") {
        navigate("/quota-exceeded");
      }
    } finally {
      setIsLoading(false);
      // Signal that App's first auth check is complete — ProtectedRoute may now evaluate redirects
      dispatch(addProfile({ isInitialized: true }));
    }
  };

  useEffect(() => {
    checkUserStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, dispatch]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <div className="bg-gray-100 w-full min-h-screen dark:bg-black">
        {!isQuotaExceededPage && (
          <Navbar
            isNavOpen={isNavOpen}
            setIsNavOpen={setIsNavOpen}
            isLoading={isLoading}
          />
        )}

        <div className="mx-auto">
          <Outlet />
          <ToastContainer />
        </div>

        <Analytics mode="production" />
      </div>
    </ThemeProvider>
  );
}

export default App;
