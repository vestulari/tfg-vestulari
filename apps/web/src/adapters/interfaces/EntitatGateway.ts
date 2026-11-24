// Normalització de les crides a l'API relacionades amb les entitats.
// També comprova que el return sigui el tipus esperat.
import type {
  AdministradorDto,
  AmbAvis,
  AtributDto,
  AtributPlantillaDto,
  EntitatCreadaDto,
  EntitatDetallDto,
  EntitatEditadaDto,
  EntitatNovaDto,
  EntitatResumDto,
} from '@tfg-vestulari/shared'
import type { CanviImatge } from '../api/ApiClient'

export interface EntitatGateway {
  llistaMeves(): Promise<EntitatResumDto[]>
  detall(id: number): Promise<EntitatDetallDto>
  // Crear i editar desen les dades i la imatge alhora. Si la imatge falla, la resposta porta un avís.
  crea(dades: EntitatNovaDto, imatge: CanviImatge): Promise<EntitatCreadaDto>
  edita(id: number, dades: EntitatEditadaDto, imatge: CanviImatge): Promise<AmbAvis<EntitatDetallDto>>
  elimina(id: number): Promise<void>
  // La imatge mateixa (per posar-la a la fitxa tècnica de les peces)
  fitxerImatge(id: number): Promise<Blob>
  administradors(id: number): Promise<AdministradorDto[]>
  passaCreador(id: number, perfilId: number): Promise<void>
  surt(id: number): Promise<void>
  plantilla(id: number): Promise<AtributDto[]>
  desaPlantilla(id: number, atributs: AtributPlantillaDto[]): Promise<AtributDto[]>
}
