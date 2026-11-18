// Fàbrica dels tipus de peça inicials que es creen amb cada entitat nova (patró fàbrica).
// Només diu com és cada tipus: guardar-lo a la BD ho fa tipusPecaRepository.

import type { TipusAtributPeca } from '@tfg-vestulari/shared'

export type TipusPecaInicial = 'Camisa' | 'Samarreta' | 'Faldilla' | 'Pantaló'

// Un tipus de peça encara sense guardar
export type TipusPecaNou = { nom: string; atributs: { nom: string; tipus: TipusAtributPeca }[] }

// Els atributs que tenen totes les peces de roba
const atributsBasics = (): TipusPecaNou['atributs'] => [
  { nom: 'Color', tipus: 'color' },
  { nom: 'Talla', tipus: 'string' },
]

// Una funció creadora per cada tipus. Si algun tipus ha de tenir atributs propis, s'afegeixen aquí.
const creadores: Record<TipusPecaInicial, () => TipusPecaNou> = {
  Camisa: () => ({ nom: 'Camisa', atributs: atributsBasics() }),
  Samarreta: () => ({ nom: 'Samarreta', atributs: atributsBasics() }),
  Faldilla: () => ({ nom: 'Faldilla', atributs: atributsBasics() }),
  Pantaló: () => ({ nom: 'Pantaló', atributs: atributsBasics() }),
}

// Fabrica un tipus de peça inicial
export function fabricaTipusPeca(tipus: TipusPecaInicial): TipusPecaNou {
  return creadores[tipus]()
}

// Fabrica tots els tipus de peça inicials, per crear-los amb l'entitat
export function tipusPecaInicials(): TipusPecaNou[] {
  return (Object.keys(creadores) as TipusPecaInicial[]).map(fabricaTipusPeca)
}
