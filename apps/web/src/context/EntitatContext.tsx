// Context amb l'entitat on és l'usuari ara mateix.
// El carrega la pantalla Entitat un sol cop, i totes les pantalles de dins de l'entitat el fan servir.

import { createContext, useContext } from "react";
import type { EntitatDetallDto } from "@tfg-vestulari/shared";

export const EntitatContext = createContext<EntitatDetallDto | null>(null);

// Retorna l'entitat actual, amb el perfil i els permisos de l'usuari.
// S'ha de fer servir dins de les rutes de /entitat/:id
export function useEntitat(): EntitatDetallDto {
  const ctx = useContext(EntitatContext);
  if (!ctx) throw new Error("useEntitat s'ha d'usar dins de les rutes d'una entitat");
  return ctx;
}
