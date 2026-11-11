/* Encarregat de fer la redirecció de totes es pantalles */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import Landing from "./pages/LandingPage";
import Login from "./pages/LogIn";
import Inici from "./pages/Inici";
import "./index.css";
import InvitacioDetall from "./pages/InvitacioDetall";
import Invitacions from "./pages/Invitacions";
import Compte from "./pages/Compte";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Rutes que requereixen inici de sessió */}
          <Route element={<RequireAuth />}>
            <Route path="/inici" element={<Inici />} />
            <Route path="/compte" element={<Compte />} />
            <Route path="/invitacions" element={<Invitacions />} />
            <Route path="/invitacions/:id" element={<InvitacioDetall />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);