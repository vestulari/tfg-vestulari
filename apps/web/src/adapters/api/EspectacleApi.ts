// Fa les crides API relacionades amb els espectacles d'una entitat (i les seves escenes).

import type { EspectacleDetallDto, EspectacleResumDto } from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { EspectacleGateway } from '../interfaces/EspectacleGateway'

// Ruta base dels espectacles d'una entitat
const base = (entitatId: number) => `/entitats/${entitatId}/espectacles`

export const espectacleApi: EspectacleGateway = {
  llista: (entitatId) => api<EspectacleResumDto[]>(base(entitatId)),
  detall: (entitatId, espectacleId) => api<EspectacleDetallDto>(`${base(entitatId)}/${espectacleId}`),
  crea: (entitatId, dades) =>
    api<EspectacleDetallDto>(base(entitatId), { method: 'POST', body: JSON.stringify(dades) }),
  desa: (entitatId, espectacleId, dades) =>
    api<EspectacleDetallDto>(`${base(entitatId)}/${espectacleId}`, {
      method: 'PUT',
      body: JSON.stringify(dades),
    }),
  elimina: (entitatId, espectacleId) =>
    api<void>(`${base(entitatId)}/${espectacleId}`, { method: 'DELETE' }),
}
