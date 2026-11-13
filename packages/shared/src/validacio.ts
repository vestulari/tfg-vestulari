// Regles de validació compartides entre el frontend i l'API.
import { ATRIBUTS_BASICS, GENERES } from './constants'
import type {
  AtributNouDto,
  EntitatEditadaDto,
  EntitatNovaDto,
  PerfilNouDto,
  TipusAtribut,
} from './dto'

// ---------- Nom d'usuari ----------
export const NOM_MIN = 1
export const NOM_MAX = 40

// Retorna el missatge d'error, o null si el nom d'usuari és vàlid.
export function errorNom(nom: string): string | null {
  const longitud = Array.from(nom).length
  if (longitud < NOM_MIN) return "El nom d'usuari és obligatori."
  if (longitud > NOM_MAX) return `El nom no pot tenir més de ${NOM_MAX} caràcters.`
  if (nom !== nom.trim()) return 'El nom no pot començar ni acabar amb un espai.'
  return null
}

// ---------- Límits de la creació d'entitats ----------
export const ENTITAT_NOM_MAX = 60
export const DESCRIPCIO_MAX = 2000
export const PERFIL_NOM_MAX = 40
export const ATRIBUT_NOM_MAX = 30
export const ATRIBUTS_MAX = 20
export const VALOR_MAX = 200
export const EDAT_MIN = 0
export const EDAT_MAX = 120
export const ANY_MIN = 1000

// Llargada real d'un text (compta bé els accents i els emojis)
const longitud = (s: string) => Array.from(s).length
// Per comparar noms sense distingir majúscules ni accents
const clau = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

// Validació comuna dels noms: obligatori, sense passar del màxim i sense espais al principi ni al final
function errorNomText(
  nom: string,
  obligatori: string,
  nomComplet: string,
  max: number
): string | null {
  if (nom.trim() === '') return obligatori
  if (longitud(nom) > max) return `${nomComplet} no pot tenir més de ${max} caràcters.`
  if (nom !== nom.trim()) return `${nomComplet} no pot començar ni acabar amb un espai.`
  return null
}

// Validació dels noms de l'entitat, del perfil i dels atributs
export const errorNomEntitat = (nom: string) =>
  errorNomText(nom, "El nom de l'entitat és obligatori.", "El nom de l'entitat", ENTITAT_NOM_MAX)

export const errorNomPerfil = (nom: string) =>
  errorNomText(nom, 'El nom del perfil és obligatori.', 'El nom del perfil', PERFIL_NOM_MAX)

export const errorNomAtribut = (nom: string) =>
  errorNomText(nom, "El nom de l'atribut és obligatori.", "El nom de l'atribut", ATRIBUT_NOM_MAX)

// La descripció és opcional, però té un màxim
export function errorDescripcio(text: string): string | null {
  return longitud(text) > DESCRIPCIO_MAX
    ? `La descripció no pot tenir més de ${DESCRIPCIO_MAX} caràcters.`
    : null
}

// Només l'any és obligatori. El dia exigeix el mes.
export function errorDataCreacio(
  any: number | null,
  mes: number | null,
  dia: number | null,
  avui: Date = new Date()
): string | null {
  const anyActual = avui.getFullYear()
  if (any === null || !Number.isInteger(any)) return "L'any de creació és obligatori."
  if (any < ANY_MIN || any > anyActual) return `L'any ha d'estar entre ${ANY_MIN} i ${anyActual}.`

  if (mes === null) return dia === null ? null : 'Per indicar el dia cal indicar també el mes.'
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) return 'El mes ha de ser un número entre 1 i 12.'

  if (dia !== null) {
    if (!Number.isInteger(dia) || dia < 1) return 'El dia no és vàlid.'
    const diesDelMes = new Date(Date.UTC(any, mes, 0)).getUTCDate()
    if (dia > diesDelMes) return 'Aquest dia no existeix en aquest mes.'
  }

  const mesActual = avui.getMonth() + 1
  if (any === anyActual && mes > mesActual) return 'La data no pot ser futura.'
  if (any === anyActual && mes === mesActual && dia !== null && dia > avui.getDate()) {
    return 'La data no pot ser futura.'
  }
  return null
}

// L'edat és obligatòria i ha de ser un enter dins dels límits
export function errorEdat(edat: number | null): string | null {
  if (edat === null || !Number.isInteger(edat)) {
    return "L'edat és obligatòria i ha de ser un número enter."
  }
  if (edat < EDAT_MIN || edat > EDAT_MAX) {
    return `L'edat ha d'estar entre ${EDAT_MIN} i ${EDAT_MAX}.`
  }
  return null
}

// El gènere ha de ser un dels de GENERES
export function errorGenere(genere: string): string | null {
  return GENERES.some((g) => g.valor === genere) ? null : 'Cal triar un gènere.'
}

// Els valors dels atributs addicionals són opcionals.
export function errorValor(nomAtribut: string, tipus: TipusAtribut, valor: string): string | null {
  const v = valor.trim()
  if (v === '') return null
  if (longitud(v) > VALOR_MAX) {
    return `El valor de «${nomAtribut}» no pot tenir més de ${VALOR_MAX} caràcters.`
  }
  if (tipus === 'integer' && !/^-?\d{1,9}$/.test(v)) {
    return `«${nomAtribut}» ha de ser un número enter.`
  }
  return null
}

// Comprova els atributs de la plantilla: que no n'hi hagi massa, que els noms i els tipus
// siguin vàlids i que no se'n repeteixi cap (ni amb els bàsics, sense mirar majúscules ni accents)
export function errorAtributs(atributs: { nom: string; tipus: string }[]): string | null {
  if (atributs.length > ATRIBUTS_MAX) {
    return `No pots tenir més de ${ATRIBUTS_MAX} atributs addicionals.`
  }
  const vistos = new Set<string>(ATRIBUTS_BASICS.map(clau))
  for (const a of atributs) {
    const err = errorNomAtribut(a.nom)
    if (err) return err
    if (a.tipus !== 'string' && a.tipus !== 'integer') {
      return `Cal triar el tipus de l'atribut «${a.nom}».`
    }
    const k = clau(a.nom)
    if (vistos.has(k)) return `L'atribut «${a.nom}» ja existeix o és un atribut bàsic.`
    vistos.add(k)
  }
  return null
}

// Comprova el perfil i que els seus valors encaixin amb els atributs de la plantilla
export function errorPerfil(p: PerfilNouDto, atributs: AtributNouDto[]): string | null {
  const err = errorNomPerfil(p.nom) ?? errorEdat(p.edat) ?? errorGenere(p.genere)
  if (err) return err

  const vistos = new Set<string>()
  for (const v of p.valors) {
    const def = atributs.find((a) => a.nom === v.atribut)
    if (!def) return `L'atribut «${v.atribut}» no existeix.`
    if (vistos.has(v.atribut)) return `El valor de «${v.atribut}» està repetit.`
    vistos.add(v.atribut)
    const e = errorValor(def.nom, def.tipus, v.valor)
    if (e) return e
  }
  return null
}

// ---------- Validació completa del cos d'una petició (l'API no es fia del navegador) ----------
type Resultat<T> = { ok: true; dades: T } | { ok: false; error: string }

// Petites ajudes per validar el cos
const invalid = (error: string): { ok: false; error: string } => ({ ok: false, error })

const esObjecte = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// Retorna null si no hi és, el número si és un enter, o undefined si no és vàlid
function enterOpcional(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null
  return typeof v === 'number' && Number.isInteger(v) ? v : undefined
}

// Comprova el nom, la descripció i la data de creació de l'entitat.
// És el cos d'un PATCH /entitats/:id, i també la primera part del POST /entitats.
export function validaEntitatEditada(
  cos: unknown,
  avui: Date = new Date()
): Resultat<EntitatEditadaDto> {
  if (!esObjecte(cos)) return invalid('Dades no vàlides.')

  const nom = cos.nom
  const descripcio = cos.descripcio === undefined || cos.descripcio === null ? '' : cos.descripcio
  const anyCreacio = cos.anyCreacio
  const mes = enterOpcional(cos.mesCreacio)
  const dia = enterOpcional(cos.diaCreacio)

  if (typeof nom !== 'string') return invalid("Falta el nom de l'entitat.")
  if (typeof descripcio !== 'string') return invalid('La descripció no és vàlida.')
  if (typeof anyCreacio !== 'number') return invalid("Falta l'any de creació.")
  if (mes === undefined || dia === undefined) return invalid('La data de creació no és vàlida.')

  const error =
    errorNomEntitat(nom) ??
    errorDescripcio(descripcio) ??
    errorDataCreacio(anyCreacio, mes, dia, avui)
  if (error) return invalid(error)

  return {
    ok: true,
    dades: { nom, descripcio: descripcio.trim(), anyCreacio, mesCreacio: mes, diaCreacio: dia },
  }
}

// Comprova tot el cos d'un POST /entitats. Retorna les dades netes, o el primer error que troba.
export function validaEntitatNova(cos: unknown, avui: Date = new Date()): Resultat<EntitatNovaDto> {
  const entitat = validaEntitatEditada(cos, avui)
  if (!entitat.ok) return entitat
  const c = cos as Record<string, unknown> // ja sabem que és un objecte

  if (!Array.isArray(c.atributs)) return invalid('Els atributs no són vàlids.')
  const atributs: AtributNouDto[] = []
  for (const a of c.atributs) {
    if (!esObjecte(a)) return invalid('Algun atribut no és vàlid.')
    const nomAtribut = a.nom
    const tipus = a.tipus
    if (typeof nomAtribut !== 'string' || (tipus !== 'string' && tipus !== 'integer')) {
      return invalid('Algun atribut no és vàlid.')
    }
    atributs.push({ nom: nomAtribut, tipus })
  }

  const p = c.perfil
  if (!esObjecte(p)) return invalid('Falta el perfil.')
  const nomPerfil = p.nom
  const edat = p.edat
  const genere = p.genere
  const esInterpret = p.esInterpret
  if (
    typeof nomPerfil !== 'string' ||
    typeof edat !== 'number' ||
    typeof genere !== 'string' ||
    typeof esInterpret !== 'boolean' ||
    !Array.isArray(p.valors)
  ) {
    return invalid('El perfil no és vàlid.')
  }

  const valors: PerfilNouDto['valors'] = []
  for (const v of p.valors) {
    if (!esObjecte(v) || typeof v.atribut !== 'string' || typeof v.valor !== 'string') {
      return invalid('Algun valor no és vàlid.')
    }
    const valor = v.valor.trim()
    if (valor !== '') valors.push({ atribut: v.atribut, valor })
  }

  const perfil: PerfilNouDto = {
    nom: nomPerfil,
    edat,
    genere: genere as PerfilNouDto['genere'],
    esInterpret,
    valors,
  }

  const error = errorAtributs(atributs) ?? errorPerfil(perfil, atributs)
  if (error) return invalid(error)

  return { ok: true, dades: { ...entitat.dades, atributs, perfil } }
}
