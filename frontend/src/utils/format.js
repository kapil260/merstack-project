// Small helper functions and constants used by many pages.

export const CATEGORIES = ["Food", "Transport", "Shopping", "Education", "Entertainment", "Health", "Bills", "Other"];

// One colour per category (used in charts and badges)
export const CATEGORY_COLORS = {
  Food: "#f59e0b",
  Transport: "#3b82f6",
  Shopping: "#ec4899",
  Education: "#8b5cf6",
  Entertainment: "#14b8a6",
  Health: "#ef4444",
  Bills: "#0f2a4a",
  Other: "#94a3b8",
};

// 1500 -> "Rs. 1,500"
export const formatNPR = (amount) => {
  const number = Number(amount) || 0;
  return "Rs. " + number.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

// "2026-11-04T00:00:00.000Z" -> "04 Nov 2026"  (dates are stored as UTC, so we show them as UTC)
export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

// Date -> "2026-11-04" (what <input type="date"> needs)
export const toInputDate = (date) => new Date(date).toISOString().slice(0, 10);

// Today's date in the USER's local time zone, as "YYYY-MM-DD"
export const todayLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

// Gets a readable message out of an Axios error
export const getErrorMessage = (error) =>
  error.response?.data?.message || "Cannot reach the server. Please check that the backend is running.";
