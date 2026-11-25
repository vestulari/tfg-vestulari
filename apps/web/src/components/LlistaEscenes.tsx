// Llista editable de les escenes d'un espectacle: canviar-ne el nom, afegir-ne, esborrar-ne i ordenar-les.
// Per ordenar-les, s'arrossega la icona ≡ (amb el ratolí o el dit), o es posa el focus a la icona i es
// fan servir les fletxes amunt i avall del teclat.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ESCENA_NOM_MAX, ESCENES_MAX } from "@tfg-vestulari/shared";
import Confirmacio from "./Confirmacio";
import "./Formulari.css";
import "./LlistaEscenes.css";

// Una escena del formulari. La clau només serveix per identificar-la a la pantalla;
// l'id és el de la base de dades, i només el tenen les escenes que ja estan guardades.
export type FilaEscena = { clau: number; id?: number; nom: string };

type Props = {
  escenes: FilaEscena[];
  onCanvi: (escenes: FilaEscena[]) => void;
};

// Retorna la llista amb l'escena de la posició de canviada a la posició a
function mou(escenes: FilaEscena[], de: number, a: number): FilaEscena[] {
  const nova = [...escenes];
  const [escena] = nova.splice(de, 1);
  nova.splice(a, 0, escena);
  return nova;
}

// Les escenes que ja estaven guardades demanen confirmació abans de treure-les (però no s'esborren
// fins que es guarda l'espectacle). Les noves es treuen directament.
export default function LlistaEscenes({ escenes, onCanvi }: Props) {
  const files = useRef(new Map<number, HTMLLIElement>());
  const nanses = useRef(new Map<number, HTMLButtonElement>());
  const noms = useRef(new Map<number, HTMLInputElement>());
  const [arrossegant, setArrossegant] = useState<number | null>(null);
  const [perTreure, setPerTreure] = useState<FilaEscena | null>(null);
  const [anunci, setAnunci] = useState("");
  // Després de moure o afegir una escena, on s'ha de posar el focus
  const [focus, setFocus] = useState<{ clau: number; on: "nansa" | "nom" } | null>(null);

  // Les escenes i onCanvi més recents, per als esdeveniments de la finestra mentre s'arrossega
  const actuals = useRef({ escenes, onCanvi });
  actuals.current = { escenes, onCanvi };

  // Mentre s'arrossega, s'escolta el punter a tota la finestra (així no es perd quan la fila canvia de lloc).
  // Si el punter passa de la meitat d'una altra escena, s'hi canvia de lloc.
  useEffect(() => {
    if (arrossegant === null) return;
    const mouPunter = (ev: globalThis.PointerEvent) => {
      const { escenes: llista, onCanvi: canvia } = actuals.current;
      const index = llista.findIndex((x) => x.clau === arrossegant);
      let a = index;
      llista.forEach((x, i) => {
        const fila = files.current.get(x.clau);
        if (!fila || i === index) return;
        const { top, height } = fila.getBoundingClientRect();
        const mig = top + height / 2;
        if (i < index && ev.clientY < mig && i < a) a = i;
        if (i > index && ev.clientY > mig && i > a) a = i;
      });
      if (a !== index) canvia(mou(llista, index, a));
    };
    const deixaAnar = () => {
      anuncia(actuals.current.escenes, arrossegant);
      setArrossegant(null);
    };
    window.addEventListener("pointermove", mouPunter);
    window.addEventListener("pointerup", deixaAnar);
    window.addEventListener("pointercancel", deixaAnar);
    return () => {
      window.removeEventListener("pointermove", mouPunter);
      window.removeEventListener("pointerup", deixaAnar);
      window.removeEventListener("pointercancel", deixaAnar);
    };
  }, [arrossegant]);

  useEffect(() => {
    if (!focus) return;
    (focus.on === "nansa" ? nanses : noms).current.get(focus.clau)?.focus();
    setFocus(null);
  }, [focus]);

  // Canvia el nom d'una escena
  function canviaNom(clau: number, nom: string) {
    onCanvi(escenes.map((e) => (e.clau === clau ? { ...e, nom } : e)));
  }

  // Afegeix una escena buida al final i hi posa el focus
  function afegeix() {
    const clau = Math.max(0, ...escenes.map((e) => e.clau)) + 1;
    onCanvi([...escenes, { clau, nom: "" }]);
    setFocus({ clau, on: "nom" });
  }

  // Treu una escena de la llista
  function treu(clau: number) {
    onCanvi(escenes.filter((e) => e.clau !== clau));
  }

  // Si l'escena ja estava guardada, primer pregunta; si és nova, la treu directament
  function demanaTreure(e: FilaEscena) {
    if (e.id === undefined) treu(e.clau);
    else setPerTreure(e);
  }

  // Diu en veu alta (per als lectors de pantalla) on ha quedat l'escena
  function anuncia(llista: FilaEscena[], clau: number) {
    const i = llista.findIndex((e) => e.clau === clau);
    setAnunci(`${llista[i].nom || "Escena sense nom"}, posició ${i + 1} de ${llista.length}`);
  }

  // Amb el focus a la icona ≡, les fletxes amunt i avall mouen l'escena
  function onTecla(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const a = e.key === "ArrowUp" ? index - 1 : e.key === "ArrowDown" ? index + 1 : null;
    if (a === null || a < 0 || a >= escenes.length) return;
    e.preventDefault();
    const nova = mou(escenes, index, a);
    onCanvi(nova);
    anuncia(nova, escenes[index].clau);
    setFocus({ clau: escenes[index].clau, on: "nansa" });
  }

  // Comença a arrossegar l'escena (només amb el botó principal del ratolí, o amb el dit)
  function comencaArrossegar(e: PointerEvent<HTMLButtonElement>, clau: number) {
    if (e.button !== 0) return;
    e.preventDefault(); // perquè no se seleccioni text mentre s'arrossega
    setArrossegant(clau);
  }

  return (
    <div className="escenes">
      {escenes.length === 0 && <p className="formulari__nota">Encara no hi ha cap escena.</p>}

      <ol className="escenes__llista">
        {escenes.map((e, i) => (
          <li
            key={e.clau}
            ref={(el) => {
              if (el) files.current.set(e.clau, el);
              else files.current.delete(e.clau);
            }}
            className={`escenes__fila${arrossegant === e.clau ? " escenes__fila--arrossegant" : ""}`}
          >
            <button
              type="button"
              className="escenes__nansa"
              ref={(el) => {
                if (el) nanses.current.set(e.clau, el);
                else nanses.current.delete(e.clau);
              }}
              aria-label={`Mou l'escena ${e.nom || i + 1}. Fes servir les fletxes amunt i avall.`}
              aria-roledescription="nansa per ordenar"
              onKeyDown={(ev) => onTecla(ev, i)}
              onPointerDown={(ev) => comencaArrossegar(ev, e.clau)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <input
              ref={(el) => {
                if (el) noms.current.set(e.clau, el);
                else noms.current.delete(e.clau);
              }}
              className="escenes__nom"
              type="text"
              autoComplete="off"
              placeholder="Nom de l'escena"
              aria-label={`Nom de l'escena ${i + 1}`}
              maxLength={ESCENA_NOM_MAX}
              value={e.nom}
              onChange={(ev) => canviaNom(e.clau, ev.target.value)}
            />

            <button
              type="button"
              className="escenes__paperera"
              aria-label={`Esborra l'escena ${e.nom || i + 1}`}
              onClick={() => demanaTreure(e)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ol>

      <button type="button" className="escenes__afegeix" onClick={afegeix} disabled={escenes.length >= ESCENES_MAX}>
        <span aria-hidden="true">+</span> Crear nova escena
      </button>

      <p className="escenes__anunci" role="status" aria-live="polite">{anunci}</p>

      <Confirmacio
        obert={perTreure !== null}
        titol={`Vols esborrar l'escena «${perTreure?.nom ?? ""}»?`}
        missatge="Quan guardis l'espectacle, s'esborrarà l'escena i tot el que tingui a les actuacions (on hi surt cada intèrpret i amb quin vestuari). No es podrà desfer."
        textAccepta="Esborrar l'escena"
        perillosa
        onAccepta={() => {
          if (perTreure) treu(perTreure.clau);
          setPerTreure(null);
        }}
        onCancela={() => setPerTreure(null)}
      />
    </div>
  );
}
