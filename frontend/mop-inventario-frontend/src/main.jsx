import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./auth/AuthContext.jsx";
import { CatalogosProvider } from "./catalogos/CatalogosContext.jsx";
import { ThemeProvider } from "./global/useTheme.jsx";
import { initTheme } from "./global/theme.js";

initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatalogosProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </CatalogosProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
