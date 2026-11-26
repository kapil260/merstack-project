import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// Top bar: menu button (phones only) + greeting + user badge
const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <button className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="navbar-title">
        <strong>Welcome, {user.name.split(" ")[0]}</strong>
        <small>{user.role === "admin" ? "Administrator" : "Manage your expenses wisely"}</small>
      </div>
      <div className="avatar" title={user.email}>
        {user.name.charAt(0).toUpperCase()}
      </div>
    </header>
  );
};

export default Navbar;
