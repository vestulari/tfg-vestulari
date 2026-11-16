// Botó amb la fletxa per tornar a la pantalla anterior.

import { Link } from "react-router-dom";
import "./BotoEnrere.css";

type Props = { to: string; etiqueta?: string; state?: unknown };

// Porta a la ruta que li passem. L'etiqueta és el que llegeixen els lectors de pantalla.
// Amb state, es pot passar informació a la pantalla on anem (per exemple, d'on veníem).
export default function BotoEnrere({ to, etiqueta = "Torna enrere", state }: Props) {
  return (
    <Link className="boto-enrere" to={to} state={state} aria-label={etiqueta}>
      <svg viewBox="0 0 68 54" aria-hidden="true" focusable="false">
        <path d="M0 27 L27 0 V16 H68 V38 H27 V54 Z" fill="currentColor" />
      </svg>
    </Link>
  );
}
