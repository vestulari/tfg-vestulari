import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EntitatResumDto } from "@tfg-vestulari/shared";
import { entitatApi } from "../adapters/api/EntitatApi";
import Capcalera from "../components/Capcalera";
import "./Inici.css";

export default function Inici() {
  const [entitats, setEntitats] = useState<EntitatResumDto[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    entitatApi.llistaMeves().then(setEntitats).catch(() => setError(true));
  }, []);

  return (
    <div className="inici">
      <Capcalera titol="Escull entitat…" />

      <main className="inici__contingut">
        {error && (
          <p className="inici__missatge" role="alert">
            No s'han pogut carregar les entitats.
          </p>
        )}
        {!error && entitats === null && <p className="inici__missatge">Carregant…</p>}
        {entitats && entitats.length === 0 && (
          <p className="inici__missatge">Encara no pertanys a cap entitat.</p>
        )}

        {entitats && entitats.length > 0 && (
          <ul className="inici__entitats">
            {entitats.map((e) => (
              <li key={e.id}>
                <Link className="entitat-card" to={`/entitat/${e.id}`}>
                  <span className="entitat-card__imatge" aria-hidden="true">
                    {e.nom.charAt(0).toUpperCase()}
                  </span>
                  <span className="entitat-card__nom">{e.nom}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="inici__peu">
        <Link className="inici__crea" to="/entitats/nova">
          <span className="inici__crea-icona" aria-hidden="true">+</span>
          Crea una nova entitat
        </Link>
      </footer>
    </div>
  );
}