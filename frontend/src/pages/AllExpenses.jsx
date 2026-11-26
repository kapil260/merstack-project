import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Search, Plus } from "lucide-react";
import api from "../services/api.js";
import Loader from "../components/Loader.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { CATEGORIES, CATEGORY_COLORS, formatDate, formatNPR, getErrorMessage } from "../utils/format.js";

const AllExpenses = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.message || "");

  // searchText = what is typed; filters = what is actually sent to the backend
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ search: "", category: "", date: "" });
  const [page, setPage] = useState(1);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.date) params.date = filters.date;

      const res = await api.get("/expenses", { params });
      setExpenses(res.data.expenses);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters({ ...filters, search: searchText.trim() });
  };

  const changeFilter = (name, value) => {
    setPage(1);
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setSearchText("");
    setPage(1);
    setFilters({ search: "", category: "", date: "" });
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/expenses/${toDelete._id}`);
      setToDelete(null);
      setSuccess("Expense deleted successfully");
      // if we deleted the last item on this page, go back one page
      if (expenses.length === 1 && page > 1) setPage(page - 1);
      else fetchExpenses();
    } catch (err) {
      setError(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = filters.search || filters.category || filters.date;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>All Expenses</h2>
          <p>{pagination.total} transaction(s) found</p>
        </div>
        <Link to="/expenses/add" className="btn btn-green">
          <Plus size={16} /> Add Expense
        </Link>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filters">
          <form className="search-form" onSubmit={handleSearch}>
            <input placeholder="Search by title..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            <button className="btn btn-primary">
              <Search size={16} /> Search
            </button>
          </form>
          <select value={filters.category} onChange={(e) => changeFilter("category", e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input type="date" value={filters.date} onChange={(e) => changeFilter("date", e.target.value)} />
          {hasFilters && (
            <button className="btn btn-light btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <Loader />
        ) : expenses.length === 0 ? (
          <div className="empty">
            <h4>No expenses found</h4>
            <p>{hasFilters ? "Try changing your search or filters." : "Add your first expense to get started."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <strong>{e.title}</strong>
                    </td>
                    <td className="num">{formatNPR(e.amount)}</td>
                    <td>
                      <span className="badge" style={{ background: CATEGORY_COLORS[e.category] + "22" }}>
                        <span className="dot" style={{ background: CATEGORY_COLORS[e.category], display: "inline-block", width: 8, height: 8, marginRight: 6 }}></span>
                        {e.category}
                      </span>
                    </td>
                    <td>{formatDate(e.date)}</td>
                    <td className="desc-cell" title={e.description}>
                      {e.description || "-"}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" title="Edit" onClick={() => navigate(`/expenses/${e._id}/edit`)}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn danger" title="Delete" onClick={() => setToDelete(e)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div>
              <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button className="btn btn-light btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Delete expense?"
          message={`"${toDelete.title}" (${formatNPR(toDelete.amount)}) will be permanently deleted.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
          busy={deleting}
        />
      )}
    </>
  );
};

export default AllExpenses;
