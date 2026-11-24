// Inserir o editar una peça de roba (només administradors).
// Sense pecaId a la ruta és una peça nova; amb pecaId, s'edita aquella peça (el tipus ja no es pot canviar).

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AmbAvis, ColorDto, PecaDetallDto, TipusPecaDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PecaForm, { valorsDEsborrany, type PecaEsborrany } from "../components/PecaForm";
import { useColors, useTipusPeca } from "../context/CatalegsContext";
import { useEntitat } from "../context/EntitatContext";
import { useDadaPassada } from "../lib/navegacio";
import "../components/Formulari.css";
import "./EditaPeca.css";

type Carrega = {
  tipus: TipusPecaDto[];
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
// Els tipus (amb els atributs) i la paleta surten dels catàlegs de l'entitat. La peça que s'edita la passa
// el detall (si s'hi arriba d'una altra manera, es demana), i en desar es torna al detall amb la peça desada.
export default function EditaPeca() {
  const entitat = useEntitat();
  const navega = useNavigate();
  const { pecaId } = useParams();
  const editant = pecaId !== undefined;
  const id = editant ? Number(pecaId) : null;

  const passada = useDadaPassada<PecaDetallDto>("peca", id ?? -1);
  const tipus = useTipusPeca();
  const colors = useColors();

  const [peca, setPeca] = useState<PecaDetallDto | null>(passada);
  const [errorPeca, setErrorPeca] = useState(false);
  const [dades, setDades] = useState<PecaEsborrany>(passada ? esborranyDePeca(passada) : BUIT);
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Si s'edita una peça que no ha passat el detall, la demana a l'API
  useEffect(() => {
    if (id === null || passada) return;
    if (!Number.isInteger(id) || id <= 0) {
      setErrorPeca(true);
      return;
    }
    let cancelat = false;
    vestuariApi
      .peca(entitat.id, id)
      .then((p) => {
        if (cancelat) return;
        setPeca(p);
        setDades(esborranyDePeca(p));
      })
      .catch(() => {
        if (!cancelat) setErrorPeca(true);
      });
    return () => {
      cancelat = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitat.id, id]);

  const errorCarrega = errorPeca || tipus.error || colors.error;
  const carrega: Carrega | null =
    tipus.dades && colors.dades && (!editant || peca) ? { tipus: tipus.dades, colors: colors.dades, peca } : null;

  // Els atributs del tipus triat (els tipus ja els porten, no cal demanar-los)
  const atributs =
    dades.tipusId === "" ? null : tipus.dades?.find((t) => String(t.id) === dades.tipusId)?.atributs ?? null;
  const base = `/entitat/${entitat.id}/vestuari`;

  // Desa la peça i la foto amb una sola crida, i va al detall
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

    let resposta: AmbAvis<PecaDetallDto>;
    try {
      resposta =
        id !== null
          ? await vestuariApi.editaPeca(entitat.id, id, cos, dades.imatge)
          : await vestuariApi.creaPeca(entitat.id, cos, dades.imatge);
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'ha pogut guardar la peça.");
      setEnviant(false);
      return;
    }

    // Si la foto no s'ha pogut pujar, la peça ja està guardada: el detall ho avisarà
    const { avis, ...desada } = resposta;
    // El detall rep la peça desada (amb la foto nova), i així no l'ha de tornar a demanar
    navega(`${base}/peces/${desada.id}`, { replace: true, state: { peca: desada, avis } });
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
