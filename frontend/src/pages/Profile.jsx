import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, getErrorMessage } from "../utils/format.js";

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [profileBusy, setProfileBusy] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (!profile.name.trim() || !profile.email.trim()) {
      return setProfileMsg({ type: "error", text: "Name and email are required" });
    }

    try {
      setProfileBusy(true);
      const res = await api.put("/users/profile", profile);
      setUser(res.data.user); // updates the name shown in the navbar too
      setProfileMsg({ type: "success", text: res.data.message });
    } catch (err) {
      setProfileMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setProfileBusy(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      return setPasswordMsg({ type: "error", text: "All password fields are required" });
    }
    if (passwords.newPassword.length < 6) {
      return setPasswordMsg({ type: "error", text: "New password must be at least 6 characters" });
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPasswordMsg({ type: "error", text: "New passwords do not match" });
    }

    try {
      setPasswordBusy(true);
      const res = await api.put("/users/change-password", passwords);
      setPasswordMsg({ type: "success", text: res.data.message });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <p>View and update your account details</p>
        </div>
        <button className="btn btn-light" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="profile-head">
          <div className="avatar avatar-lg">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h3>{user.name}</h3>
            <p style={{ color: "var(--muted)" }}>{user.email}</p>
            <span className={`badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`} style={{ marginTop: 6 }}>
              {user.role}
            </span>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>Member since {formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Update information</h3>
          {profileMsg.text && <div className={`alert alert-${profileMsg.type}`}>{profileMsg.text}</div>}
          <form noValidate onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="pname">Name</label>
              <input id="pname" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="pemail">Email</label>
              <input id="pemail" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <button className="btn btn-primary" disabled={profileBusy}>
              {profileBusy ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Change password</h3>
          {passwordMsg.text && <div className={`alert alert-${passwordMsg.type}`}>{passwordMsg.text}</div>}
          <form noValidate onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="cur">Current password</label>
              <input id="cur" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="new">New password</label>
              <input id="new" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="conf">Confirm new password</label>
              <input id="conf" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
            </div>
            <button className="btn btn-primary" disabled={passwordBusy}>
              {passwordBusy ? "Updating..." : "Change password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
