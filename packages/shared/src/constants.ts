import type { Genere, TipusAtribut } from './dto'

/** Atributs que tots els perfils tenen sempre i que no es poden tocar. */
export const ATRIBUTS_BASICS = ['Nom', 'Edat', 'Gènere'] as const

export const GENERES: { valor: Genere; etiqueta: string }[] = [
  { valor: 'masculi', etiqueta: 'Masculí' },
  { valor: 'femeni', etiqueta: 'Femení' },
  { valor: 'altres', etiqueta: 'Altres' },
]

export const TIPUS_ATRIBUT: { valor: TipusAtribut; etiqueta: string }[] = [
  { valor: 'string', etiqueta: 'Text' },
  { valor: 'integer', etiqueta: 'Número' },
]