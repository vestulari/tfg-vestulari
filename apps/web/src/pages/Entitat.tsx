// Ruta pare de tot el que hi ha dins d'una entitat (/entitat/:id i les seves subpàgines).
// Carrega l'entitat i la deixa al context, perquè les pantalles de dins no l'hagin de tornar a demanar.

import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import type { EntitatDetallDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import { EntitatContext } from "../context/EntitatContext";
import "./EntradaEntitat.css";

// Estats de la pantalla mentre es carrega l'entitat
type Estat =
  | { tipus: "carregant" }
  | { tipus: "no_disponible" }
  | { tipus: "error" }
  | { tipus: "ok"; entitat: EntitatDetallDto };

// Si l'entitat no existeix o l'usuari no n'és membre, ho diu i deixa tornar a l'inici
export default function Entitat() {
  const { id } = useParams();
  const idNum = Number(id);
  const [estat, setEstat] = useState<Estat>({ tipus: "carregant" });

  useEffect(() => {
    if (!Number.isInteger(idNum) || idNum <= 0) {
      setEstat({ tipus: "no_disponible" });
      return;
    }

    let cancelat = false;
    setEstat({ tipus: "carregant" });
    entitatApi
      .detall(idNum)
      .then((entitat) => {
        if (!cancelat) setEstat({ tipus: "ok", entitat });
      })
      .catch((e) => {
        if (cancelat) return;
        setEstat(
          e instanceof ApiError && e.status === 404 ? { tipus: "no_disponible" } : { tipus: "error" }
        );
      });

    return () => {
      cancelat = true;
    };
  }, [idNum]);

  if (estat.tipus === "ok") {
    return (
      <EntitatContext.Provider
        value={{ entitat: estat.entitat, actualitza: (entitat) => setEstat({ tipus: "ok", entitat }) }}
      >
        <Outlet />
      </EntitatContext.Provider>
    );
  }

  return (
    <div className="entitat">
      <Capcalera titol="Entitat" mostraInvitacions={false} />

      <div className="entitat__barra">
        <BotoEnrere to="/inici" />
      </div>

      <main>
        {estat.tipus === "carregant" && <p className="entitat__missatge">Carregant…</p>}
        {estat.tipus === "no_disponible" && (
          <p className="entitat__missatge">Aquesta entitat no existeix o no hi tens accés.</p>
        )}
        {estat.tipus === "error" && (
          <p className="entitat__missatge" role="alert">
            No s'ha pogut carregar l'entitat.
          </p>
        )}
      </main>
    </div>
  );
}
