// Formulari d'un tipus de peça: el nom i els atributs que tindran les peces d'aquest tipus.
// Serveix tant per crear-lo com per editar-lo.

import { useState, type FormEvent } from "react";
import {
  ATRIBUTS_MAX,
  ATRIBUT_NOM_MAX,
  TIPUS_ATRIBUT_PECA,
  TIPUS_PECA_NOM_MAX,
  errorTipusPeca,
  type TipusAtributPeca,
} from "@tfg-vestulari/shared";
import Confirmacio from "./Confirmacio";
import Desplegable from "./Desplegable";
import "./Formulari.css";
import "./PlantillaPerfilForm.css";
import "./TipusPecaForm.css";

// Una fila del formulari. clau només serveix per a React; id és el de la BD, si ja està guardat.
export type AtributPecaFila = { clau: number; id?: number; nom: string; tipus: TipusAtributPeca | "" };

type Props = {
  nom: string;
  atributs: AtributPecaFila[];
  onCanviNom: (nom: string) => void;
  onCanvi: (atributs: AtributPecaFila[]) => void;
  // Només es crida si el formulari és vàlid
  onConfirma: () => void;
  enviant?: boolean;
  errorServidor?: string | null;
  textBoto: string;
};

// Les files que tenen alguna cosa escrita (les buides del tot no compten)
export function atributsPecaOmplerts(files: AtributPecaFila[]): AtributPecaFila[] {
  return files.filter((f) => f.nom.trim() !== "" || f.tipus !== "");
}

// Només valida i avisa: les dades les guarda qui el fa servir, amb onCanvi i onConfirma.
// Com a la plantilla de perfil, els atributs que ja estan guardats no poden canviar de tipus,
// i abans de treure'ls es demana confirmació (però no s'esborren de debò fins que es desa).
export default function TipusPecaForm({
  nom,
  atributs,
  onCanviNom,
  onCanvi,
  onConfirma,
  enviant = false,
  errorServidor = null,
  textBoto,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [perTreure, setPerTreure] = useState<AtributPecaFila | null>(null);

  // Canvia el nom o el tipus d'un atribut
  function canviaFila(clau: number, parcial: Partial<AtributPecaFila>) {
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
  function demanaEliminar(a: AtributPecaFila) {
    if (a.id === undefined) elimina(a.clau);
    else setPerTreure(a);
  }

  // Valida el nom i els atributs i, si estan bé, confirma
  function envia(e: FormEvent) {
    e.preventDefault();
    const err = errorTipusPeca(nom, atributsPecaOmplerts(atributs));
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
      <input
        className="tipus-form__nom"
        type="text"
        autoComplete="off"
        placeholder="Insereix nom del tipus de peça"
        aria-label="Nom del tipus de peça"
        value={nom}
        maxLength={TIPUS_PECA_NOM_MAX}
        onChange={(e) => {
          onCanviNom(e.target.value);
          setError(null);
        }}
      />

      <ul className="plantilla__atributs">
        {atributs.map((a, i) => (
          <li key={a.clau} className="plantilla__fila">
            <div className="plantilla__parell">
              <label className="formulari__etiqueta" htmlFor={`atribut-peca-nom-${a.clau}`}>
                Nom de l'atribut
              </label>
              <input
                id={`atribut-peca-nom-${a.clau}`}
                className="formulari__input"
                type="text"
                autoComplete="off"
                value={a.nom}
                maxLength={ATRIBUT_NOM_MAX}
                onChange={(e) => canviaFila(a.clau, { nom: e.target.value })}
              />
            </div>

            <div className="plantilla__parell">
              <label className="formulari__etiqueta" htmlFor={`atribut-peca-tipus-${a.clau}`}>
                Tipus de l'atribut
              </label>
              <Desplegable
                id={`atribut-peca-tipus-${a.clau}`}
                valor={a.tipus}
                opcions={TIPUS_ATRIBUT_PECA}
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
        missatge="Quan guardis, s'esborrarà aquest atribut i el seu valor a totes les peces d'aquest tipus."
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
