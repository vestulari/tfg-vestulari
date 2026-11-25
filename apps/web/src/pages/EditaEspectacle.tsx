// Crear o editar un espectacle (només administradors): el nom, la data d'estrena, la descripció i les escenes.
// Sense espectacleId a la ruta és un espectacle nou; amb espectacleId, s'edita aquell espectacle.

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DESCRIPCIO_MAX,
  ESPECTACLE_NOM_MAX,
  errorDataEstrena,
  errorDescripcio,
  errorEscenes,
  errorNomEspectacle,
  type EspectacleDadesDto,
  type EspectacleDetallDto,
} from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { espectacleApi } from "../adapters/api/EspectacleApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import LlistaEscenes, { type FilaEscena } from "../components/LlistaEscenes";
import { useEntitat } from "../context/EntitatContext";
import { filtraEnter } from "../lib/enters";
import { useDadaPassada } from "../lib/navegacio";
import "../components/Formulari.css";
import "./EditaEspectacle.css";

// El formulari: els números com a text, tal com s'escriuen
type Formulari = { nom: string; any: string; mes: string; dia: string; descripcio: string; escenes: FilaEscena[] };

const BUIT: Formulari = { nom: "", any: "", mes: "", dia: "", descripcio: "", escenes: [] };

// Passa un text a número, o a null si és buit
const aEnter = (s: string): number | null => (s.trim() === "" ? null : Number(s));

// Un espectacle guardat, en el format del formulari
function formulariDe(e: EspectacleDetallDto): Formulari {
  return {
    nom: e.nom,
    any: String(e.anyEstrena),
    mes: e.mesEstrena === null ? "" : String(e.mesEstrena),
    dia: e.diaEstrena === null ? "" : String(e.diaEstrena),
    descripcio: e.descripcio ?? "",
    escenes: e.escenes.map((x) => ({ clau: x.id, id: x.id, nom: x.nom })),
  };
}

// El formulari en el format de l'API (les escenes en l'ordre de la llista; les noves, sense id)
function dadesDe(f: Formulari): EspectacleDadesDto {
  return {
    nom: f.nom,
    descripcio: f.descripcio.trim(),
    anyEstrena: Number(f.any),
    mesEstrena: aEnter(f.mes),
    diaEstrena: aEnter(f.dia),
    escenes: f.escenes.map((e) => ({ id: e.id ?? null, nom: e.nom })),
  };
}

// L'espectacle que s'edita el passa el detall (si s'hi arriba d'una altra manera, es demana a l'API).
// En guardar, si es treu alguna escena que ja existia, es torna a preguntar amb la llista de les que
// s'esborraran. Quan s'ha guardat, es va al detall amb l'espectacle que retorna l'API.
export default function EditaEspectacle() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const { espectacleId } = useParams();
  const editant = espectacleId !== undefined;
  const id = editant ? Number(espectacleId) : null;
  const passat = useDadaPassada<EspectacleDetallDto>("espectacle", id ?? -1);

  const [original, setOriginal] = useState<EspectacleDetallDto | null>(passat);
  const [form, setForm] = useState<Formulari>(passat ? formulariDe(passat) : BUIT);
  const [errorCarrega, setErrorCarrega] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmant, setConfirmant] = useState(false);
  const [enviant, setEnviant] = useState(false);

  // Si s'edita un espectacle que no ha passat el detall, el demana a l'API
  useEffect(() => {
    if (id === null || passat) return;
    if (!Number.isInteger(id) || id <= 0) {
      setErrorCarrega(true);
      return;
    }
    let cancelat = false;
    espectacleApi
      .detall(entitat.id, id)
      .then((e) => {
        if (cancelat) return;
        setOriginal(e);
        setForm(formulariDe(e));
      })
      .catch(() => {
        if (!cancelat) setErrorCarrega(true);
      });
    return () => {
      cancelat = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitat.id, id]);

  // Canvia un o més camps del formulari i treu l'error que hi hagués
  function canvia(parcial: Partial<Formulari>) {
    setForm((f) => ({ ...f, ...parcial }));
    setError(null);
  }

  // Les escenes que estaven guardades i ja no hi són
  const esborrades = (original?.escenes ?? []).filter((o) => !form.escenes.some((e) => e.id === o.id));

  // Valida el formulari i, si està bé, guarda (o abans pregunta, si s'esborra alguna escena)
  function envia(e: FormEvent) {
    e.preventDefault();
    const err =
      errorNomEspectacle(form.nom) ??
      errorDataEstrena(aEnter(form.any), aEnter(form.mes), aEnter(form.dia)) ??
      errorDescripcio(form.descripcio) ??
      errorEscenes(form.escenes);
    if (err) {
      setError(err);
      return;
    }
    if (esborrades.length > 0) setConfirmant(true);
    else void desa();
  }

  // Crea o desa l'espectacle, i va al seu detall
  async function desa() {
    setEnviant(true);
    setError(null);
    try {
      const desat =
        id !== null
          ? await espectacleApi.desa(entitat.id, id, dadesDe(form))
          : await espectacleApi.crea(entitat.id, dadesDe(form));
      navega(`/entitat/${entitat.id}/espectacles/${desat.id}`, { replace: true, state: { espectacle: desat } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No s'ha pogut guardar l'espectacle.");
      setConfirmant(false);
      setEnviant(false);
    }
  }

  const llista = `/entitat/${entitat.id}/espectacles`;
  const noms = esborrades.map((e) => `«${e.nom}»`).join(", ");

  return (
    <div className="edita-espectacle">
      <Capcalera entitat={entitat} seccio="Espectacle" mostraInvitacions={false} />

      <main className="edita-espectacle__targeta">
        {errorCarrega && (
          <>
            <BotoEnrere to={llista} />
            <p role="alert">No s'ha pogut carregar l'espectacle.</p>
          </>
        )}
        {!errorCarrega && editant && !original && (
          <>
            <BotoEnrere to={llista} />
            <p>Carregant…</p>
          </>
        )}

        {!errorCarrega && (!editant || original) && (
          <form className="formulari" onSubmit={envia} noValidate>
            <div className="edita-espectacle__cap">
              <BotoEnrere
                to={editant ? `${llista}/${id}` : llista}
                state={original ? { espectacle: original } : undefined}
              />
              <input
                className="edita-espectacle__nom"
                type="text"
                autoComplete="off"
                placeholder="Insereix nom de l'espectacle"
                aria-label="Nom de l'espectacle"
                maxLength={ESPECTACLE_NOM_MAX}
                value={form.nom}
                onChange={(e) => canvia({ nom: e.target.value })}
              />
            </div>

            <div className="edita-espectacle__estrena">
              <span className="formulari__etiqueta" id="etiqueta-estrena">Data d'estrena</span>
              <div className="edita-espectacle__data" role="group" aria-labelledby="etiqueta-estrena" aria-describedby="nota-estrena">
                <input
                  className="formulari__input formulari__input--centrat"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Dia"
                  aria-label="Dia"
                  maxLength={2}
                  value={form.dia}
                  onChange={(e) => canvia({ dia: filtraEnter(e.target.value) })}
                />
                <input
                  className="formulari__input formulari__input--centrat"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Mes"
                  aria-label="Mes"
                  maxLength={2}
                  value={form.mes}
                  onChange={(e) => canvia({ mes: filtraEnter(e.target.value) })}
                />
                <input
                  className="formulari__input formulari__input--centrat"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Any"
                  aria-label="Any (obligatori)"
                  maxLength={4}
                  value={form.any}
                  onChange={(e) => canvia({ any: filtraEnter(e.target.value) })}
                />
              </div>
              <span className="formulari__nota" id="nota-estrena">Només l'any és obligatori</span>
            </div>

            <div className="edita-espectacle__fila">
              <label className="formulari__etiqueta" htmlFor="espectacle-descripcio">Descripció</label>
              <textarea
                id="espectacle-descripcio"
                className="formulari__textarea edita-espectacle__descripcio"
                placeholder="Text de descripció de l'espectacle!"
                maxLength={DESCRIPCIO_MAX}
                value={form.descripcio}
                onChange={(e) => canvia({ descripcio: e.target.value })}
              />
            </div>

            <section className="edita-espectacle__escenes" aria-labelledby="titol-escenes">
              <h2 id="titol-escenes" className="formulari__etiqueta edita-espectacle__subtitol">Escenes</h2>
              <LlistaEscenes escenes={form.escenes} onCanvi={(escenes) => canvia({ escenes })} />
            </section>

            {error && <p className="formulari__error" role="alert">{error}</p>}

            <div className="formulari__accions">
              <button type="submit" className="formulari__confirma" disabled={enviant}>
                {enviant ? "Un moment…" : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </main>

      <Confirmacio
        obert={confirmant}
        titol="Segur que vols guardar?"
        missatge={`S'esborraran per sempre ${esborrades.length === 1 ? "l'escena" : "les escenes"} ${noms}, i tot el que tinguin a les actuacions. Aquesta acció no es pot desfer.`}
        textAccepta="Guardar i esborrar"
        perillosa
        enviant={enviant}
        onAccepta={() => void desa()}
        onCancela={() => setConfirmant(false)}
      />
    </div>
  );
}
