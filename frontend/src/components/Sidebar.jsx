import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Receipt, BarChart3, User, ShieldCheck, LogOut, Wallet, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/expenses/add", label: "Add Expense", icon: <PlusCircle size={18} /> },
  { to: "/expenses", label: "All Expenses", icon: <Receipt size={18} />, end: true },
  { to: "/reports", label: "Reports", icon: <BarChart3 size={18} /> },
  { to: "/profile", label: "Profile", icon: <User size={18} /> },
];

const adminLinks = [
  { to: "/admin", label: "Admin Dashboard", icon: <ShieldCheck size={18} /> },
  { to: "/profile", label: "Profile", icon: <User size={18} /> },
];

// Left navigation. On phones it slides in when "open" is true.
const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user.role === "admin" ? adminLinks : userLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <Wallet size={24} />
          <span>SpendWise</span>
          <button className="icon-btn close-sidebar" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={onClose} className="nav-link">
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="nav-link logout-link" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
