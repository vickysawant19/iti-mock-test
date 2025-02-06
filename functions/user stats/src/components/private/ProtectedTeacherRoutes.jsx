import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";
import { selectUser } from "../../store/userSlice";

const ProtectedTeacherRoutes = () => {
  const user = useSelector(selectUser);

  if (
    !user ||
    (!user.labels.includes("Teacher") && !user.labels.includes("admin"))
  ) {
    toast.error("Access denied. Teacher or Admin only");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedTeacherRoutes;
