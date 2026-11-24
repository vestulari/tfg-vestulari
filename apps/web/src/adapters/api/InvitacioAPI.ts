// Fa les crides API relacionades amb les invitacions.

import type {
  InvitacioDetallDto,
  InvitacioRespostaDto,
  InvitacioResumDto,
} from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { InvitacioGateway } from '../interfaces/InvitacioGateway'

export const invitacioApi: InvitacioGateway = {
  llista: () => api<InvitacioResumDto[]>('/me/invitacions'),
  obre: (id) => api<InvitacioDetallDto>(`/me/invitacions/${id}`),
  accepta: (id) => api<InvitacioRespostaDto>(`/me/invitacions/${id}/accepta`, { method: 'POST' }),
  rebutja: (id) => api<InvitacioRespostaDto>(`/me/invitacions/${id}/rebutja`, { method: 'POST' }),
}