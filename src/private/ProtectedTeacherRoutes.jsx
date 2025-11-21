import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";
import { selectUser } from "@/store/userSlice";

const ProtectedTeacherRoutes = () => {
  const user = useSelector(selectUser);
  if (!user.labels.includes("Teacher")) {
    toast.error("Access denied. Teacher only");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedTeacherRoutes;
