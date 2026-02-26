import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const api = axios.create({ baseURL });

/* =========================
   REQUEST: enviar access
========================= */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =========================
   RESPONSE: refresh automático
========================= */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    // Si no hay config, no podemos reintentar
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error?.response?.status;

    // Evitar loop: si falló el refresh, cortar
    const isRefreshCall =
      originalRequest.url?.includes("/token/refresh/") ||
      originalRequest.url?.includes("token/refresh");

    // Access expirado -> intentar refresh 1 vez
    if (status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");

        // OJO: usamos baseURL para no hardcodear host/puerto
        const refreshURL = `${baseURL.replace(/\/$/, "")}/token/refresh/`;

        const res = await axios.post(
          refreshURL,
          { refresh },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccess = res.data.access;
        localStorage.setItem("access_token", newAccess);

        // set para próximas requests
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

        // reintentar request original con token nuevo
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (err) {
        console.error("Refresh token inválido o expirado. Cerrando sesión.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
