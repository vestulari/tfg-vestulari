// Pantalla d'inici de sessió i de registre.

import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, type Location } from "react-router-dom";
import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { errorNom, NOM_MAX } from "@tfg-vestulari/shared";
import RequisitsContrasenya from "../components/RequisitsContrasenya";
import { LONGITUD_MINIMA, contrasenyaValida } from "../lib/contrasenya";
import "./LogIn.css";


// Tradueix els errors de Supabase Auth a missatges entenedors, tant del login com del registre.
// Si n'arriba un que no coneixem, el deixem a la consola i mostrem un missatge general.
function missatgeError(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) {
    return "No s'ha pogut connectar amb el servidor. Comprova la connexió a internet.";
  }

  switch (error.code) {
    case "invalid_credentials":
      return "El correu o la contrasenya no són correctes.";
    case "email_not_confirmed":
      return "Encara no has confirmat el correu. Revisa la safata d'entrada (i el correu brossa).";
    case "user_banned":
      return "Aquest compte està bloquejat.";
    case "user_already_exists":
    case "email_exists":
      return "Ja hi ha un compte amb aquest correu. Prova d'iniciar sessió.";
    case "weak_password":
      return "La contrasenya no compleix els requisits de seguretat.";
    case "email_address_invalid":
    case "validation_failed":
      return "El correu no és vàlid. Revisa que estigui ben escrit.";
    case "email_address_not_authorized":
      return "Ara mateix no podem enviar correus a aquesta adreça.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Ara mateix no es poden crear comptes nous.";
    case "over_email_send_rate_limit":
      return "S'han enviat massa correus. Espera una estona abans de tornar-ho a provar.";
    case "over_request_rate_limit":
      return "Massa intents. Torna-ho a provar d'aquí una estona.";
    case "request_timeout":
    case "hook_timeout":
    case "hook_timeout_after_retry":
      return "El servidor ha tardat massa a respondre. Torna-ho a provar.";
    default:
      console.error("Error d'autenticació", error);
      return "Hi ha hagut un error inesperat. Torna-ho a provar.";
  }
}

// Un cop hi ha sessió, torna a la pàgina on es volia anar (la guarda RequireAuth),
// i si no n'hi havia cap, a l'inici.
export default function LogIn() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "registre">("login");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();

  const from = (location.state as { from?: Location } | null)?.from;
  const desti =
    from && from.pathname !== "/login" ? `${from.pathname}${from.search}${from.hash}` : "/inici";

  if (!loading && session) return <Navigate to={desti} replace />;

  // Inicia sessió o crea el compte, segons el mode
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "login") {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(missatgeError(error));
      setSubmitting(false);
      return;
    }

    const errNom = errorNom(nom);
    if (errNom) {
      setError(errNom);
      return;
    }
    if (!contrasenyaValida(password)) {
      setError("La contrasenya no compleix tots els requisits.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nom },
        emailRedirectTo: `${window.location.origin}/inici`,
      },
    });
    if (error) setError(missatgeError(error));
    else if (!data.session) setInfo("Revisa el correu per confirmar el compte.");
    setSubmitting(false);
  }

  // Canvia entre iniciar sessió i registrar-se
  function canviaMode() {
    setMode(mode === "login" ? "registre" : "login");
    setError(null);
    setInfo(null);
  }

  return (
    <main className="login">
      <form className="login__card" onSubmit={onSubmit}>
        <h1 className="login__title">
          {mode === "login" ? "Inicia la sessió" : "Crea un compte"}
        </h1>

        {mode === "registre" && (
          <div className="login__field">
            <label className="login__label" htmlFor="nom">Nom d'usuari</label>
            <input
              id="nom"
              className="login__input"
              type="text"
              autoComplete="nickname"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              maxLength={NOM_MAX}
            />
          </div>
        )}

        <div className="login__field">
          <label className="login__label" htmlFor="email">Correu electrònic</label>
          <input
            id="email"
            className="login__input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login__field">
          <label className="login__label" htmlFor="password">Contrasenya</label>
          <input
            id="password"
            className="login__input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "registre" ? LONGITUD_MINIMA : undefined}
          />
          {mode === "registre" && <RequisitsContrasenya contrasenya={password} />}
        </div>

        {error && <p className="login__message login__message--error" role="alert">{error}</p>}
        {info && <p className="login__message login__message--info" role="status">{info}</p>}

        <button className="login__submit" type="submit" disabled={submitting}>
          {submitting ? "Un moment…" : mode === "login" ? "Entra" : "Crea el compte"}
        </button>

        <button className="login__switch" type="button" onClick={canviaMode}>
          {mode === "login" ? "No tens compte? Registra't" : "Ja tens compte? Entra"}
        </button>

        <Link className="login__back" to="/">← Torna a l'inici</Link>
      </form>
    </main>
  );
}