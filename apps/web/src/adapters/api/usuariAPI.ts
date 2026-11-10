// Implementació del repositori d'usuaris.

import { api } from './apiClient'
import type { UsuariRepository } from '../interfaces/UsuariRepository'

export const usuariApi: UsuariRepository = {
  getMe: () => api<{ userId: string }>('/me'),
}