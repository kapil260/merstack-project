// Simple API test script. Start the backend first (npm run dev), seed the admin (npm run seed:admin),
// then run:  npm run test:api
// It creates two temporary users, tests every endpoint, and cleans up after itself.

import "dotenv/config";

const BASE = `http://localhost:${process.env.PORT || 8000}/api`;
let passed = 0;
let failed = 0;

// A tiny "browser": remembers cookies between requests
const makeClient = () => {
  let cookie = "";
  return async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(cookie && { Cookie: cookie }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0].startsWith("token=") && setCookie.includes("token=;") ? "" : setCookie.split(";")[0];
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, setCookie };
  };
};

const check = (name, condition) => {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
  }
};

const run = async () => {
  const stamp = Date.now();
  const alice = makeClient();
  const bob = makeClient();
  const admin = makeClient();
  const anon = (method, path, body) => makeClient()(method, path, body); // fresh "browser" every time, never logged in
  const aliceEmail = `alice${stamp}@test.com`;
  const bobEmail = `bob${stamp}@test.com`;
  let r;

  console.log("\n== AUTH ==");
  r = await alice("POST", "/users/register", { name: "Alice", email: aliceEmail, password: "secret1", confirmPassword: "secret1" });
  check("register works (201)", r.status === 201 && r.data.user.email === aliceEmail);
  check("cookie is HTTP-only", /HttpOnly/i.test(r.setCookie || ""));
  check("password is not returned", r.data.user.password === undefined);
  const aliceId = r.data.user._id;

  r = await alice("POST", "/users/register", { name: "Alice", email: aliceEmail, password: "secret1", confirmPassword: "secret1" });
  check("duplicate email rejected (409)", r.status === 409);
  r = await anon("POST", "/users/register", { name: "", email: "x", password: "1", confirmPassword: "2" });
  check("missing/invalid fields rejected (400)", r.status === 400);
  r = await anon("POST", "/users/register", { name: "A", email: "a@b.com", password: "secret1", confirmPassword: "different" });
  check("password mismatch rejected (400)", r.status === 400);
  r = await anon("POST", "/users/register", { name: "Hacker", email: `h${stamp}@test.com`, password: "secret1", confirmPassword: "secret1", role: "admin" });
  check("signup cannot set role=admin", r.status === 201 && r.data.user.role === "user");

  await bob("POST", "/users/register", { name: "Bob", email: bobEmail, password: "secret2", confirmPassword: "secret2" });

  r = await anon("POST", "/users/login", { email: aliceEmail, password: "wrong" });
  check("wrong password rejected (401)", r.status === 401);
  r = await anon("POST", "/users/login", { email: "nobody@test.com", password: "secret1" });
  check("unknown email rejected (401)", r.status === 401);
  r = await alice("POST", "/users/login", { email: aliceEmail, password: "secret1" });
  check("login works (200)", r.status === 200);

  r = await anon("GET", "/users/profile");
  check("profile without cookie -> 401", r.status === 401);
  r = await alice("GET", "/users/profile");
  check("profile with cookie -> 200", r.status === 200 && r.data.user._id === aliceId);

  r = await alice("PUT", "/users/profile", { name: "Alice Updated", email: aliceEmail });
  check("update profile name", r.status === 200 && r.data.user.name === "Alice Updated");
  r = await alice("PUT", "/users/profile", { name: "Alice", email: bobEmail });
  check("cannot take another user's email (409)", r.status === 409);
  r = await alice("PUT", "/users/change-password", { currentPassword: "bad", newPassword: "newsecret", confirmPassword: "newsecret" });
  check("change password with wrong current -> 401", r.status === 401);
  r = await alice("PUT", "/users/change-password", { currentPassword: "secret1", newPassword: "newsecret", confirmPassword: "newsecret" });
  check("change password works", r.status === 200);
  r = await anon("POST", "/users/login", { email: aliceEmail, password: "newsecret" });
  check("login with new password works", r.status === 200);

  console.log("\n== EXPENSES ==");
  r = await anon("GET", "/expenses");
  check("expenses without login -> 401", r.status === 401);

  const today = new Date().toISOString().slice(0, 10);
  r = await alice("POST", "/expenses", { title: "Momo", amount: 250, category: "Food", date: today, description: "Lunch" });
  check("create expense (201)", r.status === 201 && r.data.expense.userId === aliceId);
  const expenseId = r.data.expense._id;

  r = await alice("POST", "/expenses", { title: "Bad", amount: 0, category: "Food", date: today });
  check("amount 0 rejected (400)", r.status === 400);
  r = await alice("POST", "/expenses", { title: "Bad", amount: "abc", category: "Food", date: today });
  check("non-numeric amount rejected (400)", r.status === 400);
  r = await alice("POST", "/expenses", { title: "Bad", amount: 10, category: "Gold", date: today });
  check("invalid category rejected (400)", r.status === 400);
  r = await alice("POST", "/expenses", { title: "", amount: 10, category: "Food", date: today });
  check("empty title rejected (400)", r.status === 400);
  r = await alice("POST", "/expenses", { title: "Sneaky", amount: 10, category: "Food", date: today, userId: "000000000000000000000000" });
  check("userId from body is ignored", r.status === 201 && r.data.expense.userId === aliceId);

  await alice("POST", "/expenses", { title: "Bus ticket", amount: 50, category: "Transport", date: today });
  await alice("POST", "/expenses", { title: "Old book", amount: 900, category: "Education", date: "2026-01-15" });

  r = await alice("GET", "/expenses");
  check("list expenses", r.status === 200 && r.data.expenses.length === 4 && r.data.pagination.total === 4);
  r = await alice("GET", "/expenses?search=momo");
  check("search by title (case-insensitive)", r.data.expenses.length === 1);
  r = await alice("GET", "/expenses?search=" + encodeURIComponent("(.*"));
  check("weird search text does not crash", r.status === 200);
  r = await alice("GET", "/expenses?category=Transport");
  check("filter by category", r.data.expenses.length === 1 && r.data.expenses[0].category === "Transport");
  r = await alice("GET", "/expenses?date=2026-01-15");
  check("filter by date", r.data.expenses.length === 1 && r.data.expenses[0].title === "Old book");
  r = await alice("GET", "/expenses?limit=2&page=2");
  check("pagination", r.data.expenses.length === 2 && r.data.pagination.totalPages === 2);
  r = await alice("GET", "/expenses?category=Nope");
  check("invalid category filter -> 400", r.status === 400);

  r = await alice("GET", `/expenses/${expenseId}`);
  check("get one expense", r.status === 200 && r.data.expense.title === "Momo");
  r = await alice("GET", "/expenses/not-an-id");
  check("invalid id -> 400", r.status === 400);
  r = await bob("GET", `/expenses/${expenseId}`);
  check("other user cannot read it (404)", r.status === 404);
  r = await bob("PUT", `/expenses/${expenseId}`, { title: "Hacked", amount: 1, category: "Food", date: today });
  check("other user cannot edit it (404)", r.status === 404);
  r = await bob("DELETE", `/expenses/${expenseId}`);
  check("other user cannot delete it (404)", r.status === 404);
  r = await bob("GET", "/expenses");
  check("other user's list is empty", r.data.expenses.length === 0);

  r = await alice("PUT", `/expenses/${expenseId}`, { title: "Momo plate", amount: 300, category: "Food", date: today, description: "" });
  check("update expense", r.status === 200 && r.data.expense.amount === 300 && r.data.expense.title === "Momo plate");

  console.log("\n== SUMMARIES ==");
  r = await alice("GET", "/expenses/summary/monthly");
  const monthTotal = 300 + 10 + 50;
  check("monthly summary has 12 months", r.status === 200 && r.data.months.length === 12);
  check("current month total correct", r.data.currentMonth.total === monthTotal && r.data.currentMonth.count === 3);
  check("highest expense correct", r.data.currentMonth.highest.amount === 300);
  check("total transactions correct", r.data.totalTransactions === 4);
  check("January total correct", r.data.months[0].total === 900);
  r = await alice("GET", "/expenses/summary/category");
  check("category summary (all time)", r.status === 200 && r.data.total === 1260 && r.data.categories[0].category === "Education");
  r = await alice("GET", "/expenses/summary/category?month=2026-01");
  check("category summary for a month", r.data.categories.length === 1 && r.data.categories[0].percentage === 100);
  r = await alice("GET", "/expenses/summary/category?month=bad");
  check("bad month -> 400", r.status === 400);

  console.log("\n== ADMIN ==");
  r = await alice("GET", "/admin/dashboard");
  check("normal user blocked from admin (403)", r.status === 403);
  r = await anon("GET", "/admin/users");
  check("anonymous blocked from admin (401)", r.status === 401);
  r = await admin("POST", "/users/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  check("admin login works", r.status === 200 && r.data.user.role === "admin");

  r = await admin("GET", "/admin/dashboard");
  check("admin dashboard stats", r.status === 200 && r.data.stats.totalUsers >= 3 && r.data.stats.totalExpenses >= 4);
  r = await admin("GET", `/admin/users?search=alice${stamp}`);
  check("admin user list + search", r.status === 200 && r.data.users.length === 1 && r.data.users[0].expenseCount === 4);
  check("admin list has no passwords", r.data.users[0].password === undefined);
  r = await admin("GET", `/admin/users/${aliceId}`);
  check("admin view one user", r.status === 200 && r.data.stats.expenseCount === 4 && r.data.recentExpenses.length === 4);
  r = await admin("GET", "/admin/users/bad-id");
  check("admin invalid user id -> 400", r.status === 400);
  r = await admin("GET", "/admin/expenses?limit=5");
  check("admin all expenses with user info", r.status === 200 && r.data.expenses[0].userId.name !== undefined);
  r = await admin("GET", "/admin/expenses?category=Education");
  check("admin expense filter", r.data.expenses.every((e) => e.category === "Education"));

  const adminProfile = await admin("GET", "/users/profile");
  r = await admin("DELETE", `/admin/users/${adminProfile.data.user._id}`);
  check("admin account cannot be deleted (403)", r.status === 403);
  r = await admin("DELETE", `/admin/users/${aliceId}`);
  check("admin deletes user", r.status === 200);
  r = await admin("GET", `/admin/users/${aliceId}`);
  check("deleted user is gone (404)", r.status === 404);
  r = await anon("POST", "/users/login", { email: aliceEmail, password: "newsecret" });
  check("deleted user cannot log in", r.status === 401);
  r = await alice("GET", "/users/profile");
  check("deleted user's old cookie stops working (401)", r.status === 401);

  console.log("\n== LOGOUT / SECURITY ==");
  r = await bob("POST", "/users/logout");
  check("logout works", r.status === 200);
  r = await bob("GET", "/users/profile");
  check("after logout profile -> 401", r.status === 401);
  r = await anon("GET", "/expenses", undefined);
  check("tampered cookie rejected", (await (async () => {
    const res = await fetch(BASE + "/expenses", { headers: { Cookie: "token=abc.def.ghi" } });
    return res.status;
  })()) === 401);

  // clean up the other test users
  const list = await admin("GET", `/admin/users?search=${stamp}`);
  for (const u of list.data.users) await admin("DELETE", `/admin/users/${u._id}`);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

run().catch((e) => {
  console.error("Test crashed. Is the backend running?", e.message);
  process.exit(1);
});
