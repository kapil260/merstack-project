import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api.js";
import Loader from "../components/Loader.jsx";
import { CATEGORY_COLORS, formatNPR, getErrorMessage } from "../utils/format.js";

const Reports = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(""); // "" = all time, or "2026-11"
  const [monthly, setMonthly] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload whenever the chosen year or month changes
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");
        const [monthlyRes, categoryRes] = await Promise.all([
          api.get("/expenses/summary/monthly", { params: { year } }),
          api.get("/expenses/summary/category", { params: month ? { month } : {} }),
        ]);
        setMonthly(monthlyRes.data);
        setCategoryData(categoryRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [year, month]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Understand where your money goes</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && !monthly ? (
        <Loader />
      ) : (
        monthly &&
        categoryData && (
          <>
            {/* ---------- Monthly summary ---------- */}
            <div className="card" style={{ marginBottom: 22 }}>
              <div className="card-head">
                <h3 className="card-title">Monthly summary</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button className="icon-btn" onClick={() => setYear(year - 1)} aria-label="Previous year">
                    <ChevronLeft />
                  </button>
                  <strong>{year}</strong>
                  <button className="icon-btn" onClick={() => setYear(year + 1)} aria-label="Next year">
                    <ChevronRight />
                  </button>
                </div>
              </div>

              <p style={{ marginBottom: 12 }}>
                Total for {year}: <strong>{formatNPR(monthly.yearTotal)}</strong>
              </p>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly.months}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                    <Tooltip formatter={(value) => formatNPR(value)} />
                    <Bar dataKey="total" name="Spent" fill="#0f2a4a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="table-wrap" style={{ marginTop: 18 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Transactions</th>
                      <th>Total spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.months.map((m) => (
                      <tr key={m.month}>
                        <td>{m.name}</td>
                        <td>{m.count}</td>
                        <td className="num">{formatNPR(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ---------- Category breakdown ---------- */}
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">Category breakdown</h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: "auto" }} />
                  {month && (
                    <button className="btn btn-light btn-sm" onClick={() => setMonth("")}>
                      All time
                    </button>
                  )}
                </div>
              </div>

              <p style={{ marginBottom: 12 }}>
                {month ? `Spending in ${month}` : "Spending of all time"}: <strong>{formatNPR(categoryData.total)}</strong>
              </p>

              {categoryData.categories.length === 0 ? (
                <div className="empty">
                  <h4>No data for this period</h4>
                  <p>Add some expenses or pick another month.</p>
                </div>
              ) : (
                <div className="grid-2" style={{ marginBottom: 0 }}>
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData.categories} dataKey="total" nameKey="category" outerRadius={100} innerRadius={50}>
                          {categoryData.categories.map((c) => (
                            <Cell key={c.category} fill={CATEGORY_COLORS[c.category]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNPR(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="table-wrap">
                    <table style={{ minWidth: 380 }}>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Count</th>
                          <th>Total</th>
                          <th>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryData.categories.map((c) => (
                          <tr key={c.category}>
                            <td>
                              <span className="dot" style={{ background: CATEGORY_COLORS[c.category], display: "inline-block", marginRight: 8 }}></span>
                              {c.category}
                            </td>
                            <td>{c.count}</td>
                            <td className="num">{formatNPR(c.total)}</td>
                            <td>{c.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      )}
    </>
  );
};

export default Reports;
