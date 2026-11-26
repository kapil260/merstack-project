import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api.js";
import Loader from "../components/Loader.jsx";
import { CATEGORIES, getErrorMessage, todayLocal, toInputDate } from "../utils/format.js";

// This one page is used for BOTH adding a new expense (/expenses/add)
// and editing an existing one (/expenses/:id/edit). If there is an :id in the URL, we are editing.
const emptyForm = () => ({ title: "", amount: "", category: "Food", date: todayLocal(), description: "" });

const AddExpense = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // When editing, load the existing expense and fill the form
  useEffect(() => {
    if (!isEdit) {
      setForm(emptyForm());
      return;
    }
    setLoading(true);
    api
      .get(`/expenses/${id}`)
      .then((res) => {
        const e = res.data.expense;
        setForm({
          title: e.title,
          amount: e.amount,
          category: e.category,
          date: toInputDate(e.date),
          description: e.description || "",
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Please enter a title");
    if (!form.amount || Number(form.amount) < 0.01) return setError("Amount must be at least 0.01");
    if (!form.date) return setError("Please choose a date");

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/expenses/${id}`, form);
        navigate("/expenses", { state: { message: "Expense updated successfully" } });
      } else {
        await api.post("/expenses", form);
        setSuccess("Expense added successfully!");
        setForm(emptyForm());
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{isEdit ? "Edit Expense" : "Add Expense"}</h2>
          <p>{isEdit ? "Change the details below" : "Record a new transaction"}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" placeholder="e.g. Lunch at Momo Hut" value={form.title} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount (Rs.)</label>
              <input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="1500" value={form.amount} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea id="description" name="description" placeholder="Any notes..." value={form.description} onChange={handleChange} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Expense" : "Add Expense"}
            </button>
            {isEdit && (
              <button type="button" className="btn btn-light" onClick={() => navigate("/expenses")}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default AddExpense;
