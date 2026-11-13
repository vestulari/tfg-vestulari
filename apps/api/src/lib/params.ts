// Ajudes per llegir els paràmetres de les rutes.

// Llegeix un identificador numèric de la URL. Retorna null si no és un enter positiu.
export function llegeixId(valor: string): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : null
}
