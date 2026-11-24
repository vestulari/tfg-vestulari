// Paleta de colors del vestuari de l'entitat (només administradors): els colors que es poden triar
// als atributs de tipus color de les peces. Se'n pot canviar el nom i el to, afegir-ne i treure'n.

import { useEffect, useState, type FormEvent } from "react";
import { COLORS_MAX, COLOR_NOM_MAX, errorColors, type ColorDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import { useActualitzaCatalegs, useColors } from "../context/CatalegsContext";
import { useEntitat } from "../context/EntitatContext";
import "../components/Formulari.css";
import "./ColorsVestuari.css";

// Una fila del formulari. clau només serveix per a React; id és el de la BD, si ja està guardat.
type ColorFila = { clau: number; id?: number; nom: string; hex: string };

const filesDeColors = (colors: ColorDto[]): ColorFila[] =>
  colors.map((c) => ({ clau: c.id, id: c.id, nom: c.nom, hex: c.hex }));

// Els colors que es treuen no s'esborren fins a Guardar, que abans torna a preguntar.
// Si alguna peça fa servir un color que es treu, l'API no deixa guardar i en diu el motiu.
// La paleta surt dels catàlegs de l'entitat, i en guardar-la s'hi posa la que retorna l'API.
export default function ColorsVestuari() {
  const entitat = useEntitat();
  const { dades: originals, error: errorCarrega } = useColors();
  const { posaColors } = useActualitzaCatalegs();
  const [files, setFiles] = useState<ColorFila[]>([]);
  const [omplert, setOmplert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);
  const [confirmant, setConfirmant] = useState(false);
  const [enviant, setEnviant] = useState(false);

  // Quan arriba la paleta, omple el formulari (només el primer cop, per no perdre el que s'escriu)
  useEffect(() => {
    if (!originals || omplert) return;
    setFiles(filesDeColors(originals));
    setOmplert(true);
  }, [originals, omplert]);

  // Canvia el nom o el to d'un color
  function canvia(clau: number, parcial: Partial<ColorFila>) {
    setFiles((f) => f.map((c) => (c.clau === clau ? { ...c, ...parcial } : c)));
    setError(null);
    setAvis(null);
  }

  // Afegeix un color nou al final (gris, perquè es vegi que s'ha de triar)
  function afegeix() {
    const seguent = Math.max(0, ...files.map((c) => c.clau)) + 1;
    setFiles((f) => [...f, { clau: seguent, nom: "", hex: "#808080" }]);
    setAvis(null);
  }

  // Treu un color de la llista (no s'esborra fins que es guarda)
  function treu(clau: number) {
    setFiles((f) => f.filter((c) => c.clau !== clau));
    setError(null);
    setAvis(null);
  }

  // Els colors que estaven guardats i ja no hi són
  const esborrats = (originals ?? []).filter((o) => !files.some((f) => f.id === o.id));

  // Valida i, si es treu algun color guardat, pregunta abans de guardar
  function envia(e: FormEvent) {
    e.preventDefault();
    const err = errorColors(files);
    if (err) {
      setError(err);
      return;
    }
    if (esborrats.length > 0) setConfirmant(true);
    else void desa();
  }

  // Guarda la paleta i torna a omplir el formulari amb el que ha quedat guardat
  async function desa() {
    setEnviant(true);
    setError(null);
    try {
      const desats = await vestuariApi.desaColors(
        entitat.id,
        files.map((f) => ({ id: f.id ?? null, nom: f.nom, hex: f.hex }))
      );
      posaColors(desats);
      setFiles(filesDeColors(desats));
      setAvis("S'han guardat els colors.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No s'han pogut guardar els colors.");
    } finally {
      setConfirmant(false);
      setEnviant(false);
    }
  }

  const noms = esborrats.map((c) => `«${c.nom}»`).join(", ");

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} seccio="Colors del vestuari" mostraInvitacions={false} />

      <div className="pantalla__barra">
        <BotoEnrere to={`/entitat/${entitat.id}/vestuari/tipus`} />
      </div>

      <main className="pantalla__contingut colors">
        <h1 className="colors__titol">Colors del vestuari</h1>
        {errorCarrega && <p role="alert">No s'han pogut carregar els colors.</p>}
        {!errorCarrega && originals === null && <p>Carregant…</p>}

        {originals && (
          <form className="formulari" onSubmit={envia} noValidate>
            <p className="colors__info">
              Aquests són els colors que es poden triar a les peces de roba. Clica la rodona per canviar-ne
              el to. Si en canvies el nom o el to, totes les peces d'aquell color s'actualitzen. No es pot
              treure un color que faci servir alguna peça.
            </p>

            {avis && <p className="formulari__nota" role="status">{avis}</p>}
            {files.length === 0 && <p className="formulari__nota">Encara no hi ha cap color.</p>}

            <ul className="colors__llista">
              {files.map((c, i) => (
                <li key={c.clau} className="colors__fila">
                  <label className="colors__mostra" style={{ background: c.hex }}>
                    <input
                      type="color"
                      value={c.hex.toLowerCase()}
                      onChange={(e) => canvia(c.clau, { hex: e.target.value.toUpperCase() })}
                      aria-label={`To del color ${c.nom || i + 1}`}
                    />
                  </label>
                  <input
                    className="formulari__input colors__nom"
                    type="text"
                    autoComplete="off"
                    placeholder="Nom del color"
                    aria-label={`Nom del color ${i + 1}`}
                    value={c.nom}
                    maxLength={COLOR_NOM_MAX}
                    onChange={(e) => canvia(c.clau, { nom: e.target.value })}
                  />
                  <span className="colors__hex">{c.hex}</span>
                  <button
                    type="button"
                    className="colors__treu"
                    onClick={() => treu(c.clau)}
                    aria-label={`Treu el color ${c.nom || i + 1}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="colors__afegeix"
              onClick={afegeix}
              disabled={files.length >= COLORS_MAX}
            >
              <span aria-hidden="true">+</span> Afegir color
            </button>

            {error && <p className="formulari__error" role="alert">{error}</p>}

            <div className="formulari__accions">
              <button type="submit" className="formulari__confirma" disabled={enviant}>
                {enviant ? "Un moment…" : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </main>

      <Confirmacio
        obert={confirmant}
        titol="Segur que vols guardar?"
        missatge={`S'esborraran ${esborrats.length === 1 ? "el color" : "els colors"} ${noms}. Aquesta acció no es pot desfer.`}
        textAccepta="Guardar i esborrar"
        perillosa
        enviant={enviant}
        onAccepta={() => void desa()}
        onCancela={() => setConfirmant(false)}
      />
    </div>
  );
}
