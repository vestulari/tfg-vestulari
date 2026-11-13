// Formulari de les dades d'una entitat: la imatge, el nom, la data de creació i la descripció.
// Es fa servir per crear una entitat i per canviar-ne les dades a la configuració.

import { useState, type FormEvent } from "react";
import {
  DESCRIPCIO_MAX,
  ENTITAT_NOM_MAX,
  errorDataCreacio,
  errorDescripcio,
  errorNomEntitat,
} from "@tfg-vestulari/shared";
import { filtraEnter } from "../lib/enters";
import "./Formulari.css";
import "./EntitatForm.css";

// Els números es guarden com a text mentre s'escriuen
export type DadesEntitat = {
  nom: string;
  descripcio: string;
  any: string;
  mes: string;
  dia: string;
};

type Props = {
  dades: DadesEntitat;
  onCanvi: (parcial: Partial<DadesEntitat>) => void;
  // Només es crida si el formulari és vàlid.
  onConfirma: () => void;
  textBoto?: string;
  enviant?: boolean;
  errorServidor?: string | null;
};

// Passa un text a número, o a null si és buit
export const aEnter = (s: string): number | null => (s.trim() === "" ? null : Number(s));

// Només valida i avisa: les dades les guarda qui el fa servir, amb onCanvi i onConfirma.
// La imatge encara no es pot pujar: de moment només hi ha l'espai reservat.
export default function EntitatForm({
  dades,
  onCanvi,
  onConfirma,
  textBoto = "Confirmar",
  enviant = false,
  errorServidor = null,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  // Desa el canvi i treu l'error
  function canvia(parcial: Partial<DadesEntitat>) {
    onCanvi(parcial);
    setError(null);
  }

  // Valida el formulari i, si està bé, confirma
  function envia(e: FormEvent) {
    e.preventDefault();

    const err =
      errorNomEntitat(dades.nom) ??
      errorDataCreacio(aEnter(dades.any), aEnter(dades.mes), aEnter(dades.dia)) ??
      errorDescripcio(dades.descripcio);

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
      <div className="entitat-form__dalt">
        {/* Espai reservat per a la imatge: encara no és funcional */}
        <div className="entitat-form__imatge" aria-hidden="true">
          <svg className="entitat-form__icona" viewBox="0 0 80 64" focusable="false">
            <rect x="3" y="3" width="74" height="58" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
            <polyline
              points="3,48 24,26 40,42 54,30 77,52"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="56" cy="18" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
          <span>Insereix imatge</span>
        </div>

        <div className="entitat-form__camps">
          <div className="formulari__fila">
            <label className="formulari__etiqueta entitat-form__etiqueta" htmlFor="entitat-nom">
              Nom de l'entitat
            </label>
            <input
              id="entitat-nom"
              className="formulari__input entitat-form__nom"
              type="text"
              autoComplete="off"
              placeholder="Escriu aquí…"
              value={dades.nom}
              maxLength={ENTITAT_NOM_MAX}
              onChange={(e) => canvia({ nom: e.target.value })}
            />
          </div>

          <div className="formulari__fila">
            <div className="entitat-form__etiqueta">
              <span className="formulari__etiqueta" id="etiqueta-data">
                Data de creació de l'entitat
              </span>
              <span className="formulari__nota" id="nota-data">
                D'aquests números l'únic obligatori és l'any
              </span>
            </div>
            <div
              className="entitat-form__data"
              role="group"
              aria-labelledby="etiqueta-data"
              aria-describedby="nota-data"
            >
              <input
                className="formulari__input formulari__input--centrat"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Dia"
                aria-label="Dia"
                maxLength={2}
                value={dades.dia}
                onChange={(e) => canvia({ dia: filtraEnter(e.target.value) })}
              />
              <input
                className="formulari__input formulari__input--centrat"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Mes"
                aria-label="Mes"
                maxLength={2}
                value={dades.mes}
                onChange={(e) => canvia({ mes: filtraEnter(e.target.value) })}
              />
              <input
                className="formulari__input formulari__input--centrat"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Any"
                aria-label="Any (obligatori)"
                maxLength={4}
                value={dades.any}
                onChange={(e) => canvia({ any: filtraEnter(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>

      <label className="formulari__etiqueta" htmlFor="entitat-descripcio">
        Descripció de l'entitat
      </label>
      <textarea
        id="entitat-descripcio"
        className="formulari__textarea"
        placeholder={
          "Explica què sou, d'on sou, què feu… Qualsevol dada que pugui ser rellevant de l'entitat!\nAquesta informació la veuran els usuaris convidats."
        }
        maxLength={DESCRIPCIO_MAX}
        value={dades.descripcio}
        onChange={(e) => canvia({ descripcio: e.target.value })}
      />
      <span className="formulari__comptador" aria-hidden="true">
        {Array.from(dades.descripcio).length} / {DESCRIPCIO_MAX}
      </span>

      {missatge && <p className="formulari__error" role="alert">{missatge}</p>}

      <div className="formulari__accions">
        <button type="submit" className="formulari__confirma" disabled={enviant}>
          {enviant ? "Un moment…" : textBoto}
        </button>
      </div>
    </form>
  );
}
