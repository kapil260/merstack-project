import axios from "axios";

// One Axios instance used by the whole app.
// withCredentials: true lets the browser send/receive the HTTP-only JWT cookie.
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

export default api;
