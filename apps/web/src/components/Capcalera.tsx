// Capçalera de les pantalles: el títol i el menú de l'usuari (compte, invitacions i tancar sessió).

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTancaSessio } from "../auth/AuthProvider";
import { useUsuari } from "../auth/UsuariProvider";
import { useEstatTornada } from "../lib/tornada";
import EntitatImatge from "./EntitatImatge";
import "./Capcalera.css";

type Props = {
  titol?: string;
  mostraUsuari?: boolean;
  // Dins d'una entitat, en lloc del títol surten la seva imatge i el seu nom
  entitat?: { nom: string };
  // La part de l'entitat on som, que surt després del nom ("Esbart Maragall - Intèrprets")
  seccio?: string;
  mostraInvitacions?: boolean;
  bloquejat?: boolean;
};

// Amb mostraUsuari a false, només es veu el títol.
// Dins d'una entitat no té sentit l'opció d'invitacions, i es pot amagar amb mostraInvitacions.
// Amb bloquejat, l'usuari es veu però el menú no s'obre (per no marxar a mitja creació d'una entitat).
// Els enllaços del menú recorden d'on venim, perquè la fletxa d'enrere hi torni.
export default function Capcalera({
  titol = "Escull entitat…",
  mostraUsuari = true,
  entitat,
  seccio,
  mostraInvitacions = true,
  bloquejat = false,
}: Props) {
  const { usuari } = useUsuari();
  const tancaSessio = useTancaSessio();
  const estatTornada = useEstatTornada();
  const [obert, setObert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tanca el menú en clicar fora o en prémer Escape
  useEffect(() => {
    if (!obert) return;
    const fora = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setObert(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setObert(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [obert]);

  const nom = usuari?.nom ?? "";
  const inicial = nom.charAt(0).toUpperCase();
  const pendents = usuari?.invitacionsPendents ?? 0;

  return (
    <header className="capcalera">
      {entitat ? (
        <h1 className="capcalera__titol capcalera__titol--entitat">
          <EntitatImatge nom={entitat.nom} />
          <span className="capcalera__nom-entitat">
            {seccio ? `${entitat.nom} - ${seccio}` : entitat.nom}
          </span>
        </h1>
      ) : (
        <h1 className="capcalera__titol">{titol}</h1>
      )}

      {mostraUsuari && (
        <div
          ref={menuRef}
          className={`capcalera__usuari${obert ? " capcalera__usuari--obert" : ""}`}
        >
          <button
            type="button"
            className="capcalera__toggle"
            aria-expanded={obert}
            aria-controls="menu-usuari"
            disabled={bloquejat}
            onClick={() => setObert(!obert)}
          >
            <span className="capcalera__nom">{nom}</span>
            <span className="capcalera__avatar" aria-hidden="true">{inicial}</span>
            <span className="capcalera__fletxa" aria-hidden="true">{obert ? "⌃" : "⌄"}</span>
          </button>

          {obert && (
            <ul id="menu-usuari" className="capcalera__menu">
              <li>
                <Link
                  className="capcalera__opcio"
                  to="/compte"
                  state={estatTornada}
                  onClick={() => setObert(false)}
                >
                  El meu compte
                </Link>
              </li>
              {mostraInvitacions && (
                <li>
                  <Link
                    className="capcalera__opcio"
                    to="/invitacions"
                    state={estatTornada}
                    onClick={() => setObert(false)}
                  >
                    {pendents > 0 && (
                      <span
                        className="capcalera__badge"
                        aria-label={`${pendents} invitacions pendents`}
                      >
                        {pendents}
                      </span>
                    )}
                    <span>Invitacions</span>
                  </Link>
                </li>
              )}
              <li>
                <button type="button" className="capcalera__sortir" onClick={tancaSessio}>
                  Tancar Sessió
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </header>
  );
}