// Inventari de vestuari de l'entitat: totes les peces de roba (amb la foto), amb el cercador i el filtre
// per tipus de peça. Clicant una peça se'n veu el detall. Els administradors en poden inserir de noves.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PecaResumDto, TipusPecaResumDto } from "@tfg-vestulari/shared";
import { vestuariApi } from "../adapters/api/VestuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Cercador from "../components/Cercador";
import Desplegable from "../components/Desplegable";
import { useEntitat } from "../context/EntitatContext";
import { coincideix } from "../lib/cerca";
import "./Vestuari.css";

type Dades = { peces: PecaResumDto[]; tipus: TipusPecaResumDto[] };

// Valor del desplegable quan no es filtra per cap tipus
const TOTS = "tots";

// Carrega les peces i els tipus alhora. El filtre per tipus i la cerca es fan al navegador.
// El filtre avançat encara no té pantalla: surt desactivat.
export default function Vestuari() {
  const entitat = useEntitat();
  const [dades, setDades] = useState<Dades | null>(null);
  const [error, setError] = useState(false);
  const [cerca, setCerca] = useState("");
  const [tipusTriat, setTipusTriat] = useState<string>(TOTS);

  useEffect(() => {
    let cancelat = false;
    Promise.all([vestuariApi.peces(entitat.id), vestuariApi.tipus(entitat.id)])
      .then(([peces, tipus]) => {
        if (!cancelat) setDades({ peces, tipus });
      })
      .catch((e) => {
        console.error("Error carregant el vestuari", e);
        if (!cancelat) setError(true);
      });
    return () => {
      cancelat = true;
    };
  }, [entitat.id]);

  const opcionsTipus = [
    { valor: TOTS, etiqueta: "Tots els tipus" },
    ...(dades?.tipus ?? []).map((t) => ({ valor: String(t.id), etiqueta: t.nom })),
  ];
  const visibles = (dades?.peces ?? []).filter(
    (p) => (tipusTriat === TOTS || String(p.tipusId) === tipusTriat) && coincideix(p.nom, cerca)
  );

  const base = `/entitat/${entitat.id}`;

  return (
    <div className="vestuari">
      <Capcalera entitat={entitat} seccio="Vestuari" mostraInvitacions={false} />

      <div className="vestuari__barra">
        <BotoEnrere to={base} />
        <Cercador valor={cerca} onCanvi={setCerca} placeholder="Buscar vestuari" />

        <div className="vestuari__filtres">
          <Desplegable
            id="vestuari-tipus"
            className="vestuari__tipus"
            valor={tipusTriat}
            opcions={opcionsTipus}
            placeholder="Tipus"
            onCanvi={setTipusTriat}
          />
          <button type="button" className="vestuari__filtre" disabled title="Properament">
            Filtrar
          </button>
        </div>
      </div>

      <main className="vestuari__contingut">
        {error && (
          <p className="vestuari__missatge" role="alert">
            No s'ha pogut carregar el vestuari.
          </p>
        )}
        {!error && dades === null && <p className="vestuari__missatge">Carregant…</p>}
        {dades && dades.peces.length === 0 && (
          <p className="vestuari__missatge">Encara no hi ha cap peça de roba a l'inventari.</p>
        )}
        {dades && dades.peces.length > 0 && visibles.length === 0 && (
          <p className="vestuari__missatge">Cap peça coincideix amb la cerca.</p>
        )}

        {visibles.length > 0 && (
          <ul className="vestuari__graella">
            {visibles.map((p) => (
              <li key={p.id}>
                <Link className="vestuari__peca" to={`${base}/vestuari/peces/${p.id}`}>
                  <span className="vestuari__foto">
                    {p.imatgeUrl ? <img src={p.imatgeUrl} alt="" loading="lazy" /> : <IconaPenjador />}
                  </span>
                  <span className="vestuari__nom">{p.nom}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="vestuari__peu">
        {entitat.perfil.esAdministrador && (
          <Link className="vestuari__boto" to={`${base}/vestuari/peces/nova`}>
            <span className="vestuari__mes" aria-hidden="true">+</span>
            Inserir peça de roba
          </Link>
        )}
        <Link className="vestuari__boto" to={`${base}/vestuari/tipus`}>
          Veure tipus de peça
        </Link>
      </div>
    </div>
  );
}

// Penjador de roba, per a les peces que no tenen foto
function IconaPenjador() {
  return (
    <svg viewBox="0 0 56 40" focusable="false">
      <path
        d="M24 8.5a4 4 0 1 1 4 4V17 M28 17 L4.5 33 a2 2 0 0 0 1.2 3.6 H50.3 a2 2 0 0 0 1.2 -3.6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
