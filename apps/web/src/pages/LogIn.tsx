import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import type { AuthError } from "@supabase/supabase-js";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { NOM_MAX, errorNom } from "../lib/nom";
import { LONGITUD_MINIMA, contrasenyaValida, requisitsContrasenya} from "../lib/contrasenya";
import "./LogIn.css";

function missatgeError(error: AuthError): string {
  switch (error.code) {
    case "weak_password":
      return "La contrasenya no compleix els requisits de seguretat.";
    case "email_address_invalid":
      return "El correu no és vàlid.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Massa intents. Torna-ho a provar d'aquí una estona.";
    default:
      return error.message;
  }
}

export default function LogIn() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "registre">("login");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/inici" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "login") {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Correu o contrasenya incorrectes");
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
          {mode === "registre" && (
            <ul className="login__requisits">
              {requisitsContrasenya(password).map((r) => (
                <li
                  key={r.text}
                  className={`login__requisit${r.complert ? " login__requisit--ok" : ""}`}
                >
                  {r.text}
                </li>
              ))}
            </ul>
          )}
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