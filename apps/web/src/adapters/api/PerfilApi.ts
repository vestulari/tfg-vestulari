// Fa les crides API relacionades amb els perfils d'una entitat.

import type { ComparticioDto, PerfilDetallDto, PerfilResumDto } from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { PerfilGateway } from '../interfaces/PerfilGateway'

// Ruta base dels perfils d'una entitat
const base = (entitatId: number) => `/entitats/${entitatId}/perfils`

export const perfilApi: PerfilGateway = {
  llista: (entitatId) => api<PerfilResumDto[]>(base(entitatId)),
  detall: (entitatId, perfilId) => api<PerfilDetallDto>(`${base(entitatId)}/${perfilId}`),
  crea: (entitatId, dades) =>
    api<{ id: number }>(base(entitatId), { method: 'POST', body: JSON.stringify(dades) }),
  edita: (entitatId, perfilId, dades) =>
    api<void>(`${base(entitatId)}/${perfilId}`, { method: 'PUT', body: JSON.stringify(dades) }),
  comparteix: (entitatId, perfilId, email) =>
    api<ComparticioDto>(`${base(entitatId)}/${perfilId}/invitacio`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  cancelaInvitacio: (entitatId, perfilId) =>
    api<void>(`${base(entitatId)}/${perfilId}/invitacio`, { method: 'DELETE' }),
  descomparteix: (entitatId, perfilId) =>
    api<void>(`${base(entitatId)}/${perfilId}/usuari`, { method: 'DELETE' }),
}
