import type { EntitatResumDto } from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { EntitatGateway } from '../interfaces/EntitatGateway'

export const entitatApi: EntitatGateway = {
  llistaMeves: () => api<EntitatResumDto[]>('/me/entitats'),
}