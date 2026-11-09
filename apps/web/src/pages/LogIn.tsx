// Page del login i registre d'usuaris.

import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import "./LogIn.css";

export default function LogIn() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "registre">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/inici" replace />;

  // Funció que s'executa quan l'usuari envia el formulari.
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    // Crida a Supabase per iniciar sessió o registrar-se.
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Correu o contrasenya incorrectes");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/inici` },
      });
      if (error) setError(error.message);
      else if (!data.session) setInfo("Revisa el correu per confirmar el compte.");
    }

    setSubmitting(false);
  }

  // Funció que canvia entre mode login i registre.
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
            minLength={8}
          />
          {mode === "registre" && (
            <p className="login__hint">Mínim 8 caràcters.</p>
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