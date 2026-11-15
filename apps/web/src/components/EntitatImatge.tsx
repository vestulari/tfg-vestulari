// Imatge d'una entitat. Si no en té (o no es pot carregar), mostra la inicial del nom.

import { useState } from "react";
import "./EntitatImatge.css";

type Props = {
  nom: string;
  url?: string | null;
  mida?: "petita" | "gran";
  // Per posar-hi una altra mida des de fora (com les targetes de l'inici). Substitueix la de mida.
  className?: string;
};

// La mida petita és per a les llistes, i la gran per al detall.
// La URL és temporal: si ha caducat i no carrega, es torna a veure la inicial.
export default function EntitatImatge({ nom, url, mida = "petita", className }: Props) {
  const [urlFallida, setUrlFallida] = useState<string | null>(null);
  const mostraImatge = url && url !== urlFallida;

  return (
    <span className={`entitat-imatge ${className ?? `entitat-imatge--${mida}`}`} aria-hidden="true">
      {mostraImatge ? (
        <img src={url} alt="" onError={() => setUrlFallida(url)} />
      ) : (
        nom.charAt(0).toUpperCase()
      )}
    </span>
  );
}
