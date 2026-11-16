// Pantalla del compte: canviar la foto, el nom d'usuari i la contrasenya, i tancar la sessió.

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../adapters/api/ApiClient";
import { usuariApi } from "../adapters/api/UsuariApi";
import { useAuth, useTancaSessio } from "../auth/AuthProvider";
import { useUsuari } from "../auth/UsuariProvider";
import { canviaContrasenya } from "../auth/CanviaContrasenya";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import RequisitsContrasenya from "../components/RequisitsContrasenya";
import UsuariAvatar from "../components/UsuariAvatar";
import { contrasenyaValida } from "../lib/contrasenya";
import { comprimeix } from "../lib/imatges";
import { useTornada } from "../lib/tornada";
import { IMATGE_TIPUS, NOM_MAX, errorNom } from "@tfg-vestulari/shared";
import "./Compte.css";

// L'usuari és el mateix que el de la capçalera: en desar el nom o la foto, s'actualitza a tot arreu.
// La foto es comprimeix i es puja tot just triar-la (no hi ha botó de desar).
// Els comptes que només entren amb Google no tenen contrasenya pròpia, i no en veuen la part.
// La fletxa d'enrere torna a la pantalla des d'on s'ha obert el compte.
export default function Compte() {
  const { user } = useAuth();
  const tancaSessio = useTancaSessio();
  const { usuari, error: errorCarrega, estableix } = useUsuari();
  const tornada = useTornada();

  // Foto
  const [desantFoto, setDesantFoto] = useState<"comprimint" | "pujant" | "traient" | null>(null);
  const [okFoto, setOkFoto] = useState<string | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  // Nom
  const [nom, setNom] = useState(usuari?.nom ?? "");
  const [desantNom, setDesantNom] = useState(false);
  const [okNom, setOkNom] = useState(false);
  const [errorDesarNom, setErrorDesarNom] = useState<string | null>(null);

  // Contrasenya
  const [actual, setActual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacio, setConfirmacio] = useState("");
  const [canviant, setCanviant] = useState(false);
  const [okContrasenya, setOkContrasenya] = useState(false);
  const [errorContrasenya, setErrorContrasenya] = useState<string | null>(null);

  // Si l'usuari encara no havia arribat en muntar la pantalla, omplim el camp quan arriba
  const idUsuari = usuari?.id;
  useEffect(() => {
    if (usuari) setNom(usuari.nom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuari]);

  const email = user?.email ?? usuari?.email ?? "";
  const teContrasenya = user?.identities?.some((i) => i.provider === "email") ?? true;

  // ----- Foto -----
  // Comprimeix la foto triada i la puja
  async function canviaFoto(fitxer: File | undefined) {
    if (!fitxer || desantFoto) return;
    setOkFoto(null);
    setErrorFoto(null);

    setDesantFoto("comprimint");
    const r = await comprimeix(fitxer, "usuari");
    if (!r.ok) {
      setErrorFoto(r.error);
      setDesantFoto(null);
      return;
    }

    setDesantFoto("pujant");
    try {
      estableix(await usuariApi.canviaImatge(r.fitxer));
      setOkFoto("Foto actualitzada.");
    } catch (err) {
      setErrorFoto(err instanceof ApiError ? err.message : "No s'ha pogut pujar la foto.");
    } finally {
      setDesantFoto(null);
    }
  }

  // Treu la foto: es tornarà a veure la inicial
  async function treuFoto() {
    if (desantFoto) return;
    setOkFoto(null);
    setErrorFoto(null);
    setDesantFoto("traient");
    try {
      estableix(await usuariApi.treuImatge());
      setOkFoto("Foto treta.");
    } catch (err) {
      setErrorFoto(err instanceof ApiError ? err.message : "No s'ha pogut treure la foto.");
    } finally {
      setDesantFoto(null);
    }
  }

  // ----- Nom -----
  const errNom = errorNom(nom);
  const nomCanviat = usuari !== null && nom !== usuari.nom;
  const potDesarNom = nomCanviat && errNom === null && !desantNom;

  // Desa el nom nou
  async function desaNom(e: FormEvent) {
    e.preventDefault();
    setOkNom(false);
    setErrorDesarNom(null);
    if (!potDesarNom) return;

    setDesantNom(true);
    try {
      const actualitzat = await usuariApi.canviaNom(nom);
      estableix(actualitzat);
      setNom(actualitzat.nom);
      setOkNom(true);
    } catch (err) {
      setErrorDesarNom(err instanceof ApiError ? err.message : "No s'ha pogut desar el nom.");
    } finally {
      setDesantNom(false);
    }
  }

  // ----- Contrasenya -----
  const novaValida = contrasenyaValida(nova);
  const coincideix = nova === confirmacio;
  const igualQueActual = nova.length > 0 && nova === actual;
  const potCanviar =
    actual.length > 0 && novaValida && coincideix && !igualQueActual && !canviant;

  // Canvia la contrasenya i, si va bé, buida els camps
  async function canviaContra(e: FormEvent) {
    e.preventDefault();
    setOkContrasenya(false);
    setErrorContrasenya(null);
    if (!potCanviar) return;

    setCanviant(true);
    const r = await canviaContrasenya(email, actual, nova);
    setCanviant(false);

    if (r.ok) {
      setActual("");
      setNova("");
      setConfirmacio("");
      setOkContrasenya(true);
    } else {
      setErrorContrasenya(r.error);
    }
  }

  return (
    <div className="compte">
      <Capcalera titol="El meu compte" />

      <div className="compte__barra">
        <BotoEnrere to={tornada} />
      </div>

      <main className="compte__targeta">
        {errorCarrega && (
          <p className="compte__missatge" role="alert">
            No s'han pogut carregar les dades del compte.
          </p>
        )}
        {!errorCarrega && usuari === null && <p className="compte__missatge">Carregant…</p>}

        {usuari && (
          <>
            <section className="compte__seccio" aria-labelledby="titol-perfil">
              <h2 id="titol-perfil" className="compte__titol">Perfil</h2>

              <UsuariAvatar nom={usuari.nom} url={usuari.imatgeUrl} className="compte__avatar" />
              <div className="compte__foto-accions">
                <label className={`compte__boto-foto${desantFoto ? " compte__boto-foto--desactivat" : ""}`}>
                  <input
                    className="compte__fitxer"
                    type="file"
                    accept={IMATGE_TIPUS.join(",")}
                    disabled={desantFoto !== null}
                    onChange={(e) => {
                      void canviaFoto(e.target.files?.[0]);
                      e.target.value = ""; // perquè es pugui tornar a triar el mateix fitxer
                    }}
                  />
                  {desantFoto === "comprimint"
                    ? "Preparant la foto…"
                    : desantFoto === "pujant"
                      ? "Pujant…"
                      : usuari.imatgeUrl
                        ? "Canviar la foto"
                        : "Afegir una foto"}
                </label>
                {usuari.imatgeUrl && (
                  <button
                    type="button"
                    className="compte__boto-foto"
                    disabled={desantFoto !== null}
                    onClick={treuFoto}
                  >
                    {desantFoto === "traient" ? "Traient…" : "Treure la foto"}
                  </button>
                )}
              </div>
              {errorFoto && <p className="compte__error" role="alert">{errorFoto}</p>}
              {okFoto && <p className="compte__ok" role="status">{okFoto}</p>}
              <p className="compte__correu">{email}</p>

              <form className="compte__form" onSubmit={desaNom} noValidate>
                <label className="compte__etiqueta" htmlFor="nom">Nom d'usuari</label>
                <input
                  id="nom"
                  className="compte__input"
                  type="text"
                  autoComplete="nickname"
                  value={nom}
                  maxLength={NOM_MAX}
                  onChange={(e) => {
                    setNom(e.target.value);
                    setOkNom(false);
                  }}
                />
                {nomCanviat && errNom && (
                  <p className="compte__error" role="alert">{errNom}</p>
                )}
                {errorDesarNom && <p className="compte__error" role="alert">{errorDesarNom}</p>}
                {okNom && <p className="compte__ok" role="status">Nom actualitzat.</p>}
                <button
                  type="submit"
                  className="compte__boto compte__boto--principal"
                  disabled={!potDesarNom}
                >
                  {desantNom ? "Desant…" : "Desar el nom"}
                </button>
              </form>
            </section>

            {teContrasenya && (
              <section className="compte__seccio" aria-labelledby="titol-contrasenya">
                <h2 id="titol-contrasenya" className="compte__titol">Contrasenya</h2>

                <form className="compte__form" onSubmit={canviaContra} noValidate>
                  <label className="compte__etiqueta" htmlFor="actual">Contrasenya actual</label>
                  <input
                    id="actual"
                    className="compte__input"
                    type="password"
                    autoComplete="current-password"
                    value={actual}
                    onChange={(e) => {
                      setActual(e.target.value);
                      setOkContrasenya(false);
                    }}
                  />

                  <label className="compte__etiqueta" htmlFor="nova">Nova contrasenya</label>
                  <input
                    id="nova"
                    className="compte__input"
                    type="password"
                    autoComplete="new-password"
                    value={nova}
                    onChange={(e) => {
                      setNova(e.target.value);
                      setOkContrasenya(false);
                    }}
                  />
                  <RequisitsContrasenya contrasenya={nova} />

                  <label className="compte__etiqueta" htmlFor="confirmacio">
                    Repeteix la nova contrasenya
                  </label>
                  <input
                    id="confirmacio"
                    className="compte__input"
                    type="password"
                    autoComplete="new-password"
                    value={confirmacio}
                    onChange={(e) => {
                      setConfirmacio(e.target.value);
                      setOkContrasenya(false);
                    }}
                  />

                  {confirmacio.length > 0 && !coincideix && (
                    <p className="compte__error" role="alert">Les contrasenyes no coincideixen.</p>
                  )}
                  {igualQueActual && (
                    <p className="compte__error" role="alert">
                      La nova contrasenya ha de ser diferent de l'actual.
                    </p>
                  )}
                  {errorContrasenya && (
                    <p className="compte__error" role="alert">{errorContrasenya}</p>
                  )}
                  {okContrasenya && (
                    <p className="compte__ok" role="status">Contrasenya actualitzada.</p>
                  )}

                  <button
                    type="submit"
                    className="compte__boto compte__boto--principal"
                    disabled={!potCanviar}
                  >
                    {canviant ? "Canviant…" : "Canviar la contrasenya"}
                  </button>
                </form>
              </section>
            )}

            <section
              className="compte__seccio compte__seccio--sessio"
              aria-labelledby="titol-sessio"
            >
              <h2 id="titol-sessio" className="compte__titol">Sessió</h2>
              <button
                type="button"
                className="compte__boto compte__boto--sortir"
                onClick={tancaSessio}
              >
                Tancar sessió
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}