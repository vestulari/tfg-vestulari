import { Link } from "react-router-dom";
import "./BotoEnrere.css";

type Props = { to: string; etiqueta?: string };

export default function BotoEnrere({ to, etiqueta = "Torna enrere" }: Props) {
  return (
    <Link className="boto-enrere" to={to} aria-label={etiqueta}>
      <svg viewBox="0 0 68 54" aria-hidden="true" focusable="false">
        <path d="M0 27 L27 0 V16 H68 V38 H27 V54 Z" fill="currentColor" />
      </svg>
    </Link>
  );
}