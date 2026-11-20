// Detall d'una peça de roba: el nom, el codi, el tipus, els valors dels atributs, qui la va crear,
// la descripció i la foto. Tothom la pot mirar i descarregar-ne la fitxa tècnica.
// Els administradors la poden editar o eliminar des del menú ⋯.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  codiPeca,
  type AtributPecaDto,
  type ColorDto,
  type PecaDetallDto,
} from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import { useEntitat } from "../context/EntitatContext";
import "../components/Formulari.css";
import "./PecaDetall.css";

type Estat =
  | { tipus: "carregant" }
  | { tipus: "no_disponible" }
  | { tipus: "error" }
  | { tipus: "ok"; peca: PecaDetallDto; atributs: AtributPecaDto[]; colors: ColorDto[] };

// Carrega la peça, els atributs del seu tipus i la paleta alhora.
// Si en venim d'inserir-la i la foto no s'ha pogut pujar, ho diu l'avís que arriba amb la navegació.
export default function PecaDetall() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const ubicacio = useLocation();
  const { pecaId } = useParams();
  const id = Number(pecaId);
  const esAdmin = entitat.perfil.esAdministrador;
  const avis = (ubicacio.state as { avis?: string } | null)?.avis ?? null;

  const [estat, setEstat] = useState<Estat>({ tipus: "carregant" });
  const [menuObert, setMenuObert] = useState(false);
  const [eliminant, setEliminant] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [errorAccio, setErrorAccio] = useState<string | null>(null);
  const [generant, setGenerant] = useState(false);
  const [errorFitxa, setErrorFitxa] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setEstat({ tipus: "no_disponible" });
      return;
    }
    let cancelat = false;
    (async () => {
      try {
        const [peca, colors] = await Promise.all([vestuariApi.peca(entitat.id, id), vestuariApi.colors(entitat.id)]);
        const tipus = await vestuariApi.tipusDetall(entitat.id, peca.tipusId);
        if (!cancelat) setEstat({ tipus: "ok", peca, atributs: tipus.atributs, colors });
      } catch (e) {
        if (cancelat) return;
        setEstat(e instanceof ApiError && e.status === 404 ? { tipus: "no_disponible" } : { tipus: "error" });
      }
    })();
    return () => {
      cancelat = true;
    };
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

  const base = `/entitat/${entitat.id}/vestuari`;

  // Genera i descarrega la fitxa tècnica en PDF
  async function fitxa() {
    if (estat.tipus !== "ok") return;
    setMenuObert(false);
    setGenerant(true);
    setErrorFitxa(null);
    try {
      const { descarregaFitxa } = await import("../lib/fitxaTecnica");
      await descarregaFitxa({ entitat, peca: estat.peca, atributs: estat.atributs, colors: estat.colors });
    } catch (e) {
      console.error("Error generant la fitxa tècnica", e);
      setErrorFitxa("No s'ha pogut generar la fitxa tècnica. Torna-ho a provar.");
    } finally {
      setGenerant(false);
    }
  }

  // Elimina la peça i torna a l'inventari
  async function elimina() {
    setEnviant(true);
    setErrorAccio(null);
    try {
      await vestuariApi.eliminaPeca(entitat.id, id);
      navega(base, { replace: true });
    } catch (e) {
      setErrorAccio(e instanceof ApiError ? e.message : "No s'ha pogut eliminar la peça.");
      setEnviant(false);
    }
  }

  return (
    <div className="peca-detall">
      <Capcalera entitat={entitat} seccio="Vestuari" mostraInvitacions={false} />

      <main className="peca-detall__targeta">
        <div className="peca-detall__cap">
          <BotoEnrere to={base} />
          {estat.tipus === "ok" && (
            <div className="peca-detall__titol">
              <h1 className="peca-detall__nom">{estat.peca.nom}</h1>
              <p className="peca-detall__codi">{codiPeca(estat.peca.tipusId, estat.peca.id)}</p>
            </div>
          )}

          {estat.tipus === "ok" && (
            <div className="peca-detall__menu" ref={menuRef}>
              <button
                type="button"
                className="peca-detall__punts"
                aria-label="Més accions"
                aria-haspopup="menu"
                aria-expanded={menuObert}
                onClick={() => setMenuObert((o) => !o)}
              >
                <span aria-hidden="true">•••</span>
              </button>
              {menuObert && (
                <div className="peca-detall__opcions" role="menu">
                  <button type="button" role="menuitem" onClick={() => void fitxa()}>
                    Descarregar fitxa tècnica
                  </button>
                  <button type="button" role="menuitem" disabled title="Properament">
                    Generar codi <span className="peca-detall__properament">Properament</span>
                  </button>
                  {esAdmin && (
                    <Link role="menuitem" to={`${base}/peces/${id}/editar`}>
                      Editar peça
                    </Link>
                  )}
                  {esAdmin && (
                    <button
                      type="button"
                      role="menuitem"
                      className="peca-detall__opcio--perill"
                      onClick={() => {
                        setMenuObert(false);
                        setErrorAccio(null);
                        setEliminant(true);
                      }}
                    >
                      Eliminar peça
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {estat.tipus === "carregant" && <p className="peca-detall__missatge">Carregant…</p>}
        {estat.tipus === "no_disponible" && <p className="peca-detall__missatge">Aquesta peça no existeix.</p>}
        {estat.tipus === "error" && (
          <p className="peca-detall__missatge" role="alert">No s'ha pogut carregar la peça.</p>
        )}

        {avis && <p className="formulari__error peca-detall__avis" role="alert">{avis}</p>}
        {generant && <p className="peca-detall__missatge" role="status">Generant la fitxa tècnica…</p>}
        {errorFitxa && <p className="formulari__error peca-detall__avis" role="alert">{errorFitxa}</p>}

        {estat.tipus === "ok" && <Contingut {...estat} />}
      </main>

      <Confirmacio
        obert={eliminant}
        titol={`Vols eliminar «${estat.tipus === "ok" ? estat.peca.nom : ""}»?`}
        missatge="S'eliminarà aquesta peça de roba i la seva foto. Aquesta acció no es pot desfer."
        textAccepta="Eliminar"
        perillosa
        enviant={enviant}
        error={errorAccio}
        onAccepta={() => void elimina()}
        onCancela={() => setEliminant(false)}
      />
    </div>
  );
}

// Els camps i la foto de la peça
function Contingut({ peca, atributs, colors }: { peca: PecaDetallDto; atributs: AtributPecaDto[]; colors: ColorDto[] }) {
  return (
    <div className="peca-detall__cos">
      <div>
        <dl className="peca-detall__camps">
          <Camp etiqueta="Tipus de peça">{peca.tipusNom}</Camp>
          {atributs.map((a) => {
            const valor = peca.valors.find((v) => v.atributId === a.id)?.valor;
            if (a.tipus !== "color") return <Camp key={a.id} etiqueta={a.nom}>{valor ?? "—"}</Camp>;
            const c = colors.find((c) => String(c.id) === valor);
            return (
              <Camp key={a.id} etiqueta={a.nom}>
                {c ? (
                  <>
                    <span className="peca-detall__mostra" style={{ background: c.hex }} aria-hidden="true" />
                    {c.nom}
                  </>
                ) : (
                  "—"
                )}
              </Camp>
            );
          })}
          <Camp etiqueta="Peça creada per">{peca.creadaPer ?? "—"}</Camp>
        </dl>

        <h2 className="peca-detall__subtitol">Descripció:</h2>
        <p className="peca-detall__descripcio">{peca.descripcio ?? "Sense descripció."}</p>
      </div>

      <div className="peca-detall__foto">
        {peca.imatgeUrl ? (
          <img src={peca.imatgeUrl} alt={`Foto de ${peca.nom}`} />
        ) : (
          <span className="peca-detall__sense-foto">Sense foto</span>
        )}
      </div>
    </div>
  );
}

// Un camp de la peça: l'etiqueta i el valor en una píndola blanca
function Camp({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="peca-detall__camp">
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  );
}
