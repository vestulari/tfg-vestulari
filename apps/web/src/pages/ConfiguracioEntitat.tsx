// Configuració d'una entitat: canviar-ne les dades, passar el rol de creador, eliminar-la o sortir-ne.
// Cada usuari només hi veu el que el seu rol li deixa fer (l'API també ho comprova).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdministradorDto, EntitatDetallDto, EntitatEditadaDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import Confirmacio from "../components/Confirmacio";
import Desplegable from "../components/Desplegable";
import EntitatForm, { aEnter, type DadesEntitat } from "../components/EntitatForm";
import { useActualitzaEntitat, useEntitat } from "../context/EntitatContext";
import "../components/Formulari.css";
import "./ConfiguracioEntitat.css";

type Accio = "desa" | "creador" | "elimina" | "surt";

// Passa l'entitat al format del formulari (els números com a text)
function aDades(e: EntitatDetallDto): DadesEntitat {
  return {
    nom: e.nom,
    descripcio: e.descripcio ?? "",
    any: String(e.anyCreacio),
    mes: e.mesCreacio === null ? "" : String(e.mesCreacio),
    dia: e.diaCreacio === null ? "" : String(e.diaCreacio),
  };
}

// Passa el formulari al format de l'API
function aDto(d: DadesEntitat): EntitatEditadaDto {
  return {
    nom: d.nom,
    descripcio: d.descripcio.trim(),
    anyCreacio: Number(d.any),
    mesCreacio: aEnter(d.mes),
    diaCreacio: aEnter(d.dia),
  };
}

// Com es veu un administrador al desplegable
const nomAdministrador = (a: AdministradorDto) => `${a.perfilNom} (${a.usuariNom})`;

// Els administradors poden canviar les dades. El creador, a més, pot passar el rol i eliminar l'entitat.
// Tothom menys el creador pot sortir-ne. Totes les accions es confirmen abans de fer-les.
export default function ConfiguracioEntitat() {
  const entitat = useEntitat();
  const actualitzaEntitat = useActualitzaEntitat();
  const navigate = useNavigate();
  const { esAdministrador, esCreador } = entitat.perfil;

  const [dades, setDades] = useState<DadesEntitat>(() => aDades(entitat));
  const [errorDades, setErrorDades] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);

  const [administradors, setAdministradors] = useState<AdministradorDto[] | null>(null);
  const [nouCreador, setNouCreador] = useState("");

  const [accio, setAccio] = useState<Accio | null>(null);
  const [enviant, setEnviant] = useState(false);
  const [errorAccio, setErrorAccio] = useState<string | null>(null);

  // Només el creador necessita la llista d'administradors, per passar-los el rol
  useEffect(() => {
    if (!esCreador) return;
    let cancelat = false;
    entitatApi
      .administradors(entitat.id)
      .then((llista) => {
        if (!cancelat) setAdministradors(llista);
      })
      .catch(() => {
        if (!cancelat) setAdministradors([]);
      });
    return () => {
      cancelat = true;
    };
  }, [esCreador, entitat.id]);

  const triat = administradors?.find((a) => String(a.perfilId) === nouCreador);

  // Obre la finestra de confirmació d'una acció
  function demana(a: Accio) {
    setErrorAccio(null);
    setAvis(null);
    setAccio(a);
  }

  // Abans de confirmar el desat, mira que hi hagi algun canvi
  function confirmaDades() {
    if (JSON.stringify(aDto(dades)) === JSON.stringify(aDto(aDades(entitat)))) {
      setErrorDades("No has canviat res.");
      return;
    }
    demana("desa");
  }

  // Fa l'acció que s'ha confirmat
  async function executa() {
    if (!accio) return;
    setEnviant(true);
    setErrorAccio(null);
    try {
      if (accio === "desa") {
        const nova = await entitatApi.edita(entitat.id, aDto(dades));
        actualitzaEntitat(nova);
        setDades(aDades(nova));
        setAvis("S'han desat els canvis.");
      } else if (accio === "creador" && triat) {
        await entitatApi.passaCreador(entitat.id, triat.perfilId);
        actualitzaEntitat({ ...entitat, perfil: { ...entitat.perfil, esCreador: false } });
        setAvis(`Ara ${nomAdministrador(triat)} és el creador de l'entitat.`);
      } else if (accio === "elimina") {
        await entitatApi.elimina(entitat.id);
        navigate("/inici", { replace: true });
        return;
      } else if (accio === "surt") {
        await entitatApi.surt(entitat.id);
        navigate("/inici", { replace: true });
        return;
      }
      setAccio(null);
    } catch (e) {
      setErrorAccio(e instanceof ApiError ? e.message : "No s'ha pogut fer l'acció. Torna-ho a provar.");
    } finally {
      setEnviant(false);
    }
  }

  // Textos de la finestra de confirmació de cada acció
  const confirmacions: Record<Accio, { titol: string; missatge: string; boto: string; perillosa: boolean }> = {
    desa: {
      titol: "Vols desar els canvis?",
      missatge: `Tots els membres de l'entitat veuran el nou nom, la data i la descripció de «${dades.nom}».`,
      boto: "Desar canvis",
      perillosa: false,
    },
    creador: {
      titol: "Vols passar el rol de creador?",
      missatge: triat
        ? `${nomAdministrador(triat)} passarà a ser el creador de «${entitat.nom}». Tu continuaràs sent administrador, però ja no podràs eliminar l'entitat ni tornar a passar el rol.`
        : "",
      boto: "Passar el rol",
      perillosa: true,
    },
    elimina: {
      titol: `Vols eliminar «${entitat.nom}»?`,
      missatge:
        "S'esborraran per sempre els perfils, el vestuari, els espectacles i les invitacions de l'entitat, i ningú més hi podrà entrar. Aquesta acció no es pot desfer.",
      boto: "Eliminar l'entitat",
      perillosa: true,
    },
    surt: {
      titol: `Vols sortir de «${entitat.nom}»?`,
      missatge:
        "Deixaràs de tenir-hi accés i el teu perfil quedarà lliure. Per tornar-hi, un administrador t'hi haurà de tornar a convidar.",
      boto: "Sortir de l'entitat",
      perillosa: true,
    },
  };
  const c = accio ? confirmacions[accio] : null;

  return (
    <div className="pantalla">
      <Capcalera entitat={entitat} mostraInvitacions={false} />

      <div className="pantalla__barra">
        <BotoEnrere to={`/entitat/${entitat.id}`} />
      </div>

      <main className="pantalla__contingut configuracio">
        <h1 className="configuracio__titol">Configuració</h1>

        {avis && <p className="configuracio__avis" role="status">{avis}</p>}

        {esAdministrador && (
          <section className="configuracio__seccio" aria-labelledby="titol-dades">
            <h2 id="titol-dades" className="configuracio__subtitol">Dades de l'entitat</h2>
            <EntitatForm
              dades={dades}
              onCanvi={(parcial) => {
                setDades((d) => ({ ...d, ...parcial }));
                setErrorDades(null);
              }}
              onConfirma={confirmaDades}
              textBoto="Desar canvis"
              errorServidor={errorDades}
            />
          </section>
        )}

        <section className="configuracio__seccio" aria-labelledby="titol-accions">
          <h2 id="titol-accions" className="configuracio__subtitol">
            {esCreador ? "Zona perillosa" : "La meva participació"}
          </h2>

          {esCreador && (
            <div className="configuracio__accio">
              <div className="configuracio__explicacio">
                <h3>Passar el rol de creador</h3>
                <p>
                  El nou creador ha de ser un altre administrador de l'entitat. Tu continuaràs sent
                  administrador.
                </p>
              </div>
              {administradors === null ? (
                <p className="configuracio__nota">Carregant els administradors…</p>
              ) : administradors.length === 0 ? (
                <p className="configuracio__nota">
                  No hi ha cap altre administrador. Perquè algú pugui ser el creador, primer ha de
                  ser administrador de l'entitat.
                </p>
              ) : (
                <div className="configuracio__control">
                  <Desplegable
                    id="nou-creador"
                    className="configuracio__desplegable"
                    valor={nouCreador}
                    opcions={administradors.map((a) => ({
                      valor: String(a.perfilId),
                      etiqueta: nomAdministrador(a),
                    }))}
                    placeholder="Tria un administrador…"
                    onCanvi={setNouCreador}
                  />
                  <button
                    type="button"
                    className="configuracio__boto configuracio__boto--avis"
                    disabled={!triat}
                    onClick={() => demana("creador")}
                  >
                    Passar el rol
                  </button>
                </div>
              )}
            </div>
          )}

          {esCreador && (
            <div className="configuracio__accio">
              <div className="configuracio__explicacio">
                <h3>Eliminar l'entitat</h3>
                <p>S'esborra l'entitat i tot el que hi ha a dins. No es pot desfer.</p>
              </div>
              <button
                type="button"
                className="configuracio__boto configuracio__boto--perill"
                onClick={() => demana("elimina")}
              >
                Eliminar l'entitat
              </button>
            </div>
          )}

          <div className="configuracio__accio">
            <div className="configuracio__explicacio">
              <h3>Sortir de l'entitat</h3>
              <p>
                {esCreador
                  ? "Com a creador no pots sortir de l'entitat. Primer passa el rol de creador a un altre administrador."
                  : "Deixaràs de formar part de l'entitat i el teu perfil quedarà lliure."}
              </p>
            </div>
            <button
              type="button"
              className="configuracio__boto configuracio__boto--sortir"
              disabled={esCreador}
              onClick={() => demana("surt")}
            >
              Sortir de l'entitat
            </button>
          </div>
        </section>
      </main>

      <Confirmacio
        obert={c !== null}
        titol={c?.titol ?? ""}
        missatge={c?.missatge ?? ""}
        textAccepta={c?.boto ?? ""}
        perillosa={c?.perillosa}
        enviant={enviant}
        error={errorAccio}
        onAccepta={executa}
        onCancela={() => setAccio(null)}
      />
    </div>
  );
}
