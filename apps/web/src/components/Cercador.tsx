// Barra de cerca amb la lupa. La fan servir les invitacions i la llista d'intèrprets.

import "./Cercador.css";

type Props = {
  valor: string;
  onCanvi: (valor: string) => void;
  placeholder: string;
  // El que llegeixen els lectors de pantalla (si no, el placeholder)
  etiqueta?: string;
};

// Només mostra i avisa del text: el filtratge el fa la pantalla (amb coincideix, de lib/cerca)
export default function Cercador({ valor, onCanvi, placeholder, etiqueta }: Props) {
  return (
    <label className="cercador">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M15.5 15.5 L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        aria-label={etiqueta ?? placeholder}
        value={valor}
        onChange={(e) => onCanvi(e.target.value)}
      />
    </label>
  );
}
