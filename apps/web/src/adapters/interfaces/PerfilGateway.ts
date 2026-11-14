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
  crea(entitatId: number, dades: PerfilDadesDto): Promise<{ id: number }>
  edita(entitatId: number, perfilId: number, dades: PerfilDadesDto): Promise<void>
  comparteix(entitatId: number, perfilId: number, email: string): Promise<ComparticioDto>
  cancelaInvitacio(entitatId: number, perfilId: number): Promise<void>
  descomparteix(entitatId: number, perfilId: number): Promise<void>
}
