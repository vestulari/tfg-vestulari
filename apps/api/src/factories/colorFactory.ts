// Fàbrica de la paleta de colors inicial del vestuari de tota entitat nova (patró fàbrica).
// Només diu quins colors són: guardar-los a la BD ho fa colorRepository.

export type ColorNou = { nom: string; hex: string }

// Els colors per defecte, amb el seu codi #RRGGBB en majúscules
const INICIALS: ColorNou[] = [
  { nom: 'Blanc', hex: '#FFFFFF' },
  { nom: 'Negre', hex: '#000000' },
  { nom: 'Gris', hex: '#8C8C8C' },
  { nom: 'Vermell', hex: '#D32F2F' },
  { nom: 'Granat', hex: '#7B1E2B' },
  { nom: 'Rosa', hex: '#F4A6C6' },
  { nom: 'Taronja', hex: '#F57C00' },
  { nom: 'Groc', hex: '#FBC02D' },
  { nom: 'Verd', hex: '#2E9E44' },
  { nom: 'Blau', hex: '#1E6FD9' },
  { nom: 'Blau marí', hex: '#1A2A57' },
  { nom: 'Lila', hex: '#9C6ADE' },
  { nom: 'Marró', hex: '#7A4E2D' },
  { nom: 'Beix', hex: '#E3D2B4' },
  { nom: 'Daurat', hex: '#C9A227' },
  { nom: 'Platejat', hex: '#C0C0C0' },
]

// Fabrica la paleta inicial (una còpia nova cada cop, perquè ningú no modifiqui la de referència)
export function colorsInicials(): ColorNou[] {
  return INICIALS.map((c) => ({ ...c }))
}
