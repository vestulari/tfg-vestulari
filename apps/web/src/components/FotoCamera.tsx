// Finestra per fer una foto amb la càmera de l'ordinador (webcam).
// Al mòbil no es fa servir: allà s'obre la càmera nativa (ho decideix TriaImatge).

import { useCallback, useEffect, useId, useRef, useState } from "react";
import "./Formulari.css";
import "./Confirmacio.css";
import "./FotoCamera.css";

type Props = {
  obert: boolean;
  // La frontal és la de fer-se una foto a un mateix, i la posterior la de fer fotos a coses
  camera: "frontal" | "posterior";
  onFoto: (fitxer: File) => void;
  onTanca: () => void;
};

// Tradueix l'error del navegador a un missatge entenedor
function missatgeError(e: unknown): string {
  const nom = e instanceof DOMException ? e.name : "";
  if (nom === "NotAllowedError" || nom === "SecurityError") {
    return "Has de permetre l'accés a la càmera al navegador per poder fer la foto.";
  }
  if (nom === "NotFoundError" || nom === "OverconstrainedError") return "No s'ha trobat cap càmera.";
  if (nom === "NotReadableError") return "La càmera l'està fent servir una altra aplicació.";
  return "No s'ha pogut obrir la càmera.";
}

// Mentre és oberta, mostra el vídeo de la càmera. En fer la foto, la ensenya per poder-la repetir
// o fer-la servir. En tancar-se, apaga la càmera (perquè no es quedi el llum encès).
// La foto surt com un fitxer JPG normal, que després es comprimeix com qualsevol altra imatge.
export default function FotoCamera({ obert, camera, onFoto, onTanca }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const id = useId();

  const [error, setError] = useState<string | null>(null);
  const [preparada, setPreparada] = useState(false);
  const [foto, setFoto] = useState<{ fitxer: File; url: string } | null>(null);
  const [cameres, setCameres] = useState<MediaDeviceInfo[]>([]);
  const [cameraTriada, setCameraTriada] = useState<string | null>(null);

  // Apaga la càmera
  const atura = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPreparada(false);
  }, []);

  // Encén la càmera (la triada, o la frontal o posterior si encara no se n'ha triat cap)
  const encen = useCallback(
    async (deviceId: string | null) => {
      atura();
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: camera === "frontal" ? "user" : "environment" }),
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Els noms de les càmeres només es poden saber després de donar permís
        const dispositius = await navigator.mediaDevices.enumerateDevices();
        setCameres(dispositius.filter((d) => d.kind === "videoinput"));
      } catch (e) {
        setError(missatgeError(e));
      }
    },
    [atura, camera]
  );

  // Obre i tanca el <dialog>. En obrir-lo encén la càmera, i en tancar-lo l'apaga.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (obert && !d.open) {
      setFoto(null);
      setCameraTriada(null);
      d.showModal();
      void encen(null);
    }
    if (!obert && d.open) {
      d.close();
      atura();
    }
  }, [obert, encen, atura]);

  // Si el component desapareix amb la càmera encesa, també s'apaga
  useEffect(() => atura, [atura]);

  // Allibera la previsualització de la foto quan ja no es fa servir
  useEffect(() => {
    if (!foto) return;
    return () => URL.revokeObjectURL(foto.url);
  }, [foto]);

  // Fa la foto: copia el fotograma actual del vídeo en un canvas i el converteix en un fitxer
  function fesFoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("No s'ha pogut fer la foto. Torna-ho a provar.");
          return;
        }
        const fitxer = new File([blob], "foto.jpg", { type: "image/jpeg" });
        setFoto({ fitxer, url: URL.createObjectURL(blob) });
      },
      "image/jpeg",
      0.92
    );
  }

  // Passa a la càmera següent de la llista
  function canviaCamera() {
    if (cameres.length < 2) return;
    const actual = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId ?? cameraTriada;
    const index = cameres.findIndex((c) => c.deviceId === actual);
    const seguent = cameres[(index + 1) % cameres.length].deviceId;
    setCameraTriada(seguent);
    void encen(seguent);
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirmacio foto-camera"
      aria-labelledby={`${id}-titol`}
      onCancel={(e) => {
        e.preventDefault();
        onTanca();
      }}
    >
      <h2 id={`${id}-titol`} className="confirmacio__titol">Fes una foto</h2>

      <div className="foto-camera__visor">
        {/* El vídeo de la frontal es veu com un mirall, que és com estem acostumats a veure'ns */}
        <video
          ref={videoRef}
          className={`foto-camera__video${camera === "frontal" ? " foto-camera__video--mirall" : ""}`}
          autoPlay
          playsInline
          muted
          hidden={foto !== null || error !== null}
          onLoadedMetadata={() => setPreparada(true)}
        />
        {foto && <img className="foto-camera__foto" src={foto.url} alt="La foto que has fet" />}
        {!foto && !error && !preparada && <p className="foto-camera__avis">Obrint la càmera…</p>}
        {error && <p className="formulari__error" role="alert">{error}</p>}
      </div>

      <div className="confirmacio__accions">
        <button type="button" className="confirmacio__boto confirmacio__boto--cancela" onClick={onTanca}>
          Cancel·lar
        </button>

        {foto ? (
          <>
            <button type="button" className="confirmacio__boto confirmacio__boto--cancela" onClick={() => setFoto(null)}>
              Repetir
            </button>
            <button
              type="button"
              className="confirmacio__boto confirmacio__boto--accepta"
              onClick={() => {
                onFoto(foto.fitxer);
                onTanca();
              }}
            >
              Fer servir aquesta
            </button>
          </>
        ) : (
          <>
            {cameres.length > 1 && !error && (
              <button type="button" className="confirmacio__boto confirmacio__boto--cancela" onClick={canviaCamera}>
                Canviar de càmera
              </button>
            )}
            {error ? (
              <button
                type="button"
                className="confirmacio__boto confirmacio__boto--accepta"
                onClick={() => void encen(cameraTriada)}
              >
                Tornar-ho a provar
              </button>
            ) : (
              <button
                type="button"
                className="confirmacio__boto confirmacio__boto--accepta"
                disabled={!preparada}
                onClick={fesFoto}
              >
                Fer la foto
              </button>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
