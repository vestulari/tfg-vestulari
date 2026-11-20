// Finestra per triar d'on es vol afegir una imatge: des de la galeria o des de la càmera.
// Es fa servir amb el hook useTriaImatge, que dona la funció obre() i els elements que s'han de pintar.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IMATGE_TIPUS } from "@tfg-vestulari/shared";
import FotoCamera from "./FotoCamera";
import "./Confirmacio.css";
import "./TriaImatge.css";

type Opcions = {
  // La frontal per a la foto de l'usuari, i la posterior per a l'entitat i el vestuari
  camera: "frontal" | "posterior";
  // Rep la imatge triada o la foto feta: la pantalla la comprimeix com sempre
  onImatge: (fitxer: File) => void;
};

// Diu si el dispositiu té pantalla tàctil (el mòbil o la tauleta)
const esTactil = () => window.matchMedia("(pointer: coarse)").matches;

// Mira si hi ha alguna càmera que es pugui fer servir. Al mòbil sempre n'hi ha (la càmera nativa).
// A l'ordinador cal que el navegador tingui accés a la webcam i que n'hi hagi alguna connectada.
async function hiHaCamera(): Promise<boolean> {
  if (esTactil()) return true;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const dispositius = await navigator.mediaDevices.enumerateDevices();
    return dispositius.some((d) => d.kind === "videoinput");
  } catch {
    return true;
  }
}

// Retorna obre(), per cridar-la quan l'usuari vol afegir una imatge, i elements, que s'ha de posar
// a la pantalla. Si no hi ha cap càmera, obre() va directament a la galeria, sense preguntar.
// Al mòbil, la càmera és la nativa. A l'ordinador, és la finestra de la webcam (FotoCamera).
export function useTriaImatge({ camera, onImatge }: Opcions): { obre: () => void; elements: ReactNode } {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const capturaRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [ambCamera, setAmbCamera] = useState(false);
  const [triant, setTriant] = useState(false);
  const [webcam, setWebcam] = useState(false);

  useEffect(() => {
    let cancelat = false;
    void hiHaCamera().then((hi) => {
      if (!cancelat) setAmbCamera(hi);
    });
    return () => {
      cancelat = true;
    };
  }, []);

  // Obre i tanca el <dialog> de triar
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (triant && !d.open) d.showModal();
    if (!triant && d.open) d.close();
  }, [triant]);

  // Si hi ha càmera, pregunta d'on es vol la imatge. Si no, obre la galeria directament.
  function obre() {
    if (ambCamera) setTriant(true);
    else galeriaRef.current?.click();
  }

  // Obre el selector de fitxers
  function desDeGaleria() {
    setTriant(false);
    galeriaRef.current?.click();
  }

  // Obre la càmera: la nativa al mòbil, o la finestra de la webcam a l'ordinador
  function desDeCamera() {
    setTriant(false);
    if (esTactil()) capturaRef.current?.click();
    else setWebcam(true);
  }

  // Passa el fitxer triat a la pantalla i buida l'input, perquè es pugui tornar a triar el mateix
  function rep(input: HTMLInputElement) {
    const fitxer = input.files?.[0];
    if (fitxer) onImatge(fitxer);
    input.value = "";
  }

  const elements = (
    <>
      <input
        ref={galeriaRef}
        className="tria-imatge__fitxer"
        type="file"
        accept={IMATGE_TIPUS.join(",")}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => rep(e.target)}
      />
      <input
        ref={capturaRef}
        className="tria-imatge__fitxer"
        type="file"
        accept="image/*"
        capture={camera === "frontal" ? "user" : "environment"}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => rep(e.target)}
      />

      <dialog
        ref={dialogRef}
        className="confirmacio tria-imatge"
        aria-labelledby={`${id}-titol`}
        onCancel={(e) => {
          e.preventDefault();
          setTriant(false);
        }}
      >
        <h2 id={`${id}-titol`} className="confirmacio__titol">D'on vols afegir la imatge?</h2>

        <div className="tria-imatge__opcions">
          <button type="button" className="tria-imatge__opcio" onClick={desDeGaleria} autoFocus>
            <IconaGaleria />
            Des de la galeria
          </button>
          <button type="button" className="tria-imatge__opcio" onClick={desDeCamera}>
            <IconaCamera />
            Des de la càmera
          </button>
        </div>

        <div className="confirmacio__accions">
          <button
            type="button"
            className="confirmacio__boto confirmacio__boto--cancela"
            onClick={() => setTriant(false)}
          >
            Cancel·lar
          </button>
        </div>
      </dialog>

      <FotoCamera obert={webcam} camera={camera} onFoto={onImatge} onTanca={() => setWebcam(false)} />
    </>
  );

  return { obre, elements };
}

// Una foto amb una muntanya, per a la galeria
function IconaGaleria() {
  return (
    <svg className="tria-imatge__icona" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <polyline points="3,16 9,10 13,14 16,11 21,16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="16" cy="8" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

// Una càmera de fotos
function IconaCamera() {
  return (
    <svg className="tria-imatge__icona" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 7h3l1.6-2.4h6.8L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
