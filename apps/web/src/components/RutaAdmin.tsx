// Ruta pare de les pantalles d'una entitat que només poden veure els administradors.

import { Navigate, Outlet } from "react-router-dom";
import { useEntitat } from "../context/EntitatContext";

// Si l'usuari no és administrador, el torna a l'inici de l'entitat (l'API tampoc li donaria les dades)
export default function RutaAdmin() {
  const entitat = useEntitat();
  if (!entitat.perfil.esAdministrador) return <Navigate to={`/entitat/${entitat.id}`} replace />;
  return <Outlet />;
}
