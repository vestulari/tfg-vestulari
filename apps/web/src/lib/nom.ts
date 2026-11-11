export const NOM_MIN = 1;
export const NOM_MAX = 40;

// Retorna el missatge d'error, o null si el nom és vàlid.
export function errorNom(nom: string): string | null {
  const longitud = Array.from(nom).length;
  if (longitud < NOM_MIN) return "El nom d'usuari és obligatori.";
  if (longitud > NOM_MAX) return `El nom no pot tenir més de ${NOM_MAX} caràcters.`;
  if (nom !== nom.trimEnd()) return "El nom no pot acabar amb un espai.";
  if (nom !== nom.trimStart()) return "El nom no pot començar amb un espai.";
  return null;
}