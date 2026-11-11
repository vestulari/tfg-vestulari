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

export type InvitacioResumDto = {
  id: number
  entitatId: number
  entitatNom: string
  oberta: boolean
}

export type InvitacioDetallDto = InvitacioResumDto & {
  entitatDescripcio: string | null
}