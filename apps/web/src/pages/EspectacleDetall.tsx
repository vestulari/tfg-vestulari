// Detall d'un espectacle: el nom, la data d'estrena, la descripció, i les actuacions o les escenes
// (es tria amb el toggle). Tothom el pot mirar. Els administradors el poden editar o eliminar des del menú ⋯.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { EspectacleDetallDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { espectacleApi } from "../adapters/api/EspectacleApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import { useEntitat } from "../context/EntitatContext";
import { dataCurta, textEstrena } from "../lib/dates";
import { useDadaPassada } from "../lib/navegacio";
import "./EspectacleDetall.css";

type Estat =
  | { tipus: "carregant" }
  | { tipus: "no_disponible" }
  | { tipus: "error" }
  | { tipus: "ok"; espectacle: EspectacleDetallDto };

type Vista = "actuacions" | "escenes";

// L'espectacle només es demana a l'API si la pantalla anterior no l'ha passat (per exemple, en tornar d'editar-lo).
// Amb les actuacions surt el botó de crear-ne una (encara no funciona); amb les escenes, no.
// Eliminar es confirma abans, perquè s'esborren també les escenes i les actuacions.
export default function EspectacleDetall() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const { espectacleId } = useParams();
  const id = Number(espectacleId);
  const esAdmin = entitat.perfil.esAdministrador;
  const passat = useDadaPassada<EspectacleDetallDto>("espectacle", id);

  const [estat, setEstat] = useState<Estat>(passat ? { tipus: "ok", espectacle: passat } : { tipus: "carregant" });
  const [vista, setVista] = useState<Vista>("actuacions");
  const [menuObert, setMenuObert] = useState(false);
  const [eliminant, setEliminant] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [errorAccio, setErrorAccio] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Demana l'espectacle, si no l'ha passat la pantalla anterior
  useEffect(() => {
    if (passat) {
      setEstat({ tipus: "ok", espectacle: passat });
      return;
    }
    if (!Number.isInteger(id) || id <= 0) {
      setEstat({ tipus: "no_disponible" });
      return;
    }
    let cancelat = false;
    setEstat({ tipus: "carregant" });
    espectacleApi
      .detall(entitat.id, id)
      .then((espectacle) => {
        if (!cancelat) setEstat({ tipus: "ok", espectacle });
      })
      .catch((e) => {
        if (cancelat) return;
        setEstat(e instanceof ApiError && e.status === 404 ? { tipus: "no_disponible" } : { tipus: "error" });
      });
    return () => {
      cancelat = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitat.id, id]);

  // El menú es tanca en clicar fora o amb Escape
  useEffect(() => {
    if (!menuObert) return;
    const fora = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuObert(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuObert(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", escape);
    };
  }, [menuObert]);

  const base = `/entitat/${entitat.id}/espectacles`;

  // Elimina l'espectacle i torna a la llista
  async function elimina() {
    setEnviant(true);
    setErrorAccio(null);
    try {
      await espectacleApi.elimina(entitat.id, id);
      navega(base, { replace: true });
    } catch (e) {
      setErrorAccio(e instanceof ApiError ? e.message : "No s'ha pogut eliminar l'espectacle.");
      setEnviant(false);
    }
  }

  const e = estat.tipus === "ok" ? estat.espectacle : null;

  return (
    <div className="espectacle">
      <Capcalera entitat={entitat} seccio="Espectacle" mostraInvitacions={false} />

      <main className="espectacle__targeta">
        <div className="espectacle__cap">
          <BotoEnrere to={base} />
          {e && (
            <div className="espectacle__titol">
              <h1 className="espectacle__nom">{e.nom}</h1>
              <p className="espectacle__estrena">{textEstrena(e.anyEstrena, e.mesEstrena, e.diaEstrena)}</p>
            </div>
          )}

          {e && esAdmin && (
            <div className="espectacle__menu" ref={menuRef}>
              <button
                type="button"
                className="espectacle__punts"
                aria-label="Més accions"
                aria-haspopup="menu"
                aria-expanded={menuObert}
                onClick={() => setMenuObert((o) => !o)}
              >
                <span aria-hidden="true">•••</span>
              </button>
              {menuObert && (
                <div className="espectacle__opcions" role="menu">
                  <Link role="menuitem" to={`${base}/${id}/editar`} state={{ espectacle: e }}>
                    Editar espectacle
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="espectacle__opcio--perill"
                    onClick={() => {
                      setMenuObert(false);
                      setErrorAccio(null);
                      setEliminant(true);
                    }}
                  >
                    Eliminar espectacle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {estat.tipus === "carregant" && <p className="espectacle__missatge">Carregant…</p>}
        {estat.tipus === "no_disponible" && <p className="espectacle__missatge">Aquest espectacle no existeix.</p>}
        {estat.tipus === "error" && (
          <p className="espectacle__missatge" role="alert">No s'ha pogut carregar l'espectacle.</p>
        )}

        {e && (
          <>
            <div className="espectacle__fila">
              <span className="espectacle__etiqueta">Descripció</span>
              <p className={`espectacle__descripcio${e.descripcio ? "" : " espectacle__descripcio--buida"}`}>
                {e.descripcio || "Aquest espectacle encara no té descripció."}
              </p>
            </div>

            <div className="espectacle__vistes" role="group" aria-label="Què es veu de l'espectacle">
              <button
                type="button"
                className="espectacle__vista"
                aria-pressed={vista === "actuacions"}
                onClick={() => setVista("actuacions")}
              >
                Actuacions
              </button>
              <button
                type="button"
                className="espectacle__vista"
                aria-pressed={vista === "escenes"}
                onClick={() => setVista("escenes")}
              >
                Escenes
              </button>
            </div>

            {vista === "actuacions" ? (
              <>
                {e.actuacions.length === 0 ? (
                  <p className="espectacle__buit">Aquest espectacle encara no té cap actuació.</p>
                ) : (
                  <ul className="espectacle__llista">
                    {e.actuacions.map((a) => (
                      <li key={a.id} className="espectacle__element">
                        <span>{a.nom}</span>
                        {a.data && <span className="espectacle__data">{dataCurta(a.data)}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {esAdmin && (
                  <div className="espectacle__accions">
                    <button type="button" className="espectacle__boto" disabled title="Properament">
                      <span className="espectacle__mes" aria-hidden="true">+</span>
                      Nova actuació
                      <span className="espectacle__properament">Properament</span>
                    </button>
                  </div>
                )}
              </>
            ) : e.escenes.length === 0 ? (
              <p className="espectacle__buit">
                Aquest espectacle encara no té cap escena.{esAdmin && " Les pots afegir editant-lo."}
              </p>
            ) : (
              <ol className="espectacle__llista espectacle__llista--escenes">
                {e.escenes.map((s) => (
                  <li key={s.id} className="espectacle__element">{s.nom}</li>
                ))}
              </ol>
            )}
          </>
        )}
      </main>

      <Confirmacio
        obert={eliminant}
        titol={`Vols eliminar «${e?.nom ?? ""}»?`}
        missatge="S'esborraran per sempre l'espectacle, les seves escenes i totes les actuacions (amb on surt cada intèrpret i el vestuari que porta). Aquesta acció no es pot desfer."
        textAccepta="Eliminar l'espectacle"
        perillosa
        enviant={enviant}
        error={errorAccio}
        onAccepta={() => void elimina()}
        onCancela={() => setEliminant(false)}
      />
    </div>
  );
}
