// Constants compartides entre el frontend i l'API.

import type { Genere, TipusAtribut, TipusImatge } from './dto'

// Atributs que tots els perfils tenen sempre i que no es poden tocar.
export const ATRIBUTS_BASICS = ['Nom', 'Edat', 'Gènere'] as const

// Gèneres que pot tenir un perfil, amb el text que es mostra
export const GENERES: { valor: Genere; etiqueta: string }[] = [
  { valor: 'masculi', etiqueta: 'Masculí' },
  { valor: 'femeni', etiqueta: 'Femení' },
  { valor: 'altres', etiqueta: 'Altres' },
]

// Tipus que pot tenir un atribut de la plantilla, amb el text que es mostra
export const TIPUS_ATRIBUT: { valor: TipusAtribut; etiqueta: string }[] = [
  { valor: 'string', etiqueta: 'Text' },
  { valor: 'integer', etiqueta: 'Número' },
]
// ---------- Imatges ----------
// Formats d'imatge acceptats
export const IMATGE_TIPUS = ['image/jpeg', 'image/png', 'image/webp'] as const

// Mida màxima de la foto original que tria l'usuari (abans de comprimir-la al navegador)
export const IMATGE_ORIGINAL_MAX = 20 * 1024 * 1024

// Com es comprimeix cada tipus d'imatge abans de pujar-la (de menys a més important):
// costatMax és el costat més llarg en píxels, qualitat va de 0 a 1 (WebP), i midaMax és el que accepta l'API.
// El vestuari és el més important: prou resolució i qualitat per veure-hi el teixit i els detalls.
export const IMATGE_PERFILS: Record<TipusImatge, { costatMax: number; qualitat: number; midaMax: number }> = {
  usuari: { costatMax: 512, qualitat: 0.75, midaMax: 200 * 1024 },
  entitat: { costatMax: 1024, qualitat: 0.8, midaMax: 1024 * 1024 },
  vestuari: { costatMax: 2048, qualitat: 0.9, midaMax: 2 * 1024 * 1024 },
}
