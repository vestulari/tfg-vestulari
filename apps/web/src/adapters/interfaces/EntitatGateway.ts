import type { EntitatResumDto } from '@tfg-vestulari/shared'

export interface EntitatGateway {
  llistaMeves(): Promise<EntitatResumDto[]>
}