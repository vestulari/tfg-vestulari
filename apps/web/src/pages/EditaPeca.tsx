// Inserir o editar una peça de roba (només administradors).
// Sense pecaId a la ruta és una peça nova; amb pecaId, s'edita aquella peça (el tipus ja no es pot canviar).

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AtributPecaDto, ColorDto, PecaDetallDto, TipusPecaResumDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PecaForm, { valorsDEsborrany, type PecaEsborrany } from "../components/PecaForm";
import { useEntitat } from "../context/EntitatContext";
import "../components/Formulari.css";
import "./EditaPeca.css";

type Carrega = {
  tipus: TipusPecaResumDto[];
  colors: ColorDto[];
  // La peça que s'edita (null si és nova)
  peca: PecaDetallDto | null;
};

const BUIT: PecaEsborrany = { nom: "", descripcio: "", tipusId: "", valors: {}, imatge: null };

// Una peça guardada com a esborrany, per omplir el formulari d'edició
function esborranyDePeca(p: PecaDetallDto): PecaEsborrany {
  const valors: Record<number, string> = {};
  for (const v of p.valors) valors[v.atributId] = v.valor;
  return { nom: p.nom, descripcio: p.descripcio ?? "", tipusId: String(p.tipusId), valors, imatge: null };
}

// Primer es desen les dades i després la foto. Si la foto falla, la peça ja queda guardada:
// es va igualment al detall, i allà s'avisa que la foto no s'ha pogut pujar.
export default function EditaPeca() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const { pecaId } = useParams();
  const editant = pecaId !== undefined;
  const id = editant ? Number(pecaId) : null;

  const [carrega, setCarrega] = useState<Carrega | null>(null);
  const [errorCarrega, setErrorCarrega] = useState(false);
  const [dades, setDades] = useState<PecaEsborrany>(BUIT);
  // Els atributs de cada tipus que ja s'han carregat, per no tornar-los a demanar
  const [atributsPerTipus, setAtributsPerTipus] = useState<Record<string, AtributPecaDto[]>>({});
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Carrega els tipus, la paleta i, si s'edita, la peça
  useEffect(() => {
    if (id !== null && (!Number.isInteger(id) || id <= 0)) {
      setErrorCarrega(true);
      return;
    }
    let cancelat = false;
    Promise.all([
      vestuariApi.tipus(entitat.id),
      vestuariApi.colors(entitat.id),
      id === null ? Promise.resolve(null) : vestuariApi.peca(entitat.id, id),
    ])
      .then(([tipus, colors, peca]) => {
        if (cancelat) return;
        setCarrega({ tipus, colors, peca });
        if (peca) setDades(esborranyDePeca(peca));
      })
      .catch(() => {
        if (!cancelat) setErrorCarrega(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id, id]);

  // Quan es tria un tipus, carrega els seus atributs (si encara no s'havien carregat)
  useEffect(() => {
    const t = dades.tipusId;
    if (t === "" || atributsPerTipus[t]) return;
    let cancelat = false;
    vestuariApi
      .tipusDetall(entitat.id, Number(t))
      .then((d) => {
        if (!cancelat) setAtributsPerTipus((a) => ({ ...a, [t]: d.atributs }));
      })
      .catch(() => {
        if (!cancelat) setErrorServidor("No s'han pogut carregar els atributs d'aquest tipus de peça.");
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id, dades.tipusId, atributsPerTipus]);

  const atributs = dades.tipusId === "" ? null : atributsPerTipus[dades.tipusId] ?? null;
  const base = `/entitat/${entitat.id}/vestuari`;

  // Desa la peça i després la foto, i va al detall
  async function desa() {
    if (!atributs) return;
    setEnviant(true);
    setErrorServidor(null);

    const cos = {
      nom: dades.nom,
      descripcio: dades.descripcio,
      tipusId: Number(dades.tipusId),
      valors: valorsDEsborrany(dades, atributs),
    };

    let idDesat: number;
    try {
      idDesat = id !== null ? (await vestuariApi.editaPeca(entitat.id, id, cos)).id : (await vestuariApi.creaPeca(entitat.id, cos)).id;
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'ha pogut guardar la peça.");
      setEnviant(false);
      return;
    }

    let avis: string | undefined;
    try {
      if (dades.imatge instanceof File) await vestuariApi.canviaImatgePeca(entitat.id, idDesat, dades.imatge);
      else if (dades.imatge === "treu") await vestuariApi.treuImatgePeca(entitat.id, idDesat);
    } catch (e) {
      avis = `La peça s'ha guardat, però la foto no: ${e instanceof ApiError ? e.message : "torna-ho a provar editant la peça."}`;
    }
    navega(`${base}/peces/${idDesat}`, { replace: true, state: avis ? { avis } : undefined });
  }

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} seccio="Vestuari" mostraInvitacions={false} />

      <div className="pantalla__barra">
        <BotoEnrere to={editant ? `${base}/peces/${pecaId}` : base} />
      </div>

      <main className="pantalla__contingut edita-peca">
        {errorCarrega && <p role="alert">No s'ha pogut carregar {editant ? "la peça" : "el formulari"}.</p>}
        {!errorCarrega && carrega === null && <p>Carregant…</p>}
        {carrega && !editant && carrega.tipus.length === 0 && (
          <p className="formulari__nota">
            Encara no hi ha cap tipus de peça. Crea'n un des de "Veure tipus de peça" abans d'inserir peces.
          </p>
        )}
        {carrega && (editant || carrega.tipus.length > 0) && (
          <PecaForm
            dades={dades}
            onCanvi={(canvi) => setDades((d) => ({ ...d, ...canvi }))}
            tipus={carrega.tipus}
            atributs={atributs}
            colors={carrega.colors}
            tipusFix={editant}
            imatgeActual={carrega.peca?.imatgeUrl ?? null}
            onConfirma={() => void desa()}
            enviant={enviant}
            errorServidor={errorServidor}
          />
        )}
      </main>
    </div>
  );
}
