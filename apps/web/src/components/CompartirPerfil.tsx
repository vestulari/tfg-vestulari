// Finestra per compartir un perfil: s'hi escriu el correu de qui el tindrà, i l'API diu
// si aquest correu té compte a Vestulari i si s'ha enviat la invitació.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CORREU_MAX, errorCorreu, type ComparticioDto } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { perfilApi } from "../adapters/api/PerfilApi";
import "./Formulari.css";
import "./Confirmacio.css";
import "./CompartirPerfil.css";

type Props = {
  obert: boolean;
  entitatId: number;
  perfil: { id: number; nom: string };
  onTanca: () => void;
  // Es crida quan s'ha enviat la invitació, perquè la pantalla es torni a carregar
  onEnviada: () => void;
};

// Si el correu no té compte, la finestra es queda oberta per provar-ne un altre.
// Si s'envia, mostra el missatge i només deixa tancar.
export default function CompartirPerfil({ obert, entitatId, perfil, onTanca, onEnviada }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [correu, setCorreu] = useState("");
  const [enviant, setEnviant] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resposta, setResposta] = useState<ComparticioDto | null>(null);

  // Obre i tanca el <dialog>, i en obrir-lo comença de zero
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (obert && !d.open) {
      setCorreu("");
      setError(null);
      setResposta(null);
      d.showModal();
    }
    if (!obert && d.open) d.close();
  }, [obert]);

  // Comprova el correu i envia la invitació
  async function envia(e: FormEvent) {
    e.preventDefault();
    const err = errorCorreu(correu);
    if (err) {
      setError(err);
      return;
    }

    setEnviant(true);
    setError(null);
    setResposta(null);
    try {
      const r = await perfilApi.comparteix(entitatId, perfil.id, correu.trim());
      setResposta(r);
      if (r.enviada) onEnviada();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No s'ha pogut enviar la invitació. Torna-ho a provar.");
    } finally {
      setEnviant(false);
    }
  }

  const enviada = resposta?.enviada === true;

  return (
    <dialog
      ref={ref}
      className="confirmacio"
      aria-labelledby={`${id}-titol`}
      onCancel={(e) => {
        e.preventDefault();
        if (!enviant) onTanca();
      }}
    >
      <h2 id={`${id}-titol`} className="confirmacio__titol">Compartir «{perfil.nom}»</h2>

      <form className="compartir" onSubmit={envia} noValidate>
        <p className="confirmacio__missatge">
          Escriu el correu de la persona que tindrà aquest perfil. Si té compte a Vestulari, li
          arribarà una invitació per unir-se a l'entitat.
        </p>

        <label className="formulari__etiqueta" htmlFor={`${id}-correu`}>Correu electrònic</label>
        <input
          id={`${id}-correu`}
          className="formulari__input"
          type="email"
          autoComplete="off"
          maxLength={CORREU_MAX}
          value={correu}
          disabled={enviada}
          onChange={(e) => {
            setCorreu(e.target.value);
            setError(null);
            setResposta(null);
          }}
        />

        {error && <p className="formulari__error" role="alert">{error}</p>}
        {resposta && (
          <p
            className={`compartir__resposta${enviada ? " compartir__resposta--ok" : ""}`}
            role="status"
          >
            {resposta.missatge}
          </p>
        )}

        <div className="confirmacio__accions">
          <button
            type="button"
            className="confirmacio__boto confirmacio__boto--cancela"
            onClick={onTanca}
            disabled={enviant}
          >
            {enviada ? "Tancar" : "Cancel·lar"}
          </button>
          {!enviada && (
            <button
              type="submit"
              className="confirmacio__boto confirmacio__boto--accepta"
              disabled={enviant}
            >
              {enviant ? "Un moment…" : "Enviar invitació"}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
