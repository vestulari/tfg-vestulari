// Pantalla d'inici d'una entitat: els botons per anar al vestuari, als espectacles, als intèrprets,
// a la configuració, o per canviar d'entitat (tornar a la llista).

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Capcalera from "../components/Capcalera";
import { useEntitat } from "../context/EntitatContext";
import "./EntradaEntitat.css";

// Un botó gran de l'entitat. Mentre la seva pantalla no existeixi, surt desactivat amb "Properament".
function BotoSeccio({ icona, text }: { icona: ReactNode; text: string }) {
  return (
    <button type="button" className="entitat__seccio" disabled>
      <span className="entitat__icona" aria-hidden="true">{icona}</span>
      <span className="entitat__text">{text}</span>
      <span className="entitat__properament">Properament</span>
    </button>
  );
}

// Només els administradors veuen la llista d'intèrprets.
// La resta veuen "El meu perfil", on hi ha les dades del seu perfil en aquesta entitat.
export default function EntradaEntitat() {
  const entitat = useEntitat();
  const veuInterprets = entitat.perfil.esAdministrador;

  return (
    <div className="entitat">
      <Capcalera entitat={entitat} mostraInvitacions={false} />

      <main className="entitat__contingut">
        <nav className="entitat__seccions" aria-label={`Seccions de ${entitat.nom}`}>
          <BotoSeccio icona={<IconaPenjador />} text="Vestuari" />
          <BotoSeccio icona={<IconaTelo />} text="Espectacles" />
          {veuInterprets ? (
            <BotoSeccio icona={<IconaPersona />} text="Intèrprets" />
          ) : (
            <BotoSeccio icona={<IconaPersona />} text="El meu perfil" />
          )}

          <div className="entitat__peu">
            <button type="button" className="entitat__boto entitat__boto--configuracio" disabled>
              <span className="entitat__icona-petita" aria-hidden="true"><IconaEngranatge /></span>
              <span className="entitat__text">Configuració</span>
              <span className="entitat__properament">Properament</span>
            </button>

            <Link className="entitat__boto entitat__boto--sortir" to="/inici">
              <span className="entitat__icona-petita" aria-hidden="true"><IconaPorta /></span>
              <span className="entitat__text">Canviar d'entitat</span>
            </Link>
          </div>
        </nav>
      </main>
    </div>
  );
}

// ---------- Icones ----------

// Penjador de roba
function IconaPenjador() {
  return (
    <svg viewBox="0 0 56 40" focusable="false">
      <path
        d="M24 8.5a4 4 0 1 1 4 4V17 M28 17 L4.5 33 a2 2 0 0 0 1.2 3.6 H50.3 a2 2 0 0 0 1.2 -3.6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Teló de teatre
function IconaTelo() {
  return (
    <svg viewBox="0 0 56 40" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M2 3 H54 M3 3 V7 H53 V3" />
        <path d="M5 7 C11 18 9 30 4 38 H17 C14 28 18 16 25 7" />
        <path d="M51 7 C45 18 47 30 52 38 H39 C42 28 38 16 31 7" />
        <path d="M10 12 C13 22 12 30 10 37 M46 12 C43 22 44 30 46 37" />
      </g>
    </svg>
  );
}

// Persona
function IconaPersona() {
  return (
    <svg viewBox="0 0 40 40" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="20" cy="12" r="8" />
        <path d="M5 38 a15 15 0 0 1 30 0 Z" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// Engranatge
function IconaEngranatge() {
  return (
    <svg viewBox="0 0 40 40" focusable="false">
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="5.9 5.9" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="7" />
    </svg>
  );
}

// Porta oberta
function IconaPorta() {
  return (
    <svg viewBox="0 0 40 40" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M10 37 V3 H30 V37" />
        <path d="M10 3 L22 7 V40 L10 37 Z" />
        <circle cx="19" cy="22" r="1" />
      </g>
    </svg>
  );
}
