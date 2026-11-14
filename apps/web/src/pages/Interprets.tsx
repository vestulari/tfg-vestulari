// Llista dels perfils de l'entitat (només administradors): es poden veure els administradors o els
// intèrprets, buscar-los pel nom, inserir-ne un de nou o modificar els atributs de la plantilla.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PerfilResumDto } from "@tfg-vestulari/shared";
import { perfilApi } from "../adapters/api/PerfilApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Cercador from "../components/Cercador";
import { useEntitat } from "../context/EntitatContext";
import { coincideix } from "../lib/cerca";
import "./Interprets.css";

type Filtre = "administradors" | "interprets";

// El toggle és un o l'altre: o es veuen els administradors, o els intèrprets.
// Un perfil que és les dues coses surt a totes dues llistes.
export default function Interprets() {
  const entitat = useEntitat();
  const [perfils, setPerfils] = useState<PerfilResumDto[] | null>(null);
  const [error, setError] = useState(false);
  const [cerca, setCerca] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("interprets");

  useEffect(() => {
    let cancelat = false;
    perfilApi
      .llista(entitat.id)
      .then((llista) => {
        if (!cancelat) setPerfils(llista);
      })
      .catch((e) => {
        console.error("Error carregant els perfils", e);
        if (!cancelat) setError(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id]);

  const delFiltre = useMemo(
    () =>
      (perfils ?? []).filter((p) => (filtre === "administradors" ? p.esAdministrador : p.esInterpret)),
    [perfils, filtre]
  );
  const visibles = delFiltre.filter((p) => coincideix(p.nom, cerca));

  const base = `/entitat/${entitat.id}`;

  return (
    <div className="interprets">
      <Capcalera entitat={entitat} seccio="Intèrprets" mostraInvitacions={false} />

      <div className="interprets__barra">
        <BotoEnrere to={base} />
        <Cercador valor={cerca} onCanvi={setCerca} placeholder="Buscar intèrpret" />

        <div className="interprets__filtres" role="group" aria-label="Quins perfils es veuen">
          <button
            type="button"
            className="interprets__filtre"
            aria-pressed={filtre === "administradors"}
            onClick={() => setFiltre("administradors")}
          >
            Administradors
          </button>
          <button
            type="button"
            className="interprets__filtre"
            aria-pressed={filtre === "interprets"}
            onClick={() => setFiltre("interprets")}
          >
            Intèrprets
          </button>
        </div>
      </div>

      <main className="interprets__contingut">
        {error && (
          <p className="interprets__missatge" role="alert">
            No s'han pogut carregar els perfils.
          </p>
        )}
        {!error && perfils === null && <p className="interprets__missatge">Carregant…</p>}
        {perfils && delFiltre.length === 0 && (
          <p className="interprets__missatge">
            {filtre === "administradors"
              ? "No hi ha cap administrador."
              : "Encara no hi ha cap intèrpret. Pots inserir-ne un amb el botó de sota."}
          </p>
        )}
        {perfils && delFiltre.length > 0 && visibles.length === 0 && (
          <p className="interprets__missatge">Cap perfil coincideix amb la cerca.</p>
        )}

        {visibles.length > 0 && (
          <ul className="interprets__graella">
            {visibles.map((p) => (
              <li key={p.id}>
                <Link className="interprets__perfil" to={`${base}/perfils/${p.id}`}>
                  <IconaPersona />
                  <span className="interprets__nom">{p.nom}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="interprets__peu">
        <Link className="interprets__boto" to={`${base}/perfils/nou`}>
          <span className="interprets__mes" aria-hidden="true">+</span>
          Inserir intèrpret
        </Link>
        <Link className="interprets__boto" to={`${base}/plantilla`}>
          Modificar atribut perfils
        </Link>
      </div>
    </div>
  );
}

// Silueta d'una persona, plena
function IconaPersona() {
  return (
    <svg className="interprets__icona" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="11" r="8.5" fill="currentColor" />
      <path d="M5 38 V33 a10 10 0 0 1 10 -10 H25 a10 10 0 0 1 10 10 V38 Z" fill="currentColor" />
    </svg>
  );
}
