import { requisitsContrasenya } from "../lib/contrasenya";
import "./RequisitsContrasenya.css";

type Props = { contrasenya: string };

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