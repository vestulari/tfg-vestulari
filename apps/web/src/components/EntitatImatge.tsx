// Imatge d'una entitat. De moment només mostra la inicial del nom.

import "./EntitatImatge.css";

type Props = { nom: string; mida?: "petita" | "gran" };

// La mida petita és per a les llistes, i la gran per al detall
export default function EntitatImatge({ nom, mida = "petita" }: Props) {
  return (
    <span className={`entitat-imatge entitat-imatge--${mida}`} aria-hidden="true">
      {nom.charAt(0).toUpperCase()}
    </span>
  );
}