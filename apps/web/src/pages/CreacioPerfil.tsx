import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { EntitatNovaDto, Genere, TipusAtribut } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import { usuariApi } from "../adapters/api/UsuariApi";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PerfilForm from "../components/PerfilForm";
import { atributsOmplerts, useCreacioEntitat } from "../context/CreacioEntitatContext";
import "../components/Formulari.css";

export default function CreacioPerfil() {
  const { esborrany, actualitza } = useCreacioEntitat();
  const navigate = useNavigate();
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Proposem el nom de l'usuari com a nom del perfil
  useEffect(() => {
    if (esborrany.perfil.nom !== "") return;
    let cancelat = false;
    usuariApi
      .getMe()
      .then((u) => {
        if (!cancelat) actualitza({ perfil: { ...esborrany.perfil, nom: u.nom } });
      })
      .catch(() => {});
    return () => {
      cancelat = true;
    };
    // només en muntar-se
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (esborrany.nom === "") return <Navigate to="/entitats/nova" replace />;

  const atributs = atributsOmplerts(esborrany.atributs);

  async function confirma() {
    setEnviant(true);
    setErrorServidor(null);

    const p = esborrany.perfil;
    const dades: EntitatNovaDto = {
      nom: esborrany.nom,
      descripcio: esborrany.descripcio.trim(),
      anyCreacio: Number(esborrany.any),
      mesCreacio: esborrany.mes.trim() === "" ? null : Number(esborrany.mes),
      diaCreacio: esborrany.dia.trim() === "" ? null : Number(esborrany.dia),
      atributs: atributs.map((a) => ({ nom: a.nom, tipus: a.tipus as TipusAtribut })),
      perfil: {
        nom: p.nom,
        edat: Number(p.edat),
        genere: p.genere as Genere,
        esInterpret: p.esInterpret,
        valors: atributs
          .filter((a) => (p.valors[a.clau] ?? "").trim() !== "")
          .map((a) => ({ atribut: a.nom, valor: (p.valors[a.clau] ?? "").trim() })),
      },
    };

    try {
      await entitatApi.crea(dades);
      navigate("/inici");
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'ha pogut crear l'entitat.");
      setEnviant(false);
    }
  }

  return (
    <div className="pantalla">
      <Capcalera titol="Crea el teu perfil" />

      <div className="pantalla__barra">
        <BotoEnrere to="/entitats/nova/plantilla" />
      </div>

      <main className="pantalla__contingut">
        <PerfilForm
          atributs={atributs}
          perfil={esborrany.perfil}
          onCanvi={(perfil) => actualitza({ perfil })}
          onConfirma={confirma}
          adminObligatori
          enviant={enviant}
          errorServidor={errorServidor}
        />
      </main>
    </div>
  );
}