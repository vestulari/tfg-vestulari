// Normalització de les crides a l'API relacionades amb els perfils d'una entitat.
// També comprova que el return sigui el tipus esperat.

import type {
  ComparticioDto,
  PerfilDadesDto,
  PerfilDetallDto,
  PerfilResumDto,
} from '@tfg-vestulari/shared'

export interface PerfilGateway {
  llista(entitatId: number): Promise<PerfilResumDto[]>
  detall(entitatId: number, perfilId: number): Promise<PerfilDetallDto>
  // Les accions dels administradors retornen el perfil ja actualitzat
  crea(entitatId: number, dades: PerfilDadesDto): Promise<PerfilDetallDto>
  edita(entitatId: number, perfilId: number, dades: PerfilDadesDto): Promise<PerfilDetallDto>
  comparteix(entitatId: number, perfilId: number, email: string): Promise<ComparticioDto>
  cancelaInvitacio(entitatId: number, perfilId: number): Promise<PerfilDetallDto>
  descomparteix(entitatId: number, perfilId: number): Promise<PerfilDetallDto>
}
