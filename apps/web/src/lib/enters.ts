// Deixa només dígits (i, si es permet, un signe menys al principi).
export function filtraEnter(valor: string, permetNegatiu = false): string {
  const net = valor.replace(/[^\d-]/g, "");
  const negatiu = permetNegatiu && net.startsWith("-");
  return (negatiu ? "-" : "") + net.replace(/-/g, "");
}