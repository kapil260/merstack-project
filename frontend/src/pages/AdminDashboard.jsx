import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, Receipt, Wallet, TrendingUp, Eye, Trash2, Search } from "lucide-react";
import api from "../services/api.js";
import Loader from "../components/Loader.jsx";
import StatCard from "../components/StatCard.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { CATEGORIES, CATEGORY_COLORS, formatDate, formatNPR, getErrorMessage } from "../utils/format.js";

// Small reusable "Previous / Next" bar
const Pager = ({ pagination, onPage }) =>
  pagination.totalPages > 1 && (
    <div className="pagination">
      <span>
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
      </span>
      <div>
        <button className="btn btn-light btn-sm" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
          Previous
        </button>
        <button className="btn btn-light btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );

/* ================= Tab 1: Overview ================= */
const Overview = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <Loader />;

  const { stats, categoryBreakdown, recentUsers } = data;

  return (
    <>
      <div className="stats-grid">
        <StatCard icon={<Users size={22} />} label="Registered users" value={stats.totalUsers} sub={`${stats.totalAdmins} admin(s)`} tone="navy" />
        <StatCard icon={<Receipt size={22} />} label="Expenses recorded" value={stats.totalExpenses} tone="green" />
        <StatCard icon={<Wallet size={22} />} label="Total amount" value={formatNPR(stats.totalAmount)} sub={`Average ${formatNPR(Math.round(stats.averageAmount))}`} tone="amber" />
        <StatCard icon={<TrendingUp size={22} />} label="Highest expense" value={formatNPR(stats.highestAmount)} tone="purple" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Spending by category (all users)</h3>
          {categoryBreakdown.length === 0 ? (
            <div className="empty">
              <h4>No expenses recorded yet</h4>
            </div>
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip formatter={(value) => formatNPR(value)} />
                  <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
                    {categoryBreakdown.map((c) => (
                      <Cell key={c.category} fill={CATEGORY_COLORS[c.category]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Newest users</h3>
          {recentUsers.length === 0 ? (
            <div className="empty">
              <h4>No users yet</h4>
            </div>
          ) : (
            recentUsers.map((u) => (
              <div className="expense-card" key={u._id}>
                <div className="avatar">{u.name.charAt(0).toUpperCase()}</div>
                <div className="expense-info">
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </div>
                <small style={{ color: "var(--muted)" }}>{formatDate(u.createdAt)}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

/* ================= Tab 2: Users ================= */
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [viewing, setViewing] = useState(null); // details of the user being viewed
  const [viewLoading, setViewLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", { params: { page, limit: 8, search } });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  const viewUser = async (id) => {
    try {
      setViewLoading(true);
      setViewing({ loading: true });
      const res = await api.get(`/admin/users/${id}`);
      setViewing(res.data);
    } catch (err) {
      setViewing(null);
      setError(getErrorMessage(err));
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/admin/users/${toDelete._id}`);
      setSuccess(`User "${toDelete.name}" and their expenses were deleted`);
      setToDelete(null);
      if (users.length === 1 && page > 1) setPage(page - 1);
      else fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card">
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <form className="search-form" onSubmit={handleSearch}>
          <input placeholder="Search by name or email..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <button className="btn btn-primary">
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <div className="empty">
          <h4>No users found</h4>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Expenses</th>
                <th>Total spent</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-user"}`}>{u.role}</span>
                  </td>
                  <td>{u.expenseCount}</td>
                  <td className="num">{formatNPR(u.totalSpent)}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" title="View" onClick={() => viewUser(u._id)}>
                        <Eye size={16} />
                      </button>
                      {u.role !== "admin" && (
                        <button className="icon-btn danger" title="Delete" onClick={() => setToDelete(u)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />

      {viewing && (
        <div className="modal-backdrop" onClick={() => setViewing(null)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            {viewLoading || viewing.loading ? (
              <Loader />
            ) : (
              <>
                <h3>{viewing.user.name}</h3>
                <dl className="detail-list">
                  <dt>Email</dt>
                  <dd>{viewing.user.email}</dd>
                  <dt>Role</dt>
                  <dd>{viewing.user.role}</dd>
                  <dt>Joined</dt>
                  <dd>{formatDate(viewing.user.createdAt)}</dd>
                  <dt>Expenses</dt>
                  <dd>{viewing.stats.expenseCount}</dd>
                  <dt>Total spent</dt>
                  <dd>{formatNPR(viewing.stats.totalSpent)}</dd>
                </dl>
                <h4 style={{ marginBottom: 8 }}>Latest expenses</h4>
                {viewing.recentExpenses.length === 0 ? (
                  <p>This user has no expenses yet.</p>
                ) : (
                  viewing.recentExpenses.map((e) => (
                    <div className="expense-card" key={e._id}>
                      <span className="dot" style={{ background: CATEGORY_COLORS[e.category] }}></span>
                      <div className="expense-info">
                        <strong>{e.title}</strong>
                        <small>
                          {e.category} • {formatDate(e.date)}
                        </small>
                      </div>
                      <span className="expense-amount">{formatNPR(e.amount)}</span>
                    </div>
                  ))
                )}
                <div className="modal-actions">
                  <button className="btn btn-light" onClick={() => setViewing(null)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          title="Delete user?"
          message={`${toDelete.name} (${toDelete.email}) and all of their ${toDelete.expenseCount} expense(s) will be permanently deleted.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
          busy={deleting}
        />
      )}
    </div>
  );
};

/* ================= Tab 3: All expenses ================= */
const ExpensesTab = () => {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/expenses", { params: { page, limit: 10, search, category } });
        setExpenses(res.data.expenses);
        setPagination(res.data.pagination);
        setError("");
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, search, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchText.trim());
  };

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <form className="search-form" onSubmit={handleSearch}>
          <input placeholder="Search by title..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <button className="btn btn-primary">
            <Search size={16} /> Search
          </button>
        </form>
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : expenses.length === 0 ? (
        <div className="empty">
          <h4>No expenses found</h4>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id}>
                  <td>
                    <strong>{e.userId?.name || "Deleted user"}</strong>
                    <br />
                    <small style={{ color: "var(--muted)" }}>{e.userId?.email}</small>
                  </td>
                  <td>{e.title}</td>
                  <td className="num">{formatNPR(e.amount)}</td>
                  <td>
                    <span className="badge" style={{ background: CATEGORY_COLORS[e.category] + "22" }}>
                      {e.category}
                    </span>
                  </td>
                  <td>{formatDate(e.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager pagination={pagination} onPage={setPage} />
    </div>
  );
};

/* ================= The page ================= */
const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Monitor users and expenses across SpendWise</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>
          Overview
        </button>
        <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
          Users
        </button>
        <button className={`tab ${tab === "expenses" ? "active" : ""}`} onClick={() => setTab("expenses")}>
          All Expenses
        </button>
      </div>

      {tab === "overview" && <Overview />}
      {tab === "users" && <UsersTab />}
      {tab === "expenses" && <ExpensesTab />}
    </>
  );
};

export default AdminDashboard;
