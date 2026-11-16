// Passa les dades dels perfils i de la plantilla del format de l'API al dels formularis, i al revés.

import type {
  AtributDto,
  AtributPlantillaDto,
  PerfilDadesDto,
  PerfilDetallDto,
} from "@tfg-vestulari/shared";
import type { AtributFila, PerfilEsborrany } from "../context/CreacioEntitatContext";

// Els atributs guardats com a files del formulari. La clau és el mateix id de la base de dades.
export function filesDePlantilla(atributs: AtributDto[]): AtributFila[] {
  return atributs.map((a) => ({ clau: a.id, id: a.id, nom: a.nom, tipus: a.tipus }));
}

// Les files del formulari com a plantilla per a l'API (les noves, sense id)
export function plantillaDeFiles(files: AtributFila[]): AtributPlantillaDto[] {
  return files.map((f) => ({
    id: f.id ?? null,
    nom: f.nom,
    tipus: f.tipus as AtributPlantillaDto["tipus"],
  }));
}

// Un perfil buit, per inserir-ne un de nou (sense cap permís marcat)
export function esborranyBuit(): PerfilEsborrany {
  return { nom: "", edat: "", genere: "", esInterpret: false, esAdministrador: false, valors: {} };
}

// Un perfil guardat, amb els números com a text, per omplir el formulari d'edició
export function esborranyDePerfil(p: PerfilDetallDto): PerfilEsborrany {
  const valors: Record<number, string> = {};
  for (const v of p.valors) valors[v.atributId] = v.valor;
  return {
    nom: p.nom,
    edat: p.edat === null ? "" : String(p.edat),
    genere: p.genere ?? "",
    esInterpret: p.esInterpret,
    esAdministrador: p.esAdministrador,
    valors,
  };
}

// El formulari ja validat, en el format de l'API (els valors buits no s'envien)
export function dadesDEsborrany(e: PerfilEsborrany, atributs: AtributDto[]): PerfilDadesDto {
  return {
    nom: e.nom,
    edat: Number(e.edat),
    genere: e.genere as PerfilDadesDto["genere"],
    esAdministrador: e.esAdministrador,
    esInterpret: e.esInterpret,
    valors: atributs
      .filter((a) => (e.valors[a.id] ?? "").trim() !== "")
      .map((a) => ({ atributId: a.id, valor: (e.valors[a.id] ?? "").trim() })),
  };
}
