import axios from "axios";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1"
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});
