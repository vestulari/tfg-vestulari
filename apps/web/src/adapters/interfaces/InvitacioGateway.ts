// Normalització de les crides a l'API relacionades amb les invitacions.
// També comprova que el return sigui el tipus esperat.

import type {
  InvitacioDetallDto,
  InvitacioRespostaDto,
  InvitacioResumDto,
} from '@tfg-vestulari/shared'

export interface InvitacioGateway {
  llista(): Promise<InvitacioResumDto[]>
  obre(id: number): Promise<InvitacioDetallDto>
  // Totes dues retornen el comptador nou d'invitacions pendents (i acceptar, l'entitat on s'entra)
  accepta(id: number): Promise<InvitacioRespostaDto>
  rebutja(id: number): Promise<InvitacioRespostaDto>
}