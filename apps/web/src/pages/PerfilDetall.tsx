// Detall d'un perfil: les dades bàsiques i els valors dels atributs de la plantilla.
// Els administradors el poden editar, compartir, descompartir i cancel·lar-ne la invitació.
// És també la pantalla de "El meu perfil", on els que no són administradors només poden mirar.

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GENERES, type AtributDto, type PerfilDetallDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { perfilApi } from "../adapters/api/PerfilApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import CompartirPerfil from "../components/CompartirPerfil";
import Confirmacio from "../components/Confirmacio";
import { usePlantilla } from "../context/CatalegsContext";
import { useEntitat } from "../context/EntitatContext";
import { useDadaPassada } from "../lib/navegacio";
import "./PerfilDetall.css";

type Estat =
  | { tipus: "carregant" }
  | { tipus: "no_disponible" }
  | { tipus: "error" }
  | { tipus: "ok"; perfil: PerfilDetallDto };

type Accio = "descomparteix" | "cancela";

// El que es veu d'un camp: el valor, o una ratlla si és buit
const mostra = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

// La plantilla surt dels catàlegs de l'entitat, i el perfil només es demana si la pantalla anterior
// no l'ha passat (per exemple, en tornar d'editar-lo). Les accions ja retornen el perfil actualitzat.
// No es pot descompartir el perfil del creador ni el propi (ho comprova també l'API).
export default function PerfilDetall() {
  const entitat = useEntitat();
  const { perfilId } = useParams();
  const idPerfil = Number(perfilId);
  const esAdmin = entitat.perfil.esAdministrador;

  const passat = useDadaPassada<PerfilDetallDto>("perfil", idPerfil);
  const plantilla = usePlantilla();

  const [estat, setEstat] = useState<Estat>(passat ? { tipus: "ok", perfil: passat } : { tipus: "carregant" });
  const [compartint, setCompartint] = useState(false);
  const [accio, setAccio] = useState<Accio | null>(null);
  const [enviant, setEnviant] = useState(false);
  const [errorAccio, setErrorAccio] = useState<string | null>(null);

  // Demana el perfil a l'API, si no l'ha passat la pantalla anterior
  useEffect(() => {
    if (passat) {
      setEstat({ tipus: "ok", perfil: passat });
      return;
    }
    if (!Number.isInteger(idPerfil) || idPerfil <= 0) {
      setEstat({ tipus: "no_disponible" });
      return;
    }
    let cancelat = false;
    setEstat({ tipus: "carregant" });
    perfilApi
      .detall(entitat.id, idPerfil)
      .then((perfil) => {
        if (!cancelat) setEstat({ tipus: "ok", perfil });
      })
      .catch((e) => {
        if (cancelat) return;
        setEstat(e instanceof ApiError && e.status === 404 ? { tipus: "no_disponible" } : { tipus: "error" });
      });
    return () => {
      cancelat = true;
    };
    // Només cal tornar-lo a mirar si canvia el perfil (el passat és el mateix objecte mentre som aquí)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitat.id, idPerfil]);

  // Fa l'acció confirmada (descompartir o cancel·lar la invitació). L'API ja retorna el perfil actualitzat.
  async function executa() {
    if (!accio) return;
    setEnviant(true);
    setErrorAccio(null);
    try {
      const perfil =
        accio === "descomparteix"
          ? await perfilApi.descomparteix(entitat.id, idPerfil)
          : await perfilApi.cancelaInvitacio(entitat.id, idPerfil);
      setEstat({ tipus: "ok", perfil });
      setAccio(null);
    } catch (e) {
      setErrorAccio(e instanceof ApiError ? e.message : "No s'ha pogut fer l'acció. Torna-ho a provar.");
    } finally {
      setEnviant(false);
    }
  }

  const base = `/entitat/${entitat.id}`;
  const tornada = esAdmin ? `${base}/interprets` : base;

  if (estat.tipus !== "ok" || !plantilla.dades) {
    const error = estat.tipus === "error" || (estat.tipus !== "no_disponible" && plantilla.error);
    return (
      <div className="perfil-detall">
        <Capcalera entitat={entitat} seccio="Intèrprets" mostraInvitacions={false} />
        <main className="perfil-detall__targeta">
          <BotoEnrere to={tornada} />
          {estat.tipus === "no_disponible" ? (
            <p className="perfil-detall__missatge">Aquest perfil no existeix o no el pots veure.</p>
          ) : error ? (
            <p className="perfil-detall__missatge" role="alert">No s'ha pogut carregar el perfil.</p>
          ) : (
            <p className="perfil-detall__missatge">Carregant…</p>
          )}
        </main>
      </div>
    );
  }

  const { perfil } = estat;
  const atributs = plantilla.dades;
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
            <Link className="perfil-detall__boto" to={`${base}/perfils/${perfil.id}/editar`} state={{ perfil }}>
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
        onEnviada={(nou) => setEstat({ tipus: "ok", perfil: nou })}
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
