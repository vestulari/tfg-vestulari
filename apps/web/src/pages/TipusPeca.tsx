// Llista dels tipus de peça de l'entitat (Camisa, Samarreta...), amb el cercador.
// Els administradors en poden inserir un de nou: de zero o a partir d'un que ja existeix.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { TipusPecaResumDto } from "@tfg-vestulari/shared";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Cercador from "../components/Cercador";
import LlistatTipusPeca from "../components/LlistatTipusPeca";
import { useEntitat } from "../context/EntitatContext";
import { coincideix } from "../lib/cerca";
import "./Vestuari.css";
import "./TipusPeca.css";

// El botó d'inserir obre un menú amb les dues maneres de crear-lo.
// "A partir d'un existent" primer demana quin, i després obre el formulari amb els seus atributs copiats.
export default function TipusPeca() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const [tipus, setTipus] = useState<TipusPecaResumDto[] | null>(null);
  const [error, setError] = useState(false);
  const [cerca, setCerca] = useState("");
  const [menuObert, setMenuObert] = useState(false);
  const [triant, setTriant] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelat = false;
    vestuariApi
      .tipus(entitat.id)
      .then((t) => {
        if (!cancelat) setTipus(t);
      })
      .catch((e) => {
        console.error("Error carregant els tipus de peça", e);
        if (!cancelat) setError(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id]);

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

  const base = `/entitat/${entitat.id}`;
  const visibles = (tipus ?? []).filter((t) => coincideix(t.nom, cerca));

  return (
    <div className="vestuari">
      <Capcalera entitat={entitat} seccio="Tipus de peça" mostraInvitacions={false} />

      <div className="vestuari__barra">
        <BotoEnrere to={`${base}/vestuari`} />
        <Cercador valor={cerca} onCanvi={setCerca} placeholder="Cerca per tipus…" />
      </div>

      <main className="vestuari__contingut tipus-peca__contingut">
        {error && (
          <p className="vestuari__missatge" role="alert">
            No s'han pogut carregar els tipus de peça.
          </p>
        )}
        {!error && tipus === null && <p className="vestuari__missatge">Carregant…</p>}
        {tipus && tipus.length === 0 && (
          <p className="vestuari__missatge">Encara no hi ha cap tipus de peça.</p>
        )}
        {tipus && tipus.length > 0 && visibles.length === 0 && (
          <p className="vestuari__missatge">Cap tipus de peça coincideix amb la cerca.</p>
        )}

        {visibles.length > 0 && (
          <ul className="tipus-peca__llista">
            {visibles.map((t) => (
              <li key={t.id}>
                <Link className="tipus-peca__tipus" to={`${base}/vestuari/tipus/${t.id}`}>
                  {t.nom}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      {entitat.perfil.esAdministrador && (
        <div className="vestuari__peu">
          <div className="tipus-peca__inserir" ref={menuRef}>
            {menuObert && (
              <div className="tipus-peca__menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  disabled={!tipus || tipus.length === 0}
                  onClick={() => {
                    setMenuObert(false);
                    setTriant(true);
                  }}
                >
                  Crear a partir d'un tipus existent
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => navega(`${base}/vestuari/tipus/nou`)}
                >
                  Crear de zero
                </button>
              </div>
            )}
            <button
              type="button"
              className="vestuari__boto"
              aria-haspopup="menu"
              aria-expanded={menuObert}
              onClick={() => setMenuObert((o) => !o)}
            >
              <span className="vestuari__mes" aria-hidden="true">+</span>
              Inserir tipus de peça
            </button>
          </div>
        </div>
      )}

      <LlistatTipusPeca
        obert={triant}
        tipus={tipus ?? []}
        onTria={(id) => navega(`${base}/vestuari/tipus/nou?de=${id}`)}
        onCancela={() => setTriant(false)}
      />
    </div>
  );
}
