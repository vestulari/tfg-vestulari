// Canvi de contrasenya de l'usuari.

import { supabase } from "../lib/supabase";

export type ResultatCanvi = { ok: true } | { ok: false; error: string };

// Canvia la contrasenya. Abans comprova l'actual tornant a iniciar sessió amb ella.
// La contrasenya no passa per l'API: la gestiona Supabase Auth, que també en valida la força.
export async function canviaContrasenya(
  email: string,
  actual: string,
  nova: string
): Promise<ResultatCanvi> {
  const { error: errActual } = await supabase.auth.signInWithPassword({
    email,
    password: actual,
  });
  if (errActual) return { ok: false, error: "La contrasenya actual no és correcta." };

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, error: "La nova contrasenya ha de ser diferent de l'actual." };
    }
    if (error.code === "weak_password") {
      return { ok: false, error: "La nova contrasenya no compleix els requisits de seguretat." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}