// Normalització de les crides a l'API relacionades amb les entitats.
// També comprova que el return sigui el tipus esperat.
import type {
  AdministradorDto,
  EntitatCreadaDto,
  EntitatDetallDto,
  EntitatEditadaDto,
  EntitatNovaDto,
  EntitatResumDto,
} from '@tfg-vestulari/shared'

export interface EntitatGateway {
  llistaMeves(): Promise<EntitatResumDto[]>
  detall(id: number): Promise<EntitatDetallDto>
  crea(dades: EntitatNovaDto): Promise<EntitatCreadaDto>
  edita(id: number, dades: EntitatEditadaDto): Promise<EntitatDetallDto>
  elimina(id: number): Promise<void>
  administradors(id: number): Promise<AdministradorDto[]>
  passaCreador(id: number, perfilId: number): Promise<void>
  surt(id: number): Promise<void>
}
