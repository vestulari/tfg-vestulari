// Finestra amb el llistat dels tipus de peça que ja existeixen, per triar-ne un (i crear-ne un de nou a partir d'aquest).

import { useEffect, useId, useRef } from "react";
import type { TipusPecaResumDto } from "@tfg-vestulari/shared";
import "./Confirmacio.css";
import "./LlistatTipusPeca.css";

type Props = {
  obert: boolean;
  tipus: TipusPecaResumDto[];
  onTria: (id: number) => void;
  onCancela: () => void;
};

// Com Confirmacio, fa servir el <dialog> del navegador: mentre és obert no es pot tocar res més,
// i amb Escape es tanca.
export default function LlistatTipusPeca({ obert, tipus, onTria, onCancela }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

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
      aria-labelledby={`${id}-titol`}
      onCancel={(e) => {
        e.preventDefault();
        onCancela();
      }}
    >
      <h2 id={`${id}-titol`} className="confirmacio__titol">A partir de quin tipus?</h2>
      <p className="confirmacio__missatge">
        El tipus nou començarà amb els mateixos atributs. Després els podràs canviar.
      </p>

      <ul className="llistat-tipus__llista">
        {tipus.map((t) => (
          <li key={t.id}>
            <button type="button" className="llistat-tipus__opcio" onClick={() => onTria(t.id)}>
              {t.nom}
            </button>
          </li>
        ))}
      </ul>

      <div className="confirmacio__accions">
        <button type="button" className="confirmacio__boto confirmacio__boto--cancela" onClick={onCancela}>
          Cancel·lar
        </button>
      </div>
    </dialog>
  );
}
