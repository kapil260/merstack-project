import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";

// The frame around every logged-in page: sidebar + top bar + the page itself (<Outlet />)
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
