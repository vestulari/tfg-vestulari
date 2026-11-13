// Context amb l'entitat on és l'usuari ara mateix.
// El carrega la pantalla Entitat un sol cop, i totes les pantalles de dins de l'entitat el fan servir.

import { createContext, useContext } from "react";
import type { EntitatDetallDto } from "@tfg-vestulari/shared";

type Valor = {
  entitat: EntitatDetallDto;
  // Per quan una pantalla canvia l'entitat (per exemple, la configuració)
  actualitza: (entitat: EntitatDetallDto) => void;
};

export const EntitatContext = createContext<Valor | null>(null);

// Retorna el context, o peta si no som dins d'una entitat
function useValor(): Valor {
  const ctx = useContext(EntitatContext);
  if (!ctx) throw new Error("useEntitat s'ha d'usar dins de les rutes d'una entitat");
  return ctx;
}

// Retorna l'entitat actual, amb el perfil i els permisos de l'usuari.
// S'ha de fer servir dins de les rutes de /entitat/:id
export function useEntitat(): EntitatDetallDto {
  return useValor().entitat;
}

// Retorna la funció per substituir l'entitat del context per una de nova
export function useActualitzaEntitat(): (entitat: EntitatDetallDto) => void {
  return useValor().actualitza;
}
