import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";
import { selectUser} from "../../store/userSlice";


const ProtectedAdminRoutes = () => {
  const user = useSelector(selectUser);
  if (!user.labels?.includes("admin")) {
    toast.error("Access denied. Admin only");
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default ProtectedAdminRoutes;
