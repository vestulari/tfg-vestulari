// Normalització de les crides a l'API relacionades amb les invitacions.
// També comprova que el return sigui el tipus esperat.

import type { InvitacioDetallDto, InvitacioResumDto } from '@tfg-vestulari/shared'

export interface InvitacioGateway {
  llista(): Promise<InvitacioResumDto[]>
  obre(id: number): Promise<InvitacioDetallDto>
  accepta(id: number): Promise<{ entitatId: number }>
  rebutja(id: number): Promise<void>
}