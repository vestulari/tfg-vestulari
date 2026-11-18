// Fa les crides API relacionades amb el vestuari d'una entitat (tipus de peça i peces de roba).

import type {
  PecaResumDto,
  TipusPecaDto,
  TipusPecaResumDto,
} from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { VestuariGateway } from '../interfaces/VestuariGateway'

// Ruta base dels tipus de peça d'una entitat
const tipus = (entitatId: number) => `/entitats/${entitatId}/tipus-peca`

export const vestuariApi: VestuariGateway = {
  peces: (entitatId) => api<PecaResumDto[]>(`/entitats/${entitatId}/peces`),
  tipus: (entitatId) => api<TipusPecaResumDto[]>(tipus(entitatId)),
  tipusDetall: (entitatId, tipusId) => api<TipusPecaDto>(`${tipus(entitatId)}/${tipusId}`),
  creaTipus: (entitatId, dades) =>
    api<{ id: number }>(tipus(entitatId), { method: 'POST', body: JSON.stringify(dades) }),
  desaTipus: (entitatId, tipusId, dades) =>
    api<TipusPecaDto>(`${tipus(entitatId)}/${tipusId}`, { method: 'PUT', body: JSON.stringify(dades) }),
  eliminaTipus: (entitatId, tipusId) =>
    api<void>(`${tipus(entitatId)}/${tipusId}`, { method: 'DELETE' }),
}
