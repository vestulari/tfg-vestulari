/* Encarregat de fer la redirecció de totes es pantalles */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import Landing from "./pages/LandingPage";
import Login from "./pages/LogIn";
import Inici from "./pages/Inici";
// Font allotjada amb l'app (sense peticions a Google Fonts). Només els pesos que fa servir el CSS.
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "./index.css";
import InvitacioDetall from "./pages/InvitacioDetall";
import Invitacions from "./pages/Invitacions";
import Compte from "./pages/Compte";
import CreacioPerfil from "./pages/CreacioPerfil";
import CreacioPlantillaPerfil from "./pages/CreacioPlantillaPerfil";
import CreacioEntitat from "./pages/CreacioEntitat";
import { CreacioEntitatLayout } from "./context/CreacioEntitatContext";
import Entitat from "./pages/Entitat";
import EntradaEntitat from "./pages/EntradaEntitat";
import ConfiguracioEntitat from "./pages/ConfiguracioEntitat";
import RutaAdmin from "./components/RutaAdmin";
import Interprets from "./pages/Interprets";
import PerfilDetall from "./pages/PerfilDetall";
import NouPerfil from "./pages/NouPerfil";
import EditaPerfil from "./pages/EditaPerfil";
import EditaPlantilla from "./pages/EditaPlantilla";

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
            <Route element={<CreacioEntitatLayout />}>
              <Route path="/entitats/nova" element={<CreacioEntitat />} />
              <Route path="/entitats/nova/plantilla" element={<CreacioPlantillaPerfil />} />
              <Route path="/entitats/nova/perfil" element={<CreacioPerfil />} />
            </Route>

            {/* Dins d'una entitat: Entitat la carrega i les pantalles de dins la fan servir */}
            <Route path="/entitat/:id" element={<Entitat />}>
              <Route index element={<EntradaEntitat />} />
              <Route path="configuracio" element={<ConfiguracioEntitat />} />
              {/* "El meu perfil" també és aquesta pantalla: l'API decideix qui pot veure cada perfil */}
              <Route path="perfils/:perfilId" element={<PerfilDetall />} />

              {/* Només per als administradors */}
              <Route element={<RutaAdmin />}>
                <Route path="interprets" element={<Interprets />} />
                <Route path="perfils/nou" element={<NouPerfil />} />
                <Route path="perfils/:perfilId/editar" element={<EditaPerfil />} />
                <Route path="plantilla" element={<EditaPlantilla />} />
              </Route>
            </Route>
          </Route>


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);