// Modificar els atributs de la plantilla de perfil (només administradors).
// Els atributs que es treuen no s'esborren fins que es guarda, i abans es torna a demanar confirmació.

import { useEffect, useState } from "react";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import PlantillaPerfilForm from "../components/PlantillaPerfilForm";
import { atributsOmplerts, type AtributFila } from "../context/CreacioEntitatContext";
import { useActualitzaCatalegs, usePlantilla } from "../context/CatalegsContext";
import { useEntitat } from "../context/EntitatContext";
import { filesDePlantilla, plantillaDeFiles } from "../lib/perfils";
import "../components/Formulari.css";

// En guardar, si es treu algun atribut que ja existia, es pregunta abans amb la llista dels que s'esborraran.
// Si no se n'esborra cap, es guarda directament.
// La plantilla surt dels catàlegs de l'entitat, i en guardar-la s'hi posa la que retorna l'API.
export default function EditaPlantilla() {
  const entitat = useEntitat();
  const { dades: originals, error: errorCarrega } = usePlantilla();
  const { posaPlantilla } = useActualitzaCatalegs();
  const [files, setFiles] = useState<AtributFila[] | null>(null);
  const [confirmant, setConfirmant] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);

  // Quan arriba la plantilla, omple el formulari (només el primer cop, per no perdre el que s'escriu)
  useEffect(() => {
    if (originals && files === null) setFiles(filesDePlantilla(originals));
  }, [originals, files]);

  // Els atributs que estaven guardats i ja no hi són
  const esborrats = (originals ?? []).filter((o) => !(files ?? []).some((f) => f.id === o.id));

  // El formulari ja és vàlid: si s'esborra algun atribut pregunta, i si no, guarda
  function confirma() {
    setAvis(null);
    if (esborrats.length > 0) setConfirmant(true);
    else void desa();
  }

  // Guarda la plantilla i torna a omplir el formulari amb el que ha quedat guardat
  async function desa() {
    if (!files) return;
    setEnviant(true);
    setErrorServidor(null);
    try {
      const desats = await entitatApi.desaPlantilla(
        entitat.id,
        plantillaDeFiles(atributsOmplerts(files))
      );
      posaPlantilla(desats);
      setFiles(filesDePlantilla(desats));
      setConfirmant(false);
      setAvis("S'han guardat els canvis de la plantilla.");
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'ha pogut guardar la plantilla.");
      setConfirmant(false);
    } finally {
      setEnviant(false);
    }
  }

  const noms = esborrats.map((a) => `«${a.nom}»`).join(", ");

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} seccio="Atributs dels perfils" mostraInvitacions={false} />

      <div className="pantalla__barra">
        <BotoEnrere to={`/entitat/${entitat.id}/interprets`} />
      </div>

      <main className="pantalla__contingut">
        {errorCarrega && <p role="alert">No s'ha pogut carregar la plantilla de perfil.</p>}
        {!errorCarrega && originals === null && <p>Carregant…</p>}
        {avis && <p className="formulari__nota" role="status">{avis}</p>}
        {originals && files && (
          <PlantillaPerfilForm
            mode="edicio"
            atributs={files}
            onCanvi={(f) => {
              setFiles(f);
              setAvis(null);
            }}
            onConfirma={confirma}
            enviant={enviant}
            errorServidor={errorServidor}
            textBoto="Guardar"
          />
        )}
      </main>

      <Confirmacio
        obert={confirmant}
        titol="Segur que vols guardar?"
        missatge={`S'esborraran per sempre ${esborrats.length === 1 ? "l'atribut" : "els atributs"} ${noms}, i el seu valor a tots els perfils de l'entitat. Aquesta acció no es pot desfer.`}
        textAccepta="Guardar i esborrar"
        perillosa
        enviant={enviant}
        onAccepta={() => void desa()}
        onCancela={() => setConfirmant(false)}
      />
    </div>
  );
}
