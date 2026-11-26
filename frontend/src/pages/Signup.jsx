import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/format.js";

const Signup = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;

  // One function updates whichever input changed (uses the input's "name")
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      return setError("All fields are required");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError("Please enter a valid email");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      await register(form);
      navigate("/dashboard");
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
        <p className="auth-sub">Create your free account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" placeholder="Your name" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
