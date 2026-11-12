// Llista dels requisits de la contrasenya, marcant els que ja es compleixen.

import { requisitsContrasenya } from "../lib/contrasenya";
import "./RequisitsContrasenya.css";

type Props = { contrasenya: string };

// Marca cada requisit com a complert o no. Els lectors de pantalla també ho diuen.
export default function RequisitsContrasenya({ contrasenya }: Props) {
  return (
    <ul className="requisits">
      {requisitsContrasenya(contrasenya).map((r) => (
        <li
          key={r.text}
          className={`requisits__item${r.complert ? " requisits__item--ok" : ""}`}
        >
          <span className="requisits__sr">{r.complert ? "Complert: " : "Pendent: "}</span>
          {r.text}
        </li>
      ))}
    </ul>
  );
}