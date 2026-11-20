// Formulari d'una peça de roba: el nom, el tipus de peça, els valors dels atributs del tipus,
// la descripció i la foto. Serveix tant per inserir-la com per editar-la.

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DESCRIPCIO_MAX,
  PECA_NOM_MAX,
  VALOR_MAX,
  errorPeca,
  type AtributPecaDto,
  type ColorDto,
  type TipusPecaResumDto,
} from "@tfg-vestulari/shared";
import { filtraEnter } from "../lib/enters";
import { comprimeix } from "../lib/imatges";
import { useTriaImatge } from "./TriaImatge";
import type { CanviImatge } from "./EntitatForm";
import Desplegable from "./Desplegable";
import "./Formulari.css";
import "./PecaForm.css";

// El que s'està escrivint. tipusId és text perquè el desplegable treballa amb text ("" si no n'hi ha cap).
export type PecaEsborrany = {
  nom: string;
  descripcio: string;
  tipusId: string;
  valors: Record<number, string>; // id de l'atribut → valor (als colors, l'id del color)
  imatge: CanviImatge;
};

type Props = {
  dades: PecaEsborrany;
  onCanvi: (canvi: Partial<PecaEsborrany>) => void;
  tipus: TipusPecaResumDto[];
  // Els atributs del tipus triat (null mentre es carreguen o si encara no se n'ha triat cap)
  atributs: AtributPecaDto[] | null;
  colors: ColorDto[];
  // En editar, el tipus no es pot canviar
  tipusFix: boolean;
  // La foto que la peça ja té guardada (en editar-la)
  imatgeActual?: string | null;
  // Només es crida si el formulari és vàlid
  onConfirma: () => void;
  enviant?: boolean;
  errorServidor?: string | null;
};

// Els valors de l'esborrany que tenen alguna cosa escrita, en el format de l'API
export function valorsDEsborrany(e: PecaEsborrany, atributs: AtributPecaDto[]) {
  return atributs
    .filter((a) => (e.valors[a.id] ?? "").trim() !== "")
    .map((a) => ({ atributId: a.id, valor: (e.valors[a.id] ?? "").trim() }));
}

// Només valida i avisa: les dades les guarda la pantalla, amb onCanvi i onConfirma.
// La foto tampoc es puja aquí: es comprimeix i només es diu quina s'ha triat (o si s'ha de treure).
export default function PecaForm({
  dades,
  onCanvi,
  tipus,
  atributs,
  colors,
  tipusFix,
  imatgeActual = null,
  onConfirma,
  enviant = false,
  errorServidor = null,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [comprimint, setComprimint] = useState(false);

  // Canvia un camp i esborra l'error que hi hagués
  function canvia(canvi: Partial<PecaEsborrany>) {
    onCanvi(canvi);
    setError(null);
  }

  // Valida el formulari i, si està bé, confirma
  function envia(e: FormEvent) {
    e.preventDefault();
    if (dades.tipusId === "") {
      setError("Cal triar el tipus de peça.");
      return;
    }
    if (atributs === null) return; // encara s'estan carregant
    const err = errorPeca(
      { nom: dades.nom, descripcio: dades.descripcio, valors: valorsDEsborrany(dades, atributs) },
      atributs,
      colors
    );
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onConfirma();
  }

  // Previsualització de la foto triada. La URL local s'allibera quan ja no es fa servir.
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

  // Valida i comprimeix la foto triada (amb la qualitat del vestuari, perquè es vegin els detalls)
  async function triaImatge(fitxer: File | undefined) {
    if (!fitxer) return;
    setComprimint(true);
    const r = await comprimeix(fitxer, "vestuari");
    setComprimint(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    canvia({ imatge: r.fitxer });
  }

  const opcionsTipus = tipus.map((t) => ({ valor: String(t.id), etiqueta: t.nom }));
  const opcionsColor = colors.map((c) => ({ valor: String(c.id), etiqueta: c.nom, color: c.hex }));
  const missatge = error ?? errorServidor;

  // La finestra per triar si la foto ve de la galeria o de la càmera
  const triador = useTriaImatge({ camera: "posterior", onImatge: (f) => void triaImatge(f) });

  return (
    <form className="formulari peca-form" onSubmit={envia} noValidate>
      <input
        className="peca-form__nom"
        type="text"
        autoComplete="off"
        placeholder="Insereix el nom de la peça"
        aria-label="Nom de la peça"
        value={dades.nom}
        maxLength={PECA_NOM_MAX}
        onChange={(e) => canvia({ nom: e.target.value })}
      />

      <div className="peca-form__cos">
        <div className="peca-form__camps">
          <div className="peca-form__parell">
            <label className="formulari__etiqueta" htmlFor="peca-tipus">Tipus de peça</label>
            <Desplegable
              id="peca-tipus"
              valor={dades.tipusId}
              opcions={opcionsTipus}
              placeholder="Escollir tipus"
              disabled={tipusFix}
              // En canviar de tipus, els valors dels atributs de l'altre tipus ja no serveixen
              onCanvi={(t) => canvia({ tipusId: t, valors: {} })}
            />
          </div>

          {dades.tipusId !== "" && atributs === null && <p className="formulari__nota">Carregant els atributs…</p>}

          {atributs?.map((a) => (
            <div key={a.id} className="peca-form__parell">
              <label className="formulari__etiqueta" htmlFor={`peca-atribut-${a.id}`}>{a.nom}</label>
              {a.tipus === "color" ? (
                <Desplegable
                  id={`peca-atribut-${a.id}`}
                  valor={dades.valors[a.id] ?? ""}
                  opcions={opcionsColor}
                  placeholder={colors.length === 0 ? "No hi ha colors" : "Color"}
                  disabled={colors.length === 0}
                  onCanvi={(v) => canvia({ valors: { ...dades.valors, [a.id]: v } })}
                />
              ) : (
                <input
                  id={`peca-atribut-${a.id}`}
                  className="formulari__input formulari__input--centrat"
                  type="text"
                  inputMode={a.tipus === "integer" ? "numeric" : undefined}
                  autoComplete="off"
                  placeholder="Escriu aquí…"
                  maxLength={VALOR_MAX}
                  value={dades.valors[a.id] ?? ""}
                  onChange={(e) => {
                    // Als atributs de número només es poden escriure enters (com als perfils)
                    const v = a.tipus === "integer" ? filtraEnter(e.target.value, true) : e.target.value;
                    canvia({ valors: { ...dades.valors, [a.id]: v } });
                  }}
                />
              )}
            </div>
          ))}

          <div className="peca-form__descripcio">
            <label className="formulari__etiqueta" htmlFor="peca-descripcio">Descripció:</label>
            <textarea
              id="peca-descripcio"
              className="formulari__textarea"
              placeholder="Escriu aquí les especificacions que vulguis…"
              maxLength={DESCRIPCIO_MAX}
              value={dades.descripcio}
              onChange={(e) => canvia({ descripcio: e.target.value })}
            />
          </div>
        </div>

        <div className="peca-form__lateral">
          {/* Tot el requadre obre la finestra per triar d'on ve la imatge */}
          <button
            type="button"
            className="peca-form__imatge"
            disabled={comprimint}
            onClick={triador.obre}
          >
            {comprimint ? (
              <span>Preparant la imatge…</span>
            ) : imatgeVisible ? (
              <img className="peca-form__previsualitzacio" src={imatgeVisible} alt="Foto de la peça" />
            ) : (
              <>
                <svg className="peca-form__icona" viewBox="0 0 80 64" focusable="false" aria-hidden="true">
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
            <button
              type="button"
              className="peca-form__treu"
              onClick={() => canvia({ imatge: imatgeActual ? "treu" : null })}
            >
              Treure la imatge
            </button>
          )}

          {missatge && <p className="formulari__error" role="alert">{missatge}</p>}

          <button type="submit" className="formulari__confirma peca-form__guardar" disabled={enviant || comprimint}>
            {enviant ? "Un moment…" : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}
