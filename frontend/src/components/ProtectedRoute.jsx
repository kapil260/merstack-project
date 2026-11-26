import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

// Guards pages.
//  - not logged in            -> go to /login
//  - role="user" or "admin"   -> only that role may enter, others are sent to their own home page
const ProtectedRoute = ({ role }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Checking login..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
