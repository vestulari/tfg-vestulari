import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import "./Desplegable.css";

export type OpcioDesplegable<T extends string> = { valor: T; etiqueta: string };

type Props<T extends string> = {
  /** Identificador del botó: perquè un <label htmlFor> el pugui etiquetar. */
  id: string;
  valor: T | "";
  opcions: OpcioDesplegable<T>[];
  onCanvi: (valor: T) => void;
  /** Text mentre encara no hi ha cap valor triat. */
  placeholder?: string;
  className?: string;
};

export default function Desplegable<T extends string>({
  id,
  valor,
  opcions,
  onCanvi,
  placeholder = "Escull…",
  className = "",
}: Props<T>) {
  const [obert, setObert] = useState(false);
  const [actiu, setActiu] = useState(0);
  const arrelRef = useRef<HTMLDivElement>(null);
  const llistaId = useId();

  const indexTriat = opcions.findIndex((o) => o.valor === valor);
  const etiquetaTriada = indexTriat >= 0 ? opcions[indexTriat].etiqueta : "";

  // Es tanca en clicar fora
  useEffect(() => {
    if (!obert) return;
    const fora = (e: MouseEvent) => {
      if (!arrelRef.current?.contains(e.target as Node)) setObert(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [obert]);

  function obre() {
    setActiu(indexTriat >= 0 ? indexTriat : 0);
    setObert(true);
  }

  function tria(i: number) {
    onCanvi(opcions[i].valor);
    setObert(false);
  }

  function onTecla(e: KeyboardEvent<HTMLButtonElement>) {
    if (!obert) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        obre();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiu((i) => (i + 1) % opcions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiu((i) => (i - 1 + opcions.length) % opcions.length);
        break;
      case "Home":
        e.preventDefault();
        setActiu(0);
        break;
      case "End":
        e.preventDefault();
        setActiu(opcions.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        tria(actiu);
        break;
      case "Escape":
        e.preventDefault();
        setObert(false);
        break;
      case "Tab":
        setObert(false);
        break;
    }
  }

  return (
    <div
      ref={arrelRef}
      className={`desplegable${obert ? " desplegable--obert" : ""} ${className}`.trim()}
    >
      <div className="desplegable__targeta">
        <button
          id={id}
          type="button"
          role="combobox"
          className="desplegable__boto"
          aria-haspopup="listbox"
          aria-expanded={obert}
          aria-controls={obert ? llistaId : undefined}
          aria-activedescendant={obert ? `${llistaId}-${actiu}` : undefined}
          onClick={() => (obert ? setObert(false) : obre())}
          onKeyDown={onTecla}
        >
          <span
            className={`desplegable__valor${etiquetaTriada ? "" : " desplegable__valor--buit"}`}
          >
            {etiquetaTriada || placeholder}
          </span>
          <svg className="desplegable__fletxa" viewBox="0 0 20 12" aria-hidden="true" focusable="false">
            <polyline
              points="2,2 10,10 18,2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {obert && (
          <ul id={llistaId} role="listbox" className="desplegable__llista">
            {opcions.map((o, i) => (
              <li
                key={o.valor}
                id={`${llistaId}-${i}`}
                role="option"
                aria-selected={o.valor === valor}
                className={`desplegable__opcio${i === actiu ? " desplegable__opcio--activa" : ""}`}
                // Perquè el focus es quedi al botó en clicar una opció
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiu(i)}
                onClick={() => tria(i)}
              >
                {o.etiqueta}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}