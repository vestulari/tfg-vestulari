// Foto d'un usuari. Si no en té (o no es pot carregar), mostra la inicial del nom.

import { useState } from "react";
import "./UsuariAvatar.css";

type Props = {
  nom: string;
  url?: string | null;
  // La mida i els colors els posa qui el fa servir (la capçalera i el compte en tenen de diferents)
  className: string;
};

// La URL és temporal: si ha caducat i no carrega, es torna a veure la inicial
export default function UsuariAvatar({ nom, url, className }: Props) {
  const [urlFallida, setUrlFallida] = useState<string | null>(null);
  const mostraImatge = url && url !== urlFallida;

  return (
    <span className={`usuari-avatar ${className}`} aria-hidden="true">
      {mostraImatge ? (
        <img src={url} alt="" onError={() => setUrlFallida(url)} />
      ) : (
        nom.charAt(0).toUpperCase()
      )}
    </span>
  );
}
