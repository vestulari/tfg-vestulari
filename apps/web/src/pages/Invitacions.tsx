// Llista de les invitacions pendents de l'usuari, amb un cercador per entitat.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { InvitacioResumDto } from "@tfg-vestulari/shared";
import { invitacioApi } from "../adapters/api/InvitacioAPI";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import EntitatImatge from "../components/EntitatImatge";
import "./Invitacions.css";

// Per cercar sense distingir majúscules ni accents
const normalitza = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Les invitacions que encara no s'han obert es marquen amb un punt
export default function Invitacions() {
  const [invitacions, setInvitacions] = useState<InvitacioResumDto[] | null>(null);
  const [error, setError] = useState(false);
  const [cerca, setCerca] = useState("");

  useEffect(() => {
    invitacioApi
      .llista()
      .then(setInvitacions)
      .catch((e) => {
        console.error("Error carregant les invitacions", e);
        setError(true);
      });
  }, []);

  const visibles = useMemo(() => {
    if (!invitacions) return [];
    const q = normalitza(cerca.trim());
    return invitacions.filter((i) => normalitza(i.entitatNom).includes(q));
  }, [invitacions, cerca]);

  return (
    <div className="invitacions">
      <Capcalera titol="Invitacions" />

      <div className="invitacions__barra">
        <BotoEnrere to="/inici" />

        <label className="invitacions__cerca">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15.5 15.5 L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Cerca per entitat…"
            aria-label="Cerca per entitat"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
          />
        </label>
      </div>

      <main>
        {error && (
          <p className="invitacions__missatge" role="alert">
            No s'han pogut carregar les invitacions.
          </p>
        )}
        {!error && invitacions === null && <p className="invitacions__missatge">Carregant…</p>}
        {invitacions && invitacions.length === 0 && (
          <p className="invitacions__missatge">No tens cap invitació pendent.</p>
        )}
        {invitacions && invitacions.length > 0 && visibles.length === 0 && (
          <p className="invitacions__missatge">Cap invitació coincideix amb la cerca.</p>
        )}

        {visibles.length > 0 && (
          <ul className="invitacions__llista">
            {visibles.map((i) => (
              <li key={i.id}>
                <Link className="invitacions__fila" to={`/invitacions/${i.id}`}>
                  <span className="invitacions__sobre">
                    <svg viewBox="0 0 56 38" aria-hidden="true" focusable="false">
                      <rect x="1.5" y="1.5" width="53" height="35" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M1.5 1.5 L28 22 L54.5 1.5 M1.5 36.5 L21 18 M54.5 36.5 L35 18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    {!i.oberta && (
                      <span className="invitacions__punt" role="img" aria-label="Invitació nova" />
                    )}
                  </span>
                  <span className="invitacions__text">
                    {i.entitatNom} et convida a afegir-te a la seva entitat!
                  </span>
                  <EntitatImatge nom={i.entitatNom} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}