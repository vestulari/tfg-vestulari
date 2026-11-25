// Per escriure les dates com les llegeix una persona.

const MESOS = [
  'gener', 'febrer', 'març', 'abril', 'maig', 'juny',
  'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre',
]

// "de març" o "d'abril": davant de vocal, la preposició s'apostrofa
const deMes = (mes: number) => {
  const nom = MESOS[mes - 1]
  return /^[aeiou]/.test(nom) ? `d'${nom}` : `de ${nom}`
}

// El text de l'estrena d'un espectacle, tan complet com la data que s'hagi posat:
// "Estrenat el 12 de març de 2024", "Estrenat el març de 2024" o "Estrenat l'any 2024"
export function textEstrena(any: number, mes: number | null, dia: number | null): string {
  if (mes === null) return `Estrenat l'any ${any}`
  if (dia === null) return `Estrenat ${/^[aeiou]/.test(MESOS[mes - 1]) ? "l'" : 'el '}${MESOS[mes - 1]} de ${any}`
  // L'1 i l'11 s'apostrofen ("l'1 d'octubre"), la resta no ("el 12 de març")
  const article = dia === 1 || dia === 11 ? "l'" : 'el '
  return `Estrenat ${article}${dia} ${deMes(mes)} de ${any}`
}

// Passa una data AAAA-MM-DD (com les retorna l'API) a DD/MM/AAAA
export function dataCurta(data: string): string {
  const [any, mes, dia] = data.split('-')
  return `${dia}/${mes}/${any}`
}
