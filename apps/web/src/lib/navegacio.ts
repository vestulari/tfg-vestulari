// Per passar dades d'una pantalla a la següent en navegar, i així no haver-les de tornar a demanar a l'API.
// Per exemple, el detall d'un perfil passa el perfil a la pantalla d'editar-lo.

import { useLocation } from "react-router-dom";

// Retorna l'objecte que la pantalla anterior ha passat amb aquesta clau, si és el que toca (mateix id).
// Si no n'hi ha (per exemple, en recarregar la pàgina o entrar-hi per un enllaç), retorna null
// i la pantalla l'ha de demanar a l'API com sempre.
export function useDadaPassada<T extends { id: number }>(clau: string, id: number): T | null {
  const location = useLocation();
  const dada = (location.state as Record<string, unknown> | null)?.[clau] as T | undefined;
  return dada && dada.id === id ? dada : null;
}
