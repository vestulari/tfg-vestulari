// Normalització de les crides a l'API relacionades amb les entitats.
// També comprova que el return sigui el tipus esperat.
import type { EntitatCreadaDto, EntitatNovaDto, EntitatResumDto } from '@tfg-vestulari/shared'

export interface EntitatGateway {
  llistaMeves(): Promise<EntitatResumDto[]>
  crea(dades: EntitatNovaDto): Promise<EntitatCreadaDto>
}