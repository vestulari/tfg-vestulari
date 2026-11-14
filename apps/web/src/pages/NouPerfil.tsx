// Inserir un intèrpret nou a l'entitat (només administradors).
// És el mateix formulari que el del creador, però aquí ser administrador no és obligatori.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AtributDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import { perfilApi } from "../adapters/api/PerfilApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PerfilForm from "../components/PerfilForm";
import { useEntitat } from "../context/EntitatContext";
import { dadesDEsborrany, esborranyBuit, filesDePlantilla } from "../lib/perfils";
import "../components/Formulari.css";

// Carrega la plantilla per saber quins atributs té el formulari. En crear el perfil, hi entra.
export default function NouPerfil() {
  const entitat = useEntitat();
  const navigate = useNavigate();
  const [atributs, setAtributs] = useState<AtributDto[] | null>(null);
  const [errorCarrega, setErrorCarrega] = useState(false);
  const [perfil, setPerfil] = useState(esborranyBuit);
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  useEffect(() => {
    let cancelat = false;
    entitatApi
      .plantilla(entitat.id)
      .then((a) => {
        if (!cancelat) setAtributs(a);
      })
      .catch(() => {
        if (!cancelat) setErrorCarrega(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id]);

  // Crea el perfil i va al seu detall
  async function confirma() {
    if (!atributs) return;
    setEnviant(true);
    setErrorServidor(null);
    try {
      const { id } = await perfilApi.crea(entitat.id, dadesDEsborrany(perfil, atributs));
      navigate(`/entitat/${entitat.id}/perfils/${id}`, { replace: true });
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
