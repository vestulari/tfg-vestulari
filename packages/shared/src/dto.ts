// Tipus de les dades que viatgen entre el frontend i l'API (DTO).

export type UsuariDto = {
  id: string
  nom: string
  email: string | null
  invitacionsPendents: number
}

export type EntitatResumDto = {
  id: number
  nom: string
}

// Una entitat vista per un dels seus membres, amb el perfil que hi té i els seus permisos
export type EntitatDetallDto = {
  id: number
  nom: string
  descripcio: string | null
  anyCreacio: number
  mesCreacio: number | null
  diaCreacio: number | null
  perfil: {
    id: number
    nom: string
    esAdministrador: boolean
    esInterpret: boolean
    esCreador: boolean
  }
}

// ---------- Configuració d'una entitat ----------
// Les dades de l'entitat que un administrador pot canviar
export type EntitatEditadaDto = {
  nom: string
  descripcio: string
  anyCreacio: number
  mesCreacio: number | null
  diaCreacio: number | null
}

// Un administrador de l'entitat, a qui el creador pot passar el rol
export type AdministradorDto = {
  perfilId: number
  perfilNom: string
  usuariNom: string
}

export type InvitacioResumDto = {
  id: number
  entitatId: number
  entitatNom: string
  oberta: boolean
}

export type InvitacioDetallDto = InvitacioResumDto & {
  entitatDescripcio: string | null
}


// ---------- Creació d'una entitat ----------
export type TipusAtribut = 'string' | 'integer'
export type Genere = 'masculi' | 'femeni' | 'altres'

export type AtributNouDto = { nom: string; tipus: TipusAtribut }
export type ValorAtributDto = { atribut: string; valor: string }

// Perfil del creador. L'API sempre el fa administrador.
export type PerfilNouDto = {
  nom: string
  edat: number
  genere: Genere
  esInterpret: boolean
  valors: ValorAtributDto[]
}

export type EntitatNovaDto = {
  nom: string
  descripcio: string
  anyCreacio: number
  mesCreacio: number | null
  diaCreacio: number | null
  atributs: AtributNouDto[]
  perfil: PerfilNouDto
}

export type EntitatCreadaDto = { id: number }

// ---------- Plantilla de perfil ----------
// Un atribut de la plantilla d'una entitat, tal com està guardat
export type AtributDto = { id: number; nom: string; tipus: TipusAtribut }

// Un atribut quan es desa la plantilla: sense id si és nou
export type AtributPlantillaDto = { id: number | null; nom: string; tipus: TipusAtribut }

export type PlantillaDto = { atributs: AtributPlantillaDto[] }

// ---------- Perfils ----------
// Un perfil a la llista d'intèrprets
export type PerfilResumDto = {
  id: number
  nom: string
  esAdministrador: boolean
  esInterpret: boolean
}

// El valor d'un atribut de la plantilla en un perfil
export type ValorPerfilDto = { atributId: number; valor: string }

// Tot el que es veu d'un perfil. Els perfils antics poden no tenir edat ni gènere.
export type PerfilDetallDto = PerfilResumDto & {
  edat: number | null
  genere: Genere | null
  // El perfil és el de l'usuari creador de l'entitat
  esCreador: boolean
  // El perfil és el de l'usuari que el mira
  esMeu: boolean
  valors: ValorPerfilDto[]
  // Correu de l'usuari que té el perfil, si en té
  compartitAmb: string | null
  // Invitació enviada que encara no s'ha respost
  invitacio: { id: number; email: string } | null
}

// Les dades d'un perfil quan es crea o s'edita
export type PerfilDadesDto = {
  nom: string
  edat: number
  genere: Genere
  esAdministrador: boolean
  esInterpret: boolean
  valors: ValorPerfilDto[]
}

// Resposta de compartir un perfil: si el correu té compte, s'envia la invitació
export type ComparticioDto = { enviada: boolean; missatge: string }