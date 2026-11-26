# SpendWise – Personal Expense Tracker

A full-stack **MERN** application (MongoDB, Express, React, Node.js) where users record and categorise their daily
expenses and view monthly reports, and administrators manage users and monitor the whole system.
All amounts are in **Nepalese Rupees (Rs.)**.

## Features

**Users**
- Sign up, log in, log out (JWT stored in an HTTP-only cookie)
- Add, view, edit and delete expenses (8 categories)
- Search by title, filter by category and date, pagination
- Dashboard: this month's total, number of transactions, highest expense, recent transactions, category summary, monthly chart
- Reports: monthly summary (bar chart + table) and category breakdown (pie chart + table)
- Profile: update name / email, change password, logout

**Admin** (separate dashboard, `/admin`)
- Overall statistics (users, expenses, total / average / highest amount, spending by category)
- Users table with search, view details, delete user (also deletes that user's expenses)
- View every expense recorded by every user

## Tech stack

| Part     | Technology |
|----------|-----------|
| Frontend | React 19, Vite, React Router, Axios, Recharts, Lucide icons, plain CSS |
| Backend  | Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs, dotenv, cors, cookie-parser |

## Folder structure

```
SpendWise/
├── Backend/
│   ├── src/
│   │   ├── connectToDb/connectToDb.js     connects to MongoDB
│   │   ├── schema/                        userSchema.js, expenseSchema.js (Mongoose models)
│   │   ├── controller/                    userController.js, expenseController.js, adminController.js
│   │   ├── routes/                        userRouter.js, expenseRouter.js, adminRouter.js
│   │   ├── middleware/                    authMiddleware.js (login check), adminMiddleware.js (admin check)
│   │   ├── seedAdmin.js                   creates the first admin account
│   │   └── index.js                       starts the server
│   ├── test-api.js                        automatic API test script (64 checks)
│   └── .env.example
└── frontend/
    └── src/
        ├── components/   Navbar, Sidebar, Layout, ProtectedRoute, ExpenseCard, StatCard, ConfirmModal, Loader
        ├── pages/        Login, Signup, Dashboard, AddExpense, AllExpenses, Reports, Profile, AdminDashboard
        ├── context/      AuthContext.jsx   (who is logged in)
        ├── services/     api.js            (one Axios instance)
        ├── utils/        format.js         (Rs. formatting, categories, colours)
        ├── App.jsx       all routes
        └── index.css     all styles
```

## Setup

You need **Node.js 18+** and a MongoDB database (either a free [MongoDB Atlas](https://www.mongodb.com/atlas)
cluster, or MongoDB installed locally).

### 1. Backend

```bash
cd Backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Open `.env` and fill in:

| Variable | Meaning |
|----------|---------|
| `PORT` | `8000` |
| `MONGO_URI` | Atlas string (`mongodb+srv://USER:PASSWORD@cluster.../spendwise`) or local `mongodb://127.0.0.1:27017/spendwise` |
| `JWT_SECRET` | a long random text. Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_URL` | `http://localhost:5173` |
| `NODE_ENV` | `development` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | details of the first admin (password at least 8 characters) |

Create the first admin, then start the server:

```bash
npm run seed:admin
npm run dev
```

Backend: http://localhost:8000 (test: http://localhost:8000/api/health)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  (always open it as `localhost`, not `127.0.0.1`, so the cookie and CORS settings match)

### 3. Log in

- Normal user: click **Create an account** on the login page.
- Admin: log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`. You are taken to `/admin`.

## Testing

With MongoDB connected, the backend running and the admin seeded:

```bash
cd Backend
npm run test:api
```

It creates temporary users, checks every endpoint (auth, validation, ownership rules, summaries, admin routes) and
deletes them afterwards. Expected ending: `Result: 64 passed, 0 failed`.

## API reference

All responses are JSON: `{ success: true/false, message, ... }`. Logged-in routes need the cookie set by login.

| Method | URL | Access | Purpose |
|--------|-----|--------|---------|
| POST | `/api/users/register` | public | create account (role is always `user`) |
| POST | `/api/users/login` | public | log in, sets the HTTP-only cookie |
| POST | `/api/users/logout` | public | clears the cookie |
| GET | `/api/users/profile` | user | current user |
| PUT | `/api/users/profile` | user | update name and email |
| PUT | `/api/users/change-password` | user | change password |
| POST | `/api/expenses` | user | add expense |
| GET | `/api/expenses?search=&category=&date=&page=&limit=` | user | list own expenses |
| GET | `/api/expenses/:id` | user | one own expense |
| PUT | `/api/expenses/:id` | user | update own expense |
| DELETE | `/api/expenses/:id` | user | delete own expense |
| GET | `/api/expenses/summary/monthly?year=&month=` | user | totals for 12 months + current-month stats |
| GET | `/api/expenses/summary/category?month=YYYY-MM` | user | totals per category (omit month = all time) |
| GET | `/api/admin/dashboard` | admin | overall statistics |
| GET | `/api/admin/users?search=&page=` | admin | all users with expense count / total |
| GET | `/api/admin/users/:id` | admin | one user + stats + latest expenses |
| DELETE | `/api/admin/users/:id` | admin | delete a user and their expenses |
| GET | `/api/admin/expenses?search=&category=&userId=&page=` | admin | all expenses with owner name |

## How the security works (good points to explain to your teacher)

1. **Passwords are hashed** with bcryptjs before saving. The plain password is never stored or returned.
2. **JWT in an HTTP-only cookie.** JavaScript on the page cannot read it, so nothing sensitive is in `localStorage`.
   CORS is configured with `credentials: true` for the frontend URL only.
3. **`authMiddleware`** verifies the token on every protected request and loads the real user from the database.
   A deleted user's old token stops working immediately.
4. **Identity comes from the token, never from the request body.** When creating an expense, `userId = req.user._id`.
   Any `userId` the browser sends is ignored.
5. **Ownership:** expense queries always include `userId: req.user._id`, so another user's expense simply looks
   "not found".
6. **`adminMiddleware`** blocks non-admins from every `/api/admin/*` route (403).
7. **No public admin signup.** `register` ignores any `role` field. The first admin is created from the terminal
   with `npm run seed:admin`, using values from `.env`.
8. Secrets live only in `.env`, which is listed in `.gitignore`.
9. Login gives the same error for "wrong email" and "wrong password", search text is escaped before being used in a
   regular expression, and invalid ids / amounts / categories are rejected.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoDB connection failed` | Check `MONGO_URI`. On Atlas, allow your IP under *Network Access* and use the correct database-user password. |
| `JWT_SECRET is missing` | You forgot to copy `.env.example` to `.env`. |
| Frontend says it cannot reach the server | Make sure the backend is running on port 8000. |
| Login works but you are logged out on refresh | Open the app at `http://localhost:5173` (not `127.0.0.1`). |
| `EADDRINUSE` | Another program uses the port. Stop it or change `PORT`. |

## Notes

- Dates are stored as calendar days (UTC midnight), so an expense dated 4 Nov always shows as 4 Nov.
- For a real deployment on separate domains you would set `NODE_ENV=production` (secure cookie) and change the cookie
  `sameSite` setting to `none`. For local use and demos the defaults are correct.
