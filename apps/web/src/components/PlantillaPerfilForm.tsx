// Formulari de la plantilla de perfil: els atributs que tindran tots els perfils de l'entitat.
// Serveix tant per crear-la (mode creacio) com per editar-la (mode edicio).

import { useState, type FormEvent } from "react";
import {
  ATRIBUTS_BASICS,
  ATRIBUTS_MAX,
  ATRIBUT_NOM_MAX,
  TIPUS_ATRIBUT,
  errorAtributs,
} from "@tfg-vestulari/shared";
import { atributsOmplerts, type AtributFila } from "../context/CreacioEntitatContext";
import Confirmacio from "./Confirmacio";
import Desplegable from "./Desplegable";
import "./Formulari.css";
import "./PlantillaPerfilForm.css";

type Props = {
  // En mode creacio surt el text d'explicació, i en mode edicio només l'avís dels canvis
  mode: "creacio" | "edicio";
  atributs: AtributFila[];
  onCanvi: (atributs: AtributFila[]) => void;
  // Només es crida si el formulari és vàlid.
  onConfirma: () => void;
  enviant?: boolean;
  errorServidor?: string | null;
  textBoto?: string;
};

// Només valida i avisa: les dades les guarda qui el fa servir, amb onCanvi i onConfirma.
// Els atributs que ja estan guardats no poden canviar de tipus, i abans de treure'ls es demana confirmació
// (però no s'esborren de debò fins que es desa la plantilla).
export default function PlantillaPerfilForm({
  mode,
  atributs,
  onCanvi,
  onConfirma,
  enviant = false,
  errorServidor = null,
  textBoto = "Confirmar",
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [perTreure, setPerTreure] = useState<AtributFila | null>(null);

  // Canvia el nom o el tipus d'un atribut
  function canviaFila(clau: number, parcial: Partial<AtributFila>) {
    onCanvi(atributs.map((a) => (a.clau === clau ? { ...a, ...parcial } : a)));
    setError(null);
  }

  // Afegeix una fila buida al final
  function afegeix() {
    const seguent = Math.max(0, ...atributs.map((a) => a.clau)) + 1;
    onCanvi([...atributs, { clau: seguent, nom: "", tipus: "" }]);
  }

  // Treu un atribut de la llista
  function elimina(clau: number) {
    onCanvi(atributs.filter((a) => a.clau !== clau));
    setError(null);
  }

  // Si l'atribut ja estava guardat, primer pregunta; si és nou, el treu directament
  function demanaEliminar(a: AtributFila) {
    if (a.id === undefined) elimina(a.clau);
    else setPerTreure(a);
  }

  // Valida els atributs i, si estan bé, confirma
  function envia(e: FormEvent) {
    e.preventDefault();
    const err = errorAtributs(atributsOmplerts(atributs));
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onConfirma();
  }

  const missatge = error ?? errorServidor;

  return (
    <form className="formulari" onSubmit={envia} noValidate>
      {mode === "creacio" ? (
        <div className="plantilla__info">
          <p>
            Has de saber que, en crear una entitat, podràs crear perfils per a les persones que no
            tinguin compte o no hi puguin accedir. Tots els comptes que s'uneixin a la teva entitat
            ho hauran de fer enllaçant-se a un perfil.
          </p>
          <p>
            Els perfils bàsics només tenen nom, edat i gènere. Si vols afegir-hi algun atribut més,
            pots fer-ho ara. També el podràs modificar més endavant, però tingues en compte que els
            perfils que ja existeixin tindran aquell atribut buit.
          </p>
        </div>
      ) : (
        <p className="plantilla__avis" role="note">
          Els canvis afecten tots els perfils de l'entitat: si elimines un atribut, se n'esborraran
          els valors a tots els perfils, i si n'afegeixes un de nou, els perfils que ja existeixen
          el tindran buit. El tipus dels atributs que ja existeixen no es pot canviar.
        </p>
      )}

      <div className="plantilla__basics">
        <span className="formulari__nota">Atributs bàsics, sempre presents:</span>
        <ul className="plantilla__xips">
          {ATRIBUTS_BASICS.map((b) => (
            <li key={b} className="plantilla__xip">{b}</li>
          ))}
        </ul>
      </div>

      <ul className="plantilla__atributs">
        {atributs.map((a, i) => (
          <li key={a.clau} className="plantilla__fila">
            <div className="plantilla__parell">
              <label className="formulari__etiqueta" htmlFor={`atribut-nom-${a.clau}`}>
                Nom de l'atribut
              </label>
              <input
                id={`atribut-nom-${a.clau}`}
                className="formulari__input"
                type="text"
                autoComplete="off"
                value={a.nom}
                maxLength={ATRIBUT_NOM_MAX}
                onChange={(e) => canviaFila(a.clau, { nom: e.target.value })}
              />
            </div>

            <div className="plantilla__parell">
              <label className="formulari__etiqueta" htmlFor={`atribut-tipus-${a.clau}`}>
                Tipus de l'atribut
              </label>
              <Desplegable
                id={`atribut-tipus-${a.clau}`}
                valor={a.tipus}
                opcions={TIPUS_ATRIBUT}
                placeholder="Escollir tipus"
                disabled={a.id !== undefined}
                onCanvi={(tipus) => canviaFila(a.clau, { tipus })}
              />
            </div>

            <button
              type="button"
              className="plantilla__elimina"
              onClick={() => demanaEliminar(a)}
              aria-label={`Elimina l'atribut ${i + 1}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="plantilla__afegeix"
        onClick={afegeix}
        disabled={atributs.length >= ATRIBUTS_MAX}
      >
        <span className="plantilla__mes" aria-hidden="true">+</span>
        <span>Afegir atribut nou</span>
      </button>

      {missatge && <p className="formulari__error" role="alert">{missatge}</p>}

      <div className="formulari__accions">
        <button type="submit" className="formulari__confirma" disabled={enviant}>
          {enviant ? "Un moment…" : textBoto}
        </button>
      </div>

      <Confirmacio
        obert={perTreure !== null}
        titol={`Vols treure «${perTreure?.nom ?? ""}»?`}
        missatge="Quan guardis la plantilla, s'esborrarà aquest atribut i el seu valor a tots els perfils de l'entitat."
        textAccepta="Treure l'atribut"
        perillosa
        onAccepta={() => {
          if (perTreure) elimina(perTreure.clau);
          setPerTreure(null);
        }}
        onCancela={() => setPerTreure(null)}
      />
    </form>
  );
}