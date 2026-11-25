// Tipus de les dades que viatgen entre el frontend i l'API (DTO).

// A què pertany una imatge. Cada tipus es comprimeix d'una manera (IMATGE_PERFILS)
export type TipusImatge = 'usuari' | 'entitat' | 'vestuari'

// imatgeUrl és una URL temporal (signada) per veure la foto, o null si no en té
export type UsuariDto = {
  id: string
  nom: string
  imatgeUrl: string | null
  email: string | null
  invitacionsPendents: number
}

// imatgeUrl és una URL temporal (signada) per veure la imatge, o null si l'entitat no en té
export type EntitatResumDto = {
  id: number
  nom: string
  imatgeUrl: string | null
}

// Una entitat vista per un dels seus membres, amb el perfil que hi té i els seus permisos
export type EntitatDetallDto = {
  id: number
  nom: string
  imatgeUrl: string | null
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

// Resposta d'acceptar o rebutjar una invitació. entitatId només hi és en acceptar-la.
// invitacionsPendents és el comptador nou, perquè el frontend no hagi de tornar a demanar l'usuari.
export type InvitacioRespostaDto = { entitatId?: number; invitacionsPendents: number }

export type InvitacioResumDto = {
  id: number
  entitatId: number
  entitatNom: string
  entitatImatgeUrl: string | null
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

// Resposta de crear una entitat. avis diu que l'entitat s'ha creat però la imatge no s'ha pogut pujar.
export type EntitatCreadaDto = { id: number; avis?: string }

// Una resposta que, a més de l'objecte desat, pot portar un avís (per exemple, si la imatge no s'ha pogut pujar)
export type AmbAvis<T> = T & { avis?: string }

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

// Resposta de compartir un perfil: si el correu té compte, s'envia la invitació.
// Si s'ha enviat, porta el perfil actualitzat (així no s'ha de tornar a demanar).
export type ComparticioDto = { enviada: boolean; missatge: string; perfil?: PerfilDetallDto }
// ---------- Vestuari ----------
// Tipus que pot tenir un atribut d'un tipus de peça (els de perfil, més el color)
export type TipusAtributPeca = 'string' | 'integer' | 'color'

// Un tipus de peça a la llista (Camisa, Samarreta...)
export type TipusPecaResumDto = { id: number; nom: string }

// Un atribut d'un tipus de peça, tal com està guardat
export type AtributPecaDto = { id: number; nom: string; tipus: TipusAtributPeca }

// Un tipus de peça amb tots els seus atributs, per ordre de creació
export type TipusPecaDto = TipusPecaResumDto & { atributs: AtributPecaDto[] }

// Un tipus de peça quan es crea o es desa: els atributs nous van sense id
export type TipusPecaDadesDto = {
  nom: string
  atributs: { id: number | null; nom: string; tipus: TipusAtributPeca }[]
}

// Un color de la paleta del vestuari de l'entitat. hex és #RRGGBB en majúscules.
export type ColorDto = { id: number; nom: string; hex: string }

// Un color quan es desa la paleta: sense id si és nou
export type ColorDadesDto = { id: number | null; nom: string; hex: string }

// Una peça de roba a l'inventari. imatgeUrl és una URL temporal, o null si no té foto.
export type PecaResumDto = { id: number; nom: string; tipusId: number; imatgeUrl: string | null }

// El valor d'un atribut del tipus de peça en una peça. Als atributs de color és l'id del color.
export type ValorPecaDto = { atributId: number; valor: string }

// Tot el que es veu d'una peça. creadaPer és el nom del perfil que la va crear (si encara existeix).
export type PecaDetallDto = PecaResumDto & {
  descripcio: string | null
  tipusNom: string
  creadaPer: string | null
  valors: ValorPecaDto[]
}

// Les dades d'una peça quan es crea o s'edita. En editar-la, el tipus no pot canviar.
export type PecaDadesDto = {
  nom: string
  descripcio: string
  tipusId: number
  valors: ValorPecaDto[]
}

// ---------- Espectacles ----------
// Un espectacle a la llista (només se'n mostra l'any d'estrena)
export type EspectacleResumDto = { id: number; nom: string; anyEstrena: number }

// Una escena d'un espectacle. Les escenes sempre van en l'ordre de l'espectacle.
export type EscenaDto = { id: number; nom: string }

// Una actuació d'un espectacle. data és AAAA-MM-DD, o null si encara no en té.
export type ActuacioResumDto = { id: number; nom: string; data: string | null }

// Tot el que es veu d'un espectacle. De la data d'estrena, només l'any és obligatori.
export type EspectacleDetallDto = EspectacleResumDto & {
  mesEstrena: number | null
  diaEstrena: number | null
  descripcio: string | null
  escenes: EscenaDto[]
  actuacions: ActuacioResumDto[]
}

// Les dades d'un espectacle quan es crea o es desa. Les escenes van en l'ordre que han de tenir,
// i les noves, sense id.
export type EspectacleDadesDto = {
  nom: string
  descripcio: string
  anyEstrena: number
  mesEstrena: number | null
  diaEstrena: number | null
  escenes: { id: number | null; nom: string }[]
}
