// Detall d'un tipus de peça: el nom i els seus atributs, amb el tipus de cadascun.
// Tothom el pot mirar. Els administradors el poden editar o eliminar (si cap peça és d'aquest tipus).

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TIPUS_ATRIBUT_PECA, type TipusPecaDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import { useActualitzaCatalegs, useTipusPeca } from "../context/CatalegsContext";
import { useEntitat } from "../context/EntitatContext";
import "./TipusPecaDetall.css";

type Estat =
  | { tipus: "carregant" }
  | { tipus: "no_disponible" }
  | { tipus: "error" }
  | { tipus: "ok"; tipusPeca: TipusPecaDto };

// El text que es mostra per a cada tipus d'atribut (Text, Número o Color)
const etiqueta = (tipus: string) => TIPUS_ATRIBUT_PECA.find((t) => t.valor === tipus)?.etiqueta ?? tipus;

// Eliminar es confirma abans. Si hi ha peces d'aquest tipus, l'API no ho deixa fer i se'n mostra el motiu.
// El tipus surt dels catàlegs de l'entitat (que ja porten els atributs), així que no cal cap crida.
export default function TipusPecaDetall() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const { tipusId } = useParams();
  const id = Number(tipusId);
  const esAdmin = entitat.perfil.esAdministrador;

  const cataleg = useTipusPeca();
  const { treuTipus } = useActualitzaCatalegs();
  const [eliminant, setEliminant] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const trobat = cataleg.dades?.find((t) => t.id === id);
  const estat: Estat = cataleg.error
    ? { tipus: "error" }
    : !cataleg.dades
      ? { tipus: "carregant" }
      : trobat
        ? { tipus: "ok", tipusPeca: trobat }
        : { tipus: "no_disponible" };

  const llista = `/entitat/${entitat.id}/vestuari/tipus`;

  // Elimina el tipus i torna a la llista
  async function elimina() {
    setEnviant(true);
    setErrorEliminar(null);
    try {
      await vestuariApi.eliminaTipus(entitat.id, id);
      treuTipus(id);
      navega(llista, { replace: true });
    } catch (e) {
      setErrorEliminar(e instanceof ApiError ? e.message : "No s'ha pogut eliminar el tipus de peça.");
      setEnviant(false);
    }
  }

  return (
    <div className="tipus-detall">
      <Capcalera entitat={entitat} seccio="Tipus de peça" mostraInvitacions={false} />

      <main className="tipus-detall__targeta">
        <div className="tipus-detall__cap">
          <BotoEnrere to={llista} />
          {estat.tipus === "ok" && <h1 className="tipus-detall__nom">{estat.tipusPeca.nom}</h1>}
        </div>

        {estat.tipus === "carregant" && <p className="tipus-detall__missatge">Carregant…</p>}
        {estat.tipus === "no_disponible" && (
          <p className="tipus-detall__missatge">Aquest tipus de peça no existeix.</p>
        )}
        {estat.tipus === "error" && (
          <p className="tipus-detall__missatge" role="alert">No s'ha pogut carregar el tipus de peça.</p>
        )}

        {estat.tipus === "ok" && (
          <>
            {estat.tipusPeca.atributs.length === 0 ? (
              <p className="tipus-detall__missatge">Aquest tipus de peça encara no té cap atribut.</p>
            ) : (
              <dl className="tipus-detall__camps">
                {estat.tipusPeca.atributs.map((a) => (
                  <div key={a.id} className="tipus-detall__camp">
                    <dt>{a.nom}</dt>
                    <dd>{etiqueta(a.tipus)}</dd>
                  </div>
                ))}
              </dl>
            )}

            {esAdmin && (
              <div className="tipus-detall__accions">
                <Link className="tipus-detall__boto" to={`${llista}/${id}/editar`}>
                  Editar tipus de peça
                </Link>
                <button
                  type="button"
                  className="tipus-detall__boto tipus-detall__boto--perill"
                  onClick={() => {
                    setErrorEliminar(null);
                    setEliminant(true);
                  }}
                >
                  Eliminar tipus de peça
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Confirmacio
        obert={eliminant}
        titol={`Vols eliminar «${estat.tipus === "ok" ? estat.tipusPeca.nom : ""}»?`}
        missatge="S'eliminarà aquest tipus de peça i tots els seus atributs. Aquesta acció no es pot desfer."
        textAccepta="Eliminar"
        perillosa
        enviant={enviant}
        error={errorEliminar}
        onAccepta={() => void elimina()}
        onCancela={() => setEliminant(false)}
      />
    </div>
  );
}
