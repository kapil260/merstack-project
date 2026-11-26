import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/format.js";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in? Go straight to the right page.
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      return setError("Please enter your email and password");
    }

    try {
      setLoading(true);
      const loggedIn = await login(email, password);
      navigate(loggedIn.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Wallet /> SpendWise
        </div>
        <p className="auth-sub">Log in to manage your expenses</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          New to SpendWise? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
