// Editar un perfil de l'entitat (només administradors): el formulari amb les dades ja omplertes.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PerfilDetallDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { perfilApi } from "../adapters/api/PerfilApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PerfilForm from "../components/PerfilForm";
import { usePlantilla } from "../context/CatalegsContext";
import type { PerfilEsborrany } from "../context/CreacioEntitatContext";
import { useActualitzaEntitat, useEntitat } from "../context/EntitatContext";
import { useDadaPassada } from "../lib/navegacio";
import { dadesDEsborrany, esborranyDePerfil, filesDePlantilla } from "../lib/perfils";
import "../components/Formulari.css";

// El perfil el passa la pantalla de detall (si s'hi arriba d'una altra manera, es demana a l'API),
// i la plantilla surt dels catàlegs de l'entitat. En desar, es torna al detall amb el perfil que retorna l'API.
// Al perfil del creador no se li pot treure el rol d'administrador.
// Si l'administrador edita el seu propi perfil, també s'actualitza l'entitat del context
// (per si s'ha canviat el nom o els permisos).
export default function EditaPerfil() {
  const entitat = useEntitat();
  const actualitzaEntitat = useActualitzaEntitat();
  const navigate = useNavigate();
  const { perfilId } = useParams();
  const idPerfil = Number(perfilId);
  const passat = useDadaPassada<PerfilDetallDto>("perfil", idPerfil);
  const plantilla = usePlantilla();

  const [original, setOriginal] = useState<PerfilDetallDto | null>(passat);
  const [errorCarrega, setErrorCarrega] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilEsborrany | null>(passat && esborranyDePerfil(passat));
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Només es demana el perfil si la pantalla anterior no l'ha passat
  useEffect(() => {
    if (passat) return;
    let cancelat = false;
    perfilApi
      .detall(entitat.id, idPerfil)
      .then((p) => {
        if (cancelat) return;
        setOriginal(p);
        setPerfil(esborranyDePerfil(p));
      })
      .catch((e) => {
        if (cancelat) return;
        setErrorCarrega(
          e instanceof ApiError && e.status === 404
            ? "Aquest perfil no existeix."
            : "No s'ha pogut carregar el perfil."
        );
      });
    return () => {
      cancelat = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitat.id, idPerfil]);

  const detall = `/entitat/${entitat.id}/perfils/${idPerfil}`;
  const atributs = plantilla.dades;

  // Desa els canvis i torna al detall del perfil, passant-li el perfil desat
  async function confirma() {
    if (!original || !perfil || !atributs) return;
    setEnviant(true);
    setErrorServidor(null);
    try {
      const desat = await perfilApi.edita(entitat.id, idPerfil, dadesDEsborrany(perfil, atributs));
      if (original.esMeu) {
        actualitzaEntitat({
          ...entitat,
          perfil: {
            ...entitat.perfil,
            nom: desat.nom,
            esAdministrador: desat.esAdministrador,
            esInterpret: desat.esInterpret,
          },
        });
      }
      navigate(detall, { replace: true, state: { perfil: desat } });
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'han pogut desar els canvis.");
      setEnviant(false);
    }
  }

  const error = errorCarrega ?? (plantilla.error ? "No s'ha pogut carregar la plantilla de perfil." : null);

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} seccio="Editar intèrpret" mostraInvitacions={false} />

      <div className="pantalla__barra">
        {/* Si es torna enrere sense desar, el detall ja té el perfil (el mateix que s'ha passat aquí) */}
        <BotoEnrere to={detall} state={original ? { perfil: original } : undefined} />
      </div>

      <main className="pantalla__contingut">
        {error && <p role="alert">{error}</p>}
        {!error && (!original || !atributs) && <p>Carregant…</p>}
        {original && perfil && atributs && (
          <PerfilForm
            atributs={filesDePlantilla(atributs)}
            perfil={perfil}
            onCanvi={setPerfil}
            onConfirma={confirma}
            adminObligatori={original.esCreador}
            notaAdmin={
              original.esMeu
                ? "Com a creador de l'entitat, sempre ets administrador."
                : "És el perfil del creador de l'entitat, i sempre és administrador."
            }
            enviant={enviant}
            errorServidor={errorServidor}
            textBoto="Desar canvis"
          />
        )}
      </main>
    </div>
  );
}
