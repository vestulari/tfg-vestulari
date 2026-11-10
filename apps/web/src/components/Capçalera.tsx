import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UsuariDto } from "@tfg-vestulari/shared";
import { usuariApi } from "../adapters/api/UsuariAPI";
import { useAuth } from "../auth/AuthProvider";
import "./Capçalera.css";

type Props = { titol?: string };

export default function Capcalera({ titol = "Escull entitat…" }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [usuari, setUsuari] = useState<UsuariDto | null>(null);
  const [obert, setObert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    usuariApi.getMe().then(setUsuari).catch(() => setUsuari(null));
  }, []);

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

  const nom = usuari?.nom ?? user?.email ?? "";
  const inicial = nom.charAt(0).toUpperCase();
  const pendents = usuari?.invitacionsPendents ?? 0;

  function tancaSessio() {
    // Primer naveguem a la landing: si tanquéssim la sessió abans,
    // RequireAuth ens enviaria un instant a /login.
    navigate("/", { replace: true });
    void signOut();
  }

  return (
    <header className="capcalera">
      <h1 className="capcalera__titol">{titol}</h1>

      <div
        ref={menuRef}
        className={`capcalera__usuari${obert ? " capcalera__usuari--obert" : ""}`}
      >
        <button
          type="button"
          className="capcalera__toggle"
          aria-expanded={obert}
          aria-controls="menu-usuari"
          onClick={() => setObert(!obert)}
        >
          <span className="capcalera__nom">{nom}</span>
          <span className="capcalera__avatar" aria-hidden="true">{inicial}</span>
          <span className="capcalera__fletxa" aria-hidden="true">{obert ? "⌃" : "⌄"}</span>
        </button>

        {obert && (
          <ul id="menu-usuari" className="capcalera__menu">
            <li>
              <Link className="capcalera__opcio" to="/compte" onClick={() => setObert(false)}>
                El meu compte
              </Link>
            </li>
            <li>
              <Link
                className="capcalera__opcio capcalera__opcio--invitacions"
                to="/invitacions"
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
                <span className="capcalera__subratllat">Invitacions</span>
              </Link>
            </li>
            <li>
              <button type="button" className="capcalera__sortir" onClick={tancaSessio}>
                Tancar Sessió
              </button>
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}