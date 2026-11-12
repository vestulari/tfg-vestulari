import { useState, type FormEvent } from "react";
import {
  ATRIBUTS_BASICS,
  ATRIBUTS_MAX,
  ATRIBUT_NOM_MAX,
  TIPUS_ATRIBUT,
  errorAtributs,
} from "@tfg-vestulari/shared";
import { atributsOmplerts, type AtributFila } from "../context/CreacioEntitatContext";
import Desplegable from "./Desplegable";
import "./Formulari.css";
import "./PlantillaPerfilForm.css";

type Props = {
  /** `creacio`: text introductori. `edicio`: només l'avís dels canvis. */
  mode: "creacio" | "edicio";
  atributs: AtributFila[];
  onCanvi: (atributs: AtributFila[]) => void;
  /** Només es crida si el formulari és vàlid. */
  onConfirma: () => void;
  enviant?: boolean;
  errorServidor?: string | null;
};

export default function PlantillaPerfilForm({
  mode,
  atributs,
  onCanvi,
  onConfirma,
  enviant = false,
  errorServidor = null,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  function canviaFila(clau: number, parcial: Partial<AtributFila>) {
    onCanvi(atributs.map((a) => (a.clau === clau ? { ...a, ...parcial } : a)));
    setError(null);
  }

  function afegeix() {
    const seguent = Math.max(0, ...atributs.map((a) => a.clau)) + 1;
    onCanvi([...atributs, { clau: seguent, nom: "", tipus: "" }]);
  }

  function elimina(clau: number) {
    onCanvi(atributs.filter((a) => a.clau !== clau));
    setError(null);
  }

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
          el tindran buit.
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
                onCanvi={(tipus) => canviaFila(a.clau, { tipus })}
              />
            </div>

            <button
              type="button"
              className="plantilla__elimina"
              onClick={() => elimina(a.clau)}
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
          {enviant ? "Un moment…" : "Confirmar"}
        </button>
      </div>
    </form>
  );
}