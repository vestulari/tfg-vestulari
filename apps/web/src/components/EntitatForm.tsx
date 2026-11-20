// Formulari de les dades d'una entitat: la imatge, el nom, la data de creació i la descripció.
// Es fa servir per crear una entitat i per canviar-ne les dades a la configuració.

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DESCRIPCIO_MAX,
  ENTITAT_NOM_MAX,
  errorDataCreacio,
  errorDescripcio,
  errorNomEntitat,
} from "@tfg-vestulari/shared";
import { filtraEnter } from "../lib/enters";
import { comprimeix } from "../lib/imatges";
import { useTriaImatge } from "./TriaImatge";
import "./Formulari.css";
import "./EntitatForm.css";

// Què es vol fer amb la imatge: posar-ne una de nova, treure la que hi ha, o res (null)
export type CanviImatge = File | "treu" | null;

// Els números es guarden com a text mentre s'escriuen
export type DadesEntitat = {
  nom: string;
  descripcio: string;
  any: string;
  mes: string;
  dia: string;
  imatge: CanviImatge;
};

type Props = {
  dades: DadesEntitat;
  // La imatge que l'entitat ja té guardada (en editar-la)
  imatgeActual?: string | null;
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
// La imatge tampoc es puja aquí: el formulari la comprimeix i només diu quina s'ha triat (o si s'ha de treure).
export default function EntitatForm({
  dades,
  imatgeActual = null,
  onCanvi,
  onConfirma,
  textBoto = "Confirmar",
  enviant = false,
  errorServidor = null,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [comprimint, setComprimint] = useState(false);

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

  // Previsualització de la imatge triada. La URL local s'allibera quan ja no es fa servir.
  const previsualitzacio = useMemo(
    () => (dades.imatge instanceof File ? URL.createObjectURL(dades.imatge) : null),
    [dades.imatge]
  );
  useEffect(() => {
    return () => {
      if (previsualitzacio) URL.revokeObjectURL(previsualitzacio);
    };
  }, [previsualitzacio]);

  const imatgeVisible = previsualitzacio ?? (dades.imatge === "treu" ? null : imatgeActual);

  // Valida i comprimeix la imatge triada. La previsualització ja mostra la versió comprimida,
  // que és la que es pujarà. Si no és vàlida, avisa i no la canvia.
  async function triaImatge(fitxer: File | undefined) {
    if (!fitxer) return;
    setComprimint(true);
    const r = await comprimeix(fitxer, "entitat");
    setComprimint(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    canvia({ imatge: r.fitxer });
  }

  // Treu la imatge: si l'entitat en tenia una de guardada, s'esborrarà en desar
  function treuImatge() {
    canvia({ imatge: imatgeActual ? "treu" : null });
  }

  // La finestra per triar si la imatge ve de la galeria o de la càmera
  const triador = useTriaImatge({ camera: "posterior", onImatge: (f) => void triaImatge(f) });

  const missatge = error ?? errorServidor;

  return (
    <form className="formulari" onSubmit={envia} noValidate>
      <div className="entitat-form__dalt">
        <div className="entitat-form__columna-imatge">
          {/* Tot el requadre obre la finestra per triar d'on ve la imatge */}
          <button
            type="button"
            className="entitat-form__imatge"
            disabled={comprimint}
            onClick={triador.obre}
          >
            {comprimint ? (
              <span>Preparant la imatge…</span>
            ) : imatgeVisible ? (
              <img className="entitat-form__previsualitzacio" src={imatgeVisible} alt="Imatge de l'entitat" />
            ) : (
              <>
                <svg className="entitat-form__icona" viewBox="0 0 80 64" focusable="false" aria-hidden="true">
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
              </>
            )}
          </button>
          {triador.elements}
          {imatgeVisible && !comprimint && (
            <button type="button" className="entitat-form__treu" onClick={treuImatge}>
              Treure la imatge
            </button>
          )}
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
        <button type="submit" className="formulari__confirma" disabled={enviant || comprimint}>
          {enviant ? "Un moment…" : textBoto}
        </button>
      </div>
    </form>
  );
}
