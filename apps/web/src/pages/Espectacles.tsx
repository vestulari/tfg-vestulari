// Llista dels espectacles de l'entitat, amb el cercador. De cada espectacle se'n veu el nom i l'any d'estrena.
// Clicant-ne un se'n veu el detall. Els administradors en poden crear de nous.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EspectacleResumDto } from "@tfg-vestulari/shared";
import { espectacleApi } from "../adapters/api/EspectacleApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Cercador from "../components/Cercador";
import { useEntitat } from "../context/EntitatContext";
import { coincideix } from "../lib/cerca";
import "./Vestuari.css";
import "./Espectacles.css";

// Fa servir l'estructura de la pantalla del vestuari (barra, contingut i peu amb el botó groc)
export default function Espectacles() {
  const entitat = useEntitat();
  const [espectacles, setEspectacles] = useState<EspectacleResumDto[] | null>(null);
  const [error, setError] = useState(false);
  const [cerca, setCerca] = useState("");

  useEffect(() => {
    let cancelat = false;
    espectacleApi
      .llista(entitat.id)
      .then((e) => {
        if (!cancelat) setEspectacles(e);
      })
      .catch((e) => {
        console.error("Error carregant els espectacles", e);
        if (!cancelat) setError(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id]);

  const base = `/entitat/${entitat.id}`;
  const visibles = (espectacles ?? []).filter((e) => coincideix(e.nom, cerca));

  return (
    <div className="vestuari">
      <Capcalera entitat={entitat} seccio="Espectacles" mostraInvitacions={false} />

      <div className="vestuari__barra">
        <BotoEnrere to={base} />
        <Cercador valor={cerca} onCanvi={setCerca} placeholder="Cerca per espectacle…" />
      </div>

      <main className="vestuari__contingut espectacles__contingut">
        {error && (
          <p className="vestuari__missatge" role="alert">
            No s'han pogut carregar els espectacles.
          </p>
        )}
        {!error && espectacles === null && <p className="vestuari__missatge">Carregant…</p>}
        {espectacles && espectacles.length === 0 && (
          <p className="vestuari__missatge">Encara no hi ha cap espectacle.</p>
        )}
        {espectacles && espectacles.length > 0 && visibles.length === 0 && (
          <p className="vestuari__missatge">Cap espectacle coincideix amb la cerca.</p>
        )}

        {visibles.length > 0 && (
          <ul className="espectacles__llista">
            {visibles.map((e) => (
              <li key={e.id}>
                <Link className="espectacles__fila" to={`${base}/espectacles/${e.id}`}>
                  <span className="espectacles__nom">{e.nom}</span>
                  <span className="espectacles__any">Estrenat l'any {e.anyEstrena}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      {entitat.perfil.esAdministrador && (
        <div className="vestuari__peu">
          <Link className="vestuari__boto" to={`${base}/espectacles/nou`}>
            <span className="vestuari__mes" aria-hidden="true">+</span>
            Crear nou espectacle
          </Link>
        </div>
      )}
    </div>
  );
}
