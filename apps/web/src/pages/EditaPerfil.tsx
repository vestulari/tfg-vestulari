// Editar un perfil de l'entitat (només administradors): el formulari amb les dades ja omplertes.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AtributDto, PerfilDetallDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import { perfilApi } from "../adapters/api/PerfilApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PerfilForm from "../components/PerfilForm";
import type { PerfilEsborrany } from "../context/CreacioEntitatContext";
import { useActualitzaEntitat, useEntitat } from "../context/EntitatContext";
import { dadesDEsborrany, esborranyDePerfil, filesDePlantilla } from "../lib/perfils";
import "../components/Formulari.css";

type Carregat = { original: PerfilDetallDto; atributs: AtributDto[] };

// Al perfil del creador no se li pot treure el rol d'administrador.
// Si l'administrador edita el seu propi perfil, també s'actualitza l'entitat del context
// (per si s'ha canviat el nom o els permisos).
export default function EditaPerfil() {
  const entitat = useEntitat();
  const actualitzaEntitat = useActualitzaEntitat();
  const navigate = useNavigate();
  const { perfilId } = useParams();
  const idPerfil = Number(perfilId);

  const [carregat, setCarregat] = useState<Carregat | null>(null);
  const [errorCarrega, setErrorCarrega] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilEsborrany | null>(null);
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  useEffect(() => {
    let cancelat = false;
    Promise.all([perfilApi.detall(entitat.id, idPerfil), entitatApi.plantilla(entitat.id)])
      .then(([original, atributs]) => {
        if (cancelat) return;
        setCarregat({ original, atributs });
        setPerfil(esborranyDePerfil(original));
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
  }, [entitat.id, idPerfil]);

  const detall = `/entitat/${entitat.id}/perfils/${idPerfil}`;

  // Desa els canvis i torna al detall del perfil
  async function confirma() {
    if (!carregat || !perfil) return;
    setEnviant(true);
    setErrorServidor(null);
    const dades = dadesDEsborrany(perfil, carregat.atributs);
    try {
      await perfilApi.edita(entitat.id, idPerfil, dades);
      if (carregat.original.esMeu) {
        actualitzaEntitat({
          ...entitat,
          perfil: {
            ...entitat.perfil,
            nom: dades.nom,
            esAdministrador: dades.esAdministrador,
            esInterpret: dades.esInterpret,
          },
        });
      }
      navigate(detall, { replace: true });
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'han pogut desar els canvis.");
      setEnviant(false);
    }
  }

  const esCreador = carregat?.original.esCreador ?? false;

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} seccio="Editar intèrpret" mostraInvitacions={false} />

      <div className="pantalla__barra">
        <BotoEnrere to={detall} />
      </div>

      <main className="pantalla__contingut">
        {errorCarrega && <p role="alert">{errorCarrega}</p>}
        {!errorCarrega && !carregat && <p>Carregant…</p>}
        {carregat && perfil && (
          <PerfilForm
            atributs={filesDePlantilla(carregat.atributs)}
            perfil={perfil}
            onCanvi={setPerfil}
            onConfirma={confirma}
            adminObligatori={esCreador}
            notaAdmin={
              carregat.original.esMeu
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
