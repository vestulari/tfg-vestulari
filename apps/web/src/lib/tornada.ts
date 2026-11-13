// Recorda des de quina pantalla s'ha obert el compte o les invitacions, per poder-hi tornar.

import { useLocation, type Location } from "react-router-dom";

type EstatTornada = { from?: Location } | null;

// Retorna l'estat que s'ha de passar als enllaços: la pantalla on som,
// o la que ja es recordava si hi hem arribat des del menú (així no ens quedem atrapats entre compte i invitacions).
export function useEstatTornada(): { from: Location } {
  const location = useLocation();
  const from = (location.state as EstatTornada)?.from;
  return { from: from ?? location };
}

// Retorna la ruta on ha de portar la fletxa d'enrere. Si no se'n recorda cap
// (per exemple, en recarregar la pàgina), torna a l'inici.
export function useTornada(): string {
  const location = useLocation();
  const from = (location.state as EstatTornada)?.from;
  return from ? `${from.pathname}${from.search}${from.hash}` : "/inici";
}
