// Crear o modificar un tipus de peça (només administradors).
// Sense tipusId a la ruta és un tipus nou: buit, o amb els atributs copiats d'un altre (?de=id).
// Amb tipusId, s'edita aquell tipus.

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { AtributPecaDto, TipusPecaDadesDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import TipusPecaForm, { atributsPecaOmplerts, type AtributPecaFila } from "../components/TipusPecaForm";
import { useEntitat } from "../context/EntitatContext";
import "../components/Formulari.css";
import "./EditaTipusPeca.css";

// Els atributs guardats com a files del formulari. Si es copien d'un altre tipus, van sense id (són nous).
function filesDAtributs(atributs: AtributPecaDto[], copia: boolean): AtributPecaFila[] {
  return atributs.map((a) => ({ clau: a.id, id: copia ? undefined : a.id, nom: a.nom, tipus: a.tipus }));
}

// El formulari ja validat, en el format de l'API
function dadesDeFiles(nom: string, files: AtributPecaFila[]): TipusPecaDadesDto {
  return {
    nom,
    atributs: atributsPecaOmplerts(files).map((f) => ({
      id: f.id ?? null,
      nom: f.nom,
      tipus: f.tipus as AtributPecaDto["tipus"],
    })),
  };
}

// En guardar un tipus que ja existia, si es treu algun atribut guardat es pregunta abans amb la llista
// dels que s'esborraran. Quan s'ha guardat, es torna al detall del tipus.
export default function EditaTipusPeca() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const { tipusId } = useParams();
  const [params] = useSearchParams();

  const editant = tipusId !== undefined;
  const id = editant ? Number(tipusId) : null;
  const de = params.get("de");
  const origen = editant ? id : de !== null ? Number(de) : null;

  const [originals, setOriginals] = useState<AtributPecaDto[]>([]);
  const [nom, setNom] = useState("");
  const [files, setFiles] = useState<AtributPecaFila[]>([]);
  const [carregat, setCarregat] = useState(origen === null);
  const [errorCarrega, setErrorCarrega] = useState(false);
  const [confirmant, setConfirmant] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Si s'edita o es copia, carrega el tipus d'origen
  useEffect(() => {
    if (origen === null) return;
    if (!Number.isInteger(origen) || origen <= 0) {
      setErrorCarrega(true);
      return;
    }
    let cancelat = false;
    vestuariApi
      .tipusDetall(entitat.id, origen)
      .then((t) => {
        if (cancelat) return;
        if (editant) {
          setOriginals(t.atributs);
          setNom(t.nom);
        }
        setFiles(filesDAtributs(t.atributs, !editant));
        setCarregat(true);
      })
      .catch(() => {
        if (!cancelat) setErrorCarrega(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id, origen, editant]);

  const llista = `/entitat/${entitat.id}/vestuari/tipus`;

  // Els atributs que estaven guardats i ja no hi són
  const esborrats = originals.filter((o) => !files.some((f) => f.id === o.id));

  // El formulari ja és vàlid: si s'esborra algun atribut pregunta, i si no, guarda
  function confirma() {
    if (esborrats.length > 0) setConfirmant(true);
    else void desa();
  }

  // Crea o desa el tipus, i va al seu detall
  async function desa() {
    setEnviant(true);
    setErrorServidor(null);
    try {
      const dades = dadesDeFiles(nom, files);
      const idDesat = id !== null
        ? (await vestuariApi.desaTipus(entitat.id, id, dades)).id
        : (await vestuariApi.creaTipus(entitat.id, dades)).id;
      navega(`${llista}/${idDesat}`, { replace: true });
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'ha pogut guardar el tipus de peça.");
      setConfirmant(false);
      setEnviant(false);
    }
  }

  const noms = esborrats.map((a) => `«${a.nom}»`).join(", ");

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} seccio="Tipus de peça" mostraInvitacions={false} />

      <div className="pantalla__barra">
        <BotoEnrere to={editant ? `${llista}/${tipusId}` : llista} />
      </div>

      <main className="pantalla__contingut edita-tipus">
        {errorCarrega && <p role="alert">No s'ha pogut carregar el tipus de peça.</p>}
        {!errorCarrega && !carregat && <p>Carregant…</p>}
        {!errorCarrega && carregat && (
          <TipusPecaForm
            nom={nom}
            atributs={files}
            onCanviNom={setNom}
            onCanvi={setFiles}
            onConfirma={confirma}
            enviant={enviant}
            errorServidor={errorServidor}
            textBoto={editant ? "Guardar" : "Crear"}
          />
        )}
      </main>

      <Confirmacio
        obert={confirmant}
        titol="Segur que vols guardar?"
        missatge={`S'esborraran per sempre ${esborrats.length === 1 ? "l'atribut" : "els atributs"} ${noms}, i el seu valor a totes les peces d'aquest tipus. Aquesta acció no es pot desfer.`}
        textAccepta="Guardar i esborrar"
        perillosa
        enviant={enviant}
        onAccepta={() => void desa()}
        onCancela={() => setConfirmant(false)}
      />
    </div>
  );
}
