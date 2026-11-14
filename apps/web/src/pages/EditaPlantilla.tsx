// Modificar els atributs de la plantilla de perfil (només administradors).
// Els atributs que es treuen no s'esborren fins que es guarda, i abans es torna a demanar confirmació.

import { useEffect, useState } from "react";
import type { AtributDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import PlantillaPerfilForm from "../components/PlantillaPerfilForm";
import { atributsOmplerts, type AtributFila } from "../context/CreacioEntitatContext";
import { useEntitat } from "../context/EntitatContext";
import { filesDePlantilla, plantillaDeFiles } from "../lib/perfils";
import "../components/Formulari.css";

// En guardar, si es treu algun atribut que ja existia, es pregunta abans amb la llista dels que s'esborraran.
// Si no se n'esborra cap, es guarda directament.
export default function EditaPlantilla() {
  const entitat = useEntitat();
  const [originals, setOriginals] = useState<AtributDto[] | null>(null);
  const [files, setFiles] = useState<AtributFila[]>([]);
  const [errorCarrega, setErrorCarrega] = useState(false);
  const [confirmant, setConfirmant] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);

  useEffect(() => {
    let cancelat = false;
    entitatApi
      .plantilla(entitat.id)
      .then((a) => {
        if (cancelat) return;
        setOriginals(a);
        setFiles(filesDePlantilla(a));
      })
      .catch(() => {
        if (!cancelat) setErrorCarrega(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id]);

  // Els atributs que estaven guardats i ja no hi són
  const esborrats = (originals ?? []).filter((o) => !files.some((f) => f.id === o.id));

  // El formulari ja és vàlid: si s'esborra algun atribut pregunta, i si no, guarda
  function confirma() {
    setAvis(null);
    if (esborrats.length > 0) setConfirmant(true);
    else void desa();
  }

  // Guarda la plantilla i torna a omplir el formulari amb el que ha quedat guardat
  async function desa() {
    setEnviant(true);
    setErrorServidor(null);
    try {
      const desats = await entitatApi.desaPlantilla(
        entitat.id,
        plantillaDeFiles(atributsOmplerts(files))
      );
      setOriginals(desats);
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
        {originals && (
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
