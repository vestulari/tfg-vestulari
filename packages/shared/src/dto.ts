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
  perfil: {
    id: number
    nom: string
    esAdministrador: boolean
    esInterpret: boolean
  }
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