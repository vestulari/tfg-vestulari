// Validació contrasenya ==> Igual que les definides a Supabase Auth
export const LONGITUD_MINIMA = 8;

const SIMBOLS = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,.\/`~]/;

export type Requisit = { text: string; complert: boolean };

export function requisitsContrasenya(p: string): Requisit[] {
  return [
    { text: `Mínim ${LONGITUD_MINIMA} caràcters`, complert: p.length >= LONGITUD_MINIMA },
    { text: "Una majúscula", complert: /[A-Z]/.test(p) },
    { text: "Una minúscula", complert: /[a-z]/.test(p) },
    { text: "Un número", complert: /[0-9]/.test(p) },
    { text: "Un símbol (per exemple ! @ # $ %)", complert: SIMBOLS.test(p) },
  ];
}

export function contrasenyaValida(p: string): boolean {
  return requisitsContrasenya(p).every((r) => r.complert);
}