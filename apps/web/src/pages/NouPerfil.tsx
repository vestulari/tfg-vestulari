// Inserir un intèrpret nou a l'entitat (només administradors).
// És el mateix formulari que el del creador, però aquí ser administrador no és obligatori.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../adapters/api/ApiClient";
import { perfilApi } from "../adapters/api/PerfilApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PerfilForm from "../components/PerfilForm";
import { usePlantilla } from "../context/CatalegsContext";
import { useEntitat } from "../context/EntitatContext";
import { dadesDEsborrany, esborranyBuit, filesDePlantilla } from "../lib/perfils";
import "../components/Formulari.css";

// La plantilla (els atributs del formulari) surt dels catàlegs de l'entitat.
// En crear el perfil, va al seu detall amb el perfil que retorna l'API, i no l'ha de tornar a demanar.
export default function NouPerfil() {
  const entitat = useEntitat();
  const navigate = useNavigate();
  const { dades: atributs, error: errorCarrega } = usePlantilla();
  const [perfil, setPerfil] = useState(esborranyBuit);
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Crea el perfil i va al seu detall
  async function confirma() {
    if (!atributs) return;
    setEnviant(true);
    setErrorServidor(null);
    try {
      const creat = await perfilApi.crea(entitat.id, dadesDEsborrany(perfil, atributs));
      navigate(`/entitat/${entitat.id}/perfils/${creat.id}`, { replace: true, state: { perfil: creat } });
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'ha pogut crear el perfil.");
      setEnviant(false);
    }
  }

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} seccio="Nou intèrpret" mostraInvitacions={false} />

      <div className="pantalla__barra">
        <BotoEnrere to={`/entitat/${entitat.id}/interprets`} />
      </div>

      <main className="pantalla__contingut">
        {errorCarrega && <p role="alert">No s'ha pogut carregar la plantilla de perfil.</p>}
        {!errorCarrega && atributs === null && <p>Carregant…</p>}
        {atributs && (
          <PerfilForm
            atributs={filesDePlantilla(atributs)}
            perfil={perfil}
            onCanvi={setPerfil}
            onConfirma={confirma}
            enviant={enviant}
            errorServidor={errorServidor}
            textBoto="Inserir"
          />
        )}
      </main>
    </div>
  );
}
