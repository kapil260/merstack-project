import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Loader from "./components/Loader.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AddExpense from "./pages/AddExpense.jsx";
import AllExpenses from "./pages/AllExpenses.jsx";
import Reports from "./pages/Reports.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

// "/" sends people to the right place
const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
};

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Pages only for normal users */}
    <Route element={<ProtectedRoute role="user" />}>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expenses/add" element={<AddExpense />} />
        <Route path="/expenses/:id/edit" element={<AddExpense />} />
        <Route path="/expenses" element={<AllExpenses />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Route>

    {/* Pages only for admins */}
    <Route element={<ProtectedRoute role="admin" />}>
      <Route element={<Layout />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Route>

    {/* Profile: any logged-in person */}
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
