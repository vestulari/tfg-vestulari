import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { InvitacioDetallDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { invitacioApi } from "../adapters/api/InvitacioAPI";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import EntitatImatge from "../components/EntitatImatge";
import "./InvitacioDetall.css";

type Estat =
  | { tipus: "carregant" }
  | { tipus: "no_disponible" }
  | { tipus: "error" }
  | { tipus: "ok"; invitacio: InvitacioDetallDto };

export default function InvitacioDetall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const idNum = Number(id);

  const [estat, setEstat] = useState<Estat>({ tipus: "carregant" });
  const [enviant, setEnviant] = useState(false);
  const [errorAccio, setErrorAccio] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(idNum) || idNum <= 0) {
      setEstat({ tipus: "no_disponible" });
      return;
    }

    let cancelat = false;
    // En obrir-la, l'API la marca com a oberta
    invitacioApi
      .obre(idNum)
      .then((invitacio) => {
        if (!cancelat) setEstat({ tipus: "ok", invitacio });
      })
      .catch((e) => {
        if (cancelat) return;
        setEstat(
          e instanceof ApiError && e.status === 404
            ? { tipus: "no_disponible" }
            : { tipus: "error" }
        );
      });

    return () => {
      cancelat = true;
    };
  }, [idNum]);

  async function resol(accio: "accepta" | "rebutja") {
    setEnviant(true);
    setErrorAccio(null);
    try {
      if (accio === "accepta") {
        await invitacioApi.accepta(idNum);
        navigate("/inici");
      } else {
        await invitacioApi.rebutja(idNum);
        navigate("/invitacions");
      }
    } catch (e) {
      setErrorAccio(e instanceof ApiError ? e.message : "No s'ha pogut completar l'acció.");
      setEnviant(false);
    }
  }

  return (
    <div className="invitacio">
      <Capcalera titol="Invitacions" mostraUsuari={false} />

      <main className="invitacio__targeta">
        <div className="invitacio__enrere">
          <BotoEnrere to="/invitacions" />
        </div>

        {estat.tipus === "carregant" && <p className="invitacio__missatge">Carregant…</p>}

        {estat.tipus === "no_disponible" && (
          <p className="invitacio__missatge">Aquesta invitació ja no està disponible.</p>
        )}

        {estat.tipus === "error" && (
          <p className="invitacio__missatge" role="alert">
            No s'ha pogut carregar la invitació.
          </p>
        )}

        {estat.tipus === "ok" && (
          <>
            <section className="invitacio__info">
              <h2 className="invitacio__nom">{estat.invitacio.entitatNom}</h2>
              <p className="invitacio__descripcio">
                {estat.invitacio.entitatDescripcio?.trim() ||
                  "Aquesta entitat encara no té descripció."}
              </p>
            </section>

            <section className="invitacio__accions">
              <EntitatImatge nom={estat.invitacio.entitatNom} mida="gran" />

              {errorAccio && (
                <p className="invitacio__error" role="alert">{errorAccio}</p>
              )}

              <button
                type="button"
                className="invitacio__boto invitacio__boto--accepta"
                disabled={enviant}
                onClick={() => resol("accepta")}
              >
                Acceptar
              </button>
              <button
                type="button"
                className="invitacio__boto invitacio__boto--rebutja"
                disabled={enviant}
                onClick={() => resol("rebutja")}
              >
                Rebutjar
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}