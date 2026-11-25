// Normalització de les crides a l'API relacionades amb els espectacles d'una entitat (i les seves escenes).
// També comprova que el return sigui el tipus esperat.

import type {
  EspectacleDadesDto,
  EspectacleDetallDto,
  EspectacleResumDto,
} from '@tfg-vestulari/shared'

export interface EspectacleGateway {
  llista(entitatId: number): Promise<EspectacleResumDto[]>
  detall(entitatId: number, espectacleId: number): Promise<EspectacleDetallDto>
  // Crear i desar ho fan tot de cop (amb les escenes) i retornen l'espectacle ja desat
  crea(entitatId: number, dades: EspectacleDadesDto): Promise<EspectacleDetallDto>
  desa(entitatId: number, espectacleId: number, dades: EspectacleDadesDto): Promise<EspectacleDetallDto>
  elimina(entitatId: number, espectacleId: number): Promise<void>
}
