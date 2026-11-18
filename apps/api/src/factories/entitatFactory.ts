// Fàbrica d'una entitat nova (patró fàbrica): munta tot el que té una entitat quan neix, encara sense guardar.
// Aquí es decideix què porta una entitat nova; entitatRepository només ho guarda.

import type { EntitatNovaDto, Genere, ValorAtributDto } from '@tfg-vestulari/shared'
import { tipusPecaInicials, type TipusPecaNou } from './tipusPecaFactory'

// Tot el que es crea amb l'entitat. Els atributs bàsics del perfil (nom, edat i gènere) no hi són
// perquè són columnes del perfil: no cal crear-los.
export type EntitatNova = {
  entitat: {
    nom: string
    descripcio: string | null
    anyCreacio: number
    mesCreacio: number | null
    diaCreacio: number | null
  }
  // Els atributs extra de la plantilla de perfil que ha triat el creador
  atributsPerfil: EntitatNovaDto['atributs']
  perfilCreador: {
    nom: string
    edat: number
    genere: Genere
    esAdministrador: true
    esInterpret: boolean
    valors: ValorAtributDto[]
  }
  tipusPeca: TipusPecaNou[]
}

// Fabrica l'entitat nova a partir de les dades ja validades.
// El creador sempre és administrador, i tota entitat comença amb els tipus de peça inicials.
export function fabricaEntitat(d: EntitatNovaDto): EntitatNova {
  return {
    entitat: {
      nom: d.nom,
      descripcio: d.descripcio === '' ? null : d.descripcio,
      anyCreacio: d.anyCreacio,
      mesCreacio: d.mesCreacio,
      diaCreacio: d.diaCreacio,
    },
    atributsPerfil: d.atributs,
    perfilCreador: { ...d.perfil, esAdministrador: true },
    tipusPeca: tipusPecaInicials(),
  }
}
