// Compressió de les imatges al navegador, abans de pujar-les.
// Es redueixen i es tornen a codificar en WebP segons el tipus (IMATGE_PERFILS), perquè ocupin poc a l'R2.
// De pas, es perden les metadades de la foto (com la ubicació GPS).

import {
  IMATGE_ORIGINAL_MAX,
  IMATGE_PERFILS,
  errorImatge,
  type TipusImatge,
} from "@tfg-vestulari/shared";

// Si amb la qualitat del perfil encara és massa gran, es va baixant fins a aquest mínim
const QUALITAT_MIN = 0.5;

// Codifica el canvas en el format demanat. Retorna null si el navegador no el sap fer
// (Safari no sap fer WebP i retorna PNG, per això es comprova el tipus).
function codifica(canvas: HTMLCanvasElement, tipus: string, qualitat: number): Promise<Blob | null> {
  return new Promise((resol) =>
    canvas.toBlob((blob) => resol(blob && blob.type === tipus ? blob : null), tipus, qualitat)
  );
}

// Valida la foto original i la comprimeix segons el tipus d'imatge.
// Retorna el fitxer comprimit, o el missatge d'error per mostrar a l'usuari.
export async function comprimeix(
  fitxer: File,
  tipusImatge: TipusImatge
): Promise<{ ok: true; fitxer: File } | { ok: false; error: string }> {
  const error = errorImatge(fitxer.type, fitxer.size, IMATGE_ORIGINAL_MAX);
  if (error) return { ok: false, error };

  const { costatMax, qualitat, midaMax } = IMATGE_PERFILS[tipusImatge];

  // createImageBitmap ja gira les fotos fetes amb el mòbil en vertical
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(fitxer);
  } catch {
    return { ok: false, error: "No s'ha pogut llegir la imatge." };
  }

  const escala = Math.min(1, costatMax / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { ok: false, error: "No s'ha pogut preparar la imatge." };
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  // Si el navegador no sap fer WebP, es fa JPG. El JPG no té transparència: es posa fons blanc.
  let tipus = "image/webp";
  if (!(await codifica(canvas, tipus, qualitat))) {
    tipus = "image/jpeg";
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  bitmap.close();

  // Si encara passa de la mida màxima, es baixa la qualitat a poc a poc
  for (let q = qualitat; q >= QUALITAT_MIN - 0.001; q -= 0.1) {
    const blob = await codifica(canvas, tipus, q);
    if (blob && blob.size <= midaMax) {
      const extensio = tipus === "image/webp" ? "webp" : "jpg";
      return { ok: true, fitxer: new File([blob], `imatge.${extensio}`, { type: tipus }) };
    }
  }
  return { ok: false, error: "La imatge és massa gran fins i tot comprimida. Prova'n una altra." };
}
