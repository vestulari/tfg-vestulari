import "./EntitatImatge.css";

type Props = { nom: string; mida?: "petita" | "gran" };

export default function EntitatImatge({ nom, mida = "petita" }: Props) {
  return (
    <span className={`entitat-imatge entitat-imatge--${mida}`} aria-hidden="true">
      {nom.charAt(0).toUpperCase()}
    </span>
  );
}