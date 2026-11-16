// Detall d'un perfil: les dades bàsiques i els valors dels atributs de la plantilla.
// Els administradors el poden editar, compartir, descompartir i cancel·lar-ne la invitació.
// És també la pantalla de "El meu perfil", on els que no són administradors només poden mirar.

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GENERES, type AtributDto, type PerfilDetallDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import { perfilApi } from "../adapters/api/PerfilApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import CompartirPerfil from "../components/CompartirPerfil";
import Confirmacio from "../components/Confirmacio";
import { useEntitat } from "../context/EntitatContext";
import "./PerfilDetall.css";

type Estat =
  | { tipus: "carregant" }
  | { tipus: "no_disponible" }
  | { tipus: "error" }
  | { tipus: "ok"; perfil: PerfilDetallDto; atributs: AtributDto[] };

type Accio = "descomparteix" | "cancela";

// El que es veu d'un camp: el valor, o una ratlla si és buit
const mostra = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

// Carrega el perfil i la plantilla alhora. Després de cada acció, ho torna a carregar.
// No es pot descompartir el perfil del creador ni el propi (ho comprova també l'API).
export default function PerfilDetall() {
  const entitat = useEntitat();
  const { perfilId } = useParams();
  const idPerfil = Number(perfilId);
  const esAdmin = entitat.perfil.esAdministrador;

  const [estat, setEstat] = useState<Estat>({ tipus: "carregant" });
  const [compartint, setCompartint] = useState(false);
  const [accio, setAccio] = useState<Accio | null>(null);
  const [enviant, setEnviant] = useState(false);
  const [errorAccio, setErrorAccio] = useState<string | null>(null);

  // Demana el perfil i la plantilla a l'API
  const carrega = useCallback(async () => {
    if (!Number.isInteger(idPerfil) || idPerfil <= 0) {
      setEstat({ tipus: "no_disponible" });
      return;
    }
    try {
      const [perfil, atributs] = await Promise.all([
        perfilApi.detall(entitat.id, idPerfil),
        entitatApi.plantilla(entitat.id),
      ]);
      setEstat({ tipus: "ok", perfil, atributs });
    } catch (e) {
      setEstat(e instanceof ApiError && e.status === 404 ? { tipus: "no_disponible" } : { tipus: "error" });
    }
  }, [entitat.id, idPerfil]);

  useEffect(() => {
    void carrega();
  }, [carrega]);

  // Fa l'acció confirmada (descompartir o cancel·lar la invitació) i torna a carregar
  async function executa() {
    if (!accio) return;
    setEnviant(true);
    setErrorAccio(null);
    try {
      if (accio === "descomparteix") await perfilApi.descomparteix(entitat.id, idPerfil);
      else await perfilApi.cancelaInvitacio(entitat.id, idPerfil);
      setAccio(null);
      await carrega();
    } catch (e) {
      setErrorAccio(e instanceof ApiError ? e.message : "No s'ha pogut fer l'acció. Torna-ho a provar.");
    } finally {
      setEnviant(false);
    }
  }

  const base = `/entitat/${entitat.id}`;
  const tornada = esAdmin ? `${base}/interprets` : base;

  if (estat.tipus !== "ok") {
    return (
      <div className="perfil-detall">
        <Capcalera entitat={entitat} seccio="Intèrprets" mostraInvitacions={false} />
        <main className="perfil-detall__targeta">
          <BotoEnrere to={tornada} />
          {estat.tipus === "carregant" && <p className="perfil-detall__missatge">Carregant…</p>}
          {estat.tipus === "no_disponible" && (
            <p className="perfil-detall__missatge">Aquest perfil no existeix o no el pots veure.</p>
          )}
          {estat.tipus === "error" && (
            <p className="perfil-detall__missatge" role="alert">No s'ha pogut carregar el perfil.</p>
          )}
        </main>
      </div>
    );
  }

  const { perfil, atributs } = estat;
  const genere = GENERES.find((g) => g.valor === perfil.genere)?.etiqueta ?? null;
  const valorDe = (a: AtributDto) => perfil.valors.find((v) => v.atributId === a.id)?.valor;
  const potDescompartir = !perfil.esMeu && !perfil.esCreador;

  const camps: { etiqueta: string; valor: string }[] = [
    { etiqueta: "Edat", valor: mostra(perfil.edat) },
    { etiqueta: "Gènere", valor: mostra(genere) },
    ...atributs.map((a) => ({ etiqueta: a.nom, valor: mostra(valorDe(a)) })),
  ];

  const rols = [perfil.esAdministrador && "Administrador", perfil.esInterpret && "Intèrpret"].filter(Boolean);

  return (
    <div className="perfil-detall">
      <Capcalera entitat={entitat} seccio={esAdmin ? "Intèrprets" : "El meu perfil"} mostraInvitacions={false} />

      <main className="perfil-detall__targeta">
        <div className="perfil-detall__cap">
          <BotoEnrere to={tornada} />
          <h1 className="perfil-detall__nom">{perfil.nom}</h1>
        </div>
        <p className="perfil-detall__rols">{rols.join(" · ")}</p>

        <dl className="perfil-detall__camps">
          {camps.map((c, i) => (
            <div key={i} className="perfil-detall__camp">
              <dt>{c.etiqueta}</dt>
              <dd>{c.valor}</dd>
            </div>
          ))}
        </dl>

        {esAdmin && (
          <div className="perfil-detall__accions">
            <Link className="perfil-detall__boto" to={`${base}/perfils/${perfil.id}/editar`}>
              Editar entrada
            </Link>

            {perfil.compartitAmb ? (
              potDescompartir ? (
                <button
                  type="button"
                  className="perfil-detall__boto perfil-detall__boto--compartit"
                  title="Clica per descompartir el perfil"
                  onClick={() => {
                    setErrorAccio(null);
                    setAccio("descomparteix");
                  }}
                >
                  Compartit amb {perfil.compartitAmb}
                </button>
              ) : (
                <p className="perfil-detall__compartit">Compartit amb {perfil.compartitAmb}</p>
              )
            ) : perfil.invitacio ? (
              <div className="perfil-detall__invitacio">
                <p>Invitació enviada a {perfil.invitacio.email}</p>
                <button
                  type="button"
                  className="perfil-detall__cancela"
                  onClick={() => {
                    setErrorAccio(null);
                    setAccio("cancela");
                  }}
                >
                  Cancel·lar la invitació
                </button>
              </div>
            ) : (
              <button type="button" className="perfil-detall__boto" onClick={() => setCompartint(true)}>
                Compartir perfil
              </button>
            )}
          </div>
        )}
      </main>

      <CompartirPerfil
        obert={compartint}
        entitatId={entitat.id}
        perfil={perfil}
        onTanca={() => setCompartint(false)}
        onEnviada={() => void carrega()}
      />

      <Confirmacio
        obert={accio !== null}
        titol={accio === "descomparteix" ? "Vols descompartir aquest perfil?" : "Vols cancel·lar la invitació?"}
        missatge={
          accio === "descomparteix"
            ? `${perfil.compartitAmb} deixarà de tenir accés a l'entitat, i el perfil «${perfil.nom}» quedarà lliure per compartir-lo amb algú altre.`
            : `La invitació a ${perfil.invitacio?.email ?? ""} s'esborrarà i ja no la podrà acceptar.`
        }
        textAccepta={accio === "descomparteix" ? "Descompartir" : "Cancel·lar la invitació"}
        perillosa
        enviant={enviant}
        error={errorAccio}
        onAccepta={executa}
        onCancela={() => setAccio(null)}
      />
    </div>
  );
}
