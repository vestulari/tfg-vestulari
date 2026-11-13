// Finestra per confirmar una acció abans de fer-la ("Estàs segur que…?").

import { useEffect, useRef, type ReactNode } from "react";
import "./Confirmacio.css";

type Props = {
  obert: boolean;
  titol: string;
  missatge: ReactNode;
  textAccepta: string;
  // Les accions que no es poden desfer surten amb el botó vermell
  perillosa?: boolean;
  enviant?: boolean;
  error?: string | null;
  onAccepta: () => void;
  onCancela: () => void;
};

// Fa servir el <dialog> del navegador: mentre és obert, no es pot tocar res més de la pantalla,
// i amb Escape es tanca. Mentre s'està fent l'acció no es pot cancel·lar.
export default function Confirmacio({
  obert,
  titol,
  missatge,
  textAccepta,
  perillosa = false,
  enviant = false,
  error = null,
  onAccepta,
  onCancela,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (obert && !d.open) d.showModal();
    if (!obert && d.open) d.close();
  }, [obert]);

  return (
    <dialog
      ref={ref}
      className="confirmacio"
      aria-labelledby="confirmacio-titol"
      aria-describedby="confirmacio-missatge"
      onCancel={(e) => {
        e.preventDefault();
        if (!enviant) onCancela();
      }}
    >
      <h2 id="confirmacio-titol" className="confirmacio__titol">{titol}</h2>
      <div id="confirmacio-missatge" className="confirmacio__missatge">{missatge}</div>

      {error && <p className="formulari__error" role="alert">{error}</p>}

      <div className="confirmacio__accions">
        <button
          type="button"
          className="confirmacio__boto confirmacio__boto--cancela"
          onClick={onCancela}
          disabled={enviant}
          autoFocus
        >
          Cancel·lar
        </button>
        <button
          type="button"
          className={`confirmacio__boto ${perillosa ? "confirmacio__boto--perill" : "confirmacio__boto--accepta"}`}
          onClick={onAccepta}
          disabled={enviant}
        >
          {enviant ? "Un moment…" : textAccepta}
        </button>
      </div>
    </dialog>
  );
}
