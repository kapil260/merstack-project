import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api.js";

// The AuthContext stores "who is logged in" and shares it with every page.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check if the cookie is still valid

  // When the app opens, ask the backend "am I still logged in?" (the cookie is sent automatically)
  useEffect(() => {
    api
      .get("/users/profile")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/users/login", { email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post("/users/register", formData);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Shortcut: const { user } = useAuth();
export const useAuth = () => useContext(AuthContext);
