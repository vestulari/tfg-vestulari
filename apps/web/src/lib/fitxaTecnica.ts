// Genera la fitxa tècnica d'una peça de roba en PDF, al navegador, i la descarrega.
// Hi surt de quina entitat és (nom i imatge), el codi, el tipus, tots els atributs, la descripció i la foto.
// jsPDF es carrega només quan es fa servir, perquè no pesi a la resta de l'app.

import {
  codiPeca,
  type AtributPecaDto,
  type ColorDto,
  type PecaDetallDto,
} from "@tfg-vestulari/shared";
import { entitatApi } from "../adapters/api/EntitatApi";
import { vestuariApi } from "../adapters/api/VestuariApi";

type Dades = {
  entitat: { id: number; nom: string; imatgeUrl: string | null };
  peca: PecaDetallDto;
  atributs: AtributPecaDto[];
  colors: ColorDto[];
};

type Imatge = { dataUrl: string; amplada: number; alcada: number };

// Colors de l'app (els de la capçalera), en RGB
const BLAU: [number, number, number] = [11, 75, 176];
const GROC: [number, number, number] = [249, 217, 73];
const GRIS: [number, number, number] = [85, 89, 95];

// Mides d'un A4 vertical, en mil·límetres
const AMPLADA = 210;
const ALCADA = 297;
const MARGE = 15;

// Passa una imatge (WebP, PNG o JPG) a JPG amb fons blanc, que és el que jsPDF posa millor al PDF.
// Retorna null si no es pot llegir.
async function aJpg(fitxer: Blob, costatMax = 1600): Promise<Imatge | null> {
  try {
    const bitmap = await createImageBitmap(fitxer);
    const escala = Math.min(1, costatMax / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), amplada: canvas.width, alcada: canvas.height };
  } catch {
    return null;
  }
}

// Baixa una imatge a través de l'API i la passa a JPG. Si falla, la fitxa es fa igualment sense imatge.
async function imatge(baixa: () => Promise<Blob>, costatMax?: number): Promise<Imatge | null> {
  try {
    return await aJpg(await baixa(), costatMax);
  } catch {
    return null;
  }
}

// Mida d'una imatge perquè càpiga dins d'un requadre sense deformar-se
function encaixa(img: Imatge, maxAmplada: number, maxAlcada: number) {
  const escala = Math.min(maxAmplada / img.amplada, maxAlcada / img.alcada);
  return { w: img.amplada * escala, h: img.alcada * escala };
}

// Passa "#RRGGBB" a [r, g, b]
const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

// Nom del fitxer, sense els caràcters que no poden anar en un nom de fitxer
const nomFitxer = (codi: string, nom: string) =>
  `Fitxa ${codi.slice(1)} - ${nom}`.replace(/[\\/:*?"<>|]/g, "").trim() + ".pdf";

// Genera la fitxa i la descarrega
export async function descarregaFitxa({ entitat, peca, atributs, colors }: Dades): Promise<void> {
  const [{ jsPDF }, foto, logo] = await Promise.all([
    import("jspdf"),
    peca.imatgeUrl ? imatge(() => vestuariApi.fitxerImatgePeca(entitat.id, peca.id)) : Promise.resolve(null),
    entitat.imatgeUrl ? imatge(() => entitatApi.fitxerImatge(entitat.id), 400) : Promise.resolve(null),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const codi = codiPeca(peca.tipusId, peca.id);
  doc.setProperties({ title: `Fitxa tècnica ${codi} - ${peca.nom}`, creator: "Vestulari" });

  // ---------- Capçalera: l'entitat ----------
  doc.setFillColor(...BLAU);
  doc.rect(0, 0, AMPLADA, 30, "F");
  let xNom = MARGE;
  if (logo) {
    const { w, h } = encaixa(logo, 20, 20);
    doc.setFillColor(255, 255, 255);
    doc.circle(MARGE + 11, 15, 12, "F");
    doc.addImage(logo.dataUrl, "JPEG", MARGE + 11 - w / 2, 15 - h / 2, w, h);
    xNom = MARGE + 28;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...GROC);
  doc.text(doc.splitTextToSize(entitat.nom, AMPLADA - xNom - 55)[0], xNom, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("Fitxa tècnica", AMPLADA - MARGE, 17, { align: "right" });

  // ---------- Títol: la peça ----------
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const titol: string[] = doc.splitTextToSize(peca.nom, AMPLADA - 2 * MARGE);
  doc.text(titol, AMPLADA / 2, 46, { align: "center" });
  let y = 46 + (titol.length - 1) * 9 + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...GRIS);
  doc.text(`${codi}  ·  ${peca.tipusNom}`, AMPLADA / 2, y, { align: "center" });
  y += 12;

  // ---------- Foto, a la dreta ----------
  const xFoto = 118;
  const ampladaFoto = AMPLADA - MARGE - xFoto;
  let fiFoto = y;
  if (foto) {
    const { w, h } = encaixa(foto, ampladaFoto, 100);
    doc.setDrawColor(210, 214, 220);
    doc.rect(xFoto - 1, y - 1, ampladaFoto + 2, h + 2);
    doc.addImage(foto.dataUrl, "JPEG", xFoto + (ampladaFoto - w) / 2, y, w, h);
    fiFoto = y + h + 2;
  }

  // ---------- Atributs, a l'esquerra ----------
  const xEtiqueta = MARGE;
  const xValor = MARGE + 42;
  const ampladaValor = (foto ? xFoto - 8 : AMPLADA - MARGE) - xValor;
  const fila = (etiqueta: string, valor: string, color?: string) => {
    const linies: string[] = doc.splitTextToSize(valor, ampladaValor - (color ? 8 : 0));
    const alt = Math.max(9, linies.length * 5 + 4);
    doc.setFillColor(241, 245, 250);
    doc.roundedRect(xEtiqueta, y, (foto ? xFoto - 8 : AMPLADA - MARGE) - xEtiqueta, alt, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...GRIS);
    doc.text(doc.splitTextToSize(etiqueta, xValor - xEtiqueta - 4)[0], xEtiqueta + 3, y + 5.8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    let x = xValor;
    if (color) {
      doc.setFillColor(...rgb(color));
      doc.setDrawColor(150, 150, 150);
      doc.circle(x + 2.5, y + 4.5, 2.5, "FD");
      x += 8;
    }
    doc.text(linies, x, y + 6);
    y += alt + 2.5;
  };

  fila("Tipus de peça", peca.tipusNom);
  for (const a of atributs) {
    const valor = peca.valors.find((v) => v.atributId === a.id)?.valor;
    if (a.tipus === "color") {
      const c = colors.find((c) => String(c.id) === valor);
      fila(a.nom, c ? `${c.nom} (${c.hex})` : "—", c?.hex);
    } else {
      fila(a.nom, valor ?? "—");
    }
  }
  fila("Creada per", peca.creadaPer ?? "—");

  // ---------- Descripció, a sota de tot ----------
  y = Math.max(y, fiFoto) + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 17, 17);
  doc.text("Descripció", MARGE, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const descripcio: string[] = doc.splitTextToSize(peca.descripcio ?? "Sense descripció.", AMPLADA - 2 * MARGE);
  for (const linia of descripcio) {
    if (y > ALCADA - 20) {
      doc.addPage();
      y = MARGE + 5;
    }
    doc.text(linia, MARGE, y);
    y += 5.5;
  }

  // ---------- Peu de pàgina, a totes les pàgines ----------
  const avui = new Date().toLocaleDateString("ca-ES");
  const pagines = doc.getNumberOfPages();
  for (let i = 1; i <= pagines; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(`${entitat.nom} · ${codi} · Generada el ${avui} amb Vestulari`, MARGE, ALCADA - 8);
    doc.text(`${i}/${pagines}`, AMPLADA - MARGE, ALCADA - 8, { align: "right" });
  }

  doc.save(nomFitxer(codi, peca.nom));
}
