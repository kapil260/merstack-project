import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, ListChecks, TrendingUp, Plus } from "lucide-react";
import api from "../services/api.js";
import Loader from "../components/Loader.jsx";
import StatCard from "../components/StatCard.jsx";
import ExpenseCard from "../components/ExpenseCard.jsx";
import { CATEGORY_COLORS, formatNPR, getErrorMessage } from "../utils/format.js";

const Dashboard = () => {
  const [monthly, setMonthly] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // "Current month" is based on the user's own clock
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    const loadData = async () => {
      try {
        // three requests at the same time
        const [monthlyRes, categoryRes, recentRes] = await Promise.all([
          api.get("/expenses/summary/monthly", { params: { year, month } }),
          api.get("/expenses/summary/category", { params: { month: monthKey } }),
          api.get("/expenses", { params: { limit: 5 } }),
        ]);
        setMonthly(monthlyRes.data);
        setCategories(categoryRes.data.categories);
        setRecent(recentRes.data.expenses);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [year, month, monthKey]);

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { currentMonth, totalTransactions } = monthly;
  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Your spending overview for {monthName}</p>
        </div>
        <Link to="/expenses/add" className="btn btn-green">
          <Plus size={16} /> Add Expense
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard icon={<Wallet size={22} />} label="Spent this month" value={formatNPR(currentMonth.total)} sub={monthName} tone="navy" />
        <StatCard icon={<ListChecks size={22} />} label="Total transactions" value={totalTransactions} sub={`${currentMonth.count} this month`} tone="green" />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Highest expense (this month)"
          value={currentMonth.highest ? formatNPR(currentMonth.highest.amount) : "Rs. 0"}
          sub={currentMonth.highest ? currentMonth.highest.title : "No expenses yet"}
          tone="amber"
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Recent transactions</h3>
            <Link to="/expenses">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty">
              <h4>No transactions yet</h4>
              <p>Add your first expense to see it here.</p>
            </div>
          ) : (
            recent.map((e) => <ExpenseCard key={e._id} expense={e} />)
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Spending by category (this month)</h3>
          {categories.length === 0 ? (
            <div className="empty">
              <h4>Nothing spent this month</h4>
              <p>Your category summary will appear here.</p>
            </div>
          ) : (
            categories.map((c) => (
              <div className="cat-row" key={c.category}>
                <div className="cat-row-top">
                  <span>{c.category}</span>
                  <strong>
                    {formatNPR(c.total)} <small style={{ color: "var(--muted)" }}>({c.percentage}%)</small>
                  </strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${c.percentage}%`, background: CATEGORY_COLORS[c.category] }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Monthly expenses in {year}</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly.months}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(value) => formatNPR(value)} />
              <Bar dataKey="total" name="Spent" radius={[6, 6, 0, 0]}>
                {monthly.months.map((m) => (
                  <Cell key={m.month} fill={m.month === month ? "#16a34a" : "#0f2a4a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
