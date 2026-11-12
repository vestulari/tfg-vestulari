// Segon pas de la creació d'una entitat: la plantilla de perfil.

import { Navigate, useNavigate } from "react-router-dom";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PlantillaPerfilForm from "../components/PlantillaPerfilForm";
import {
  useCreacioEntitat,
  type AtributFila,
  type Esborrany,
  type PerfilEsborrany,
} from "../context/CreacioEntitatContext";
import "../components/Formulari.css";

// Treu del perfil els valors dels atributs que s'han esborrat o canviat de tipus,
// perquè un atribut nou no es quedi el valor d'un de vell!
function netejaValors(e: Esborrany, atributs: AtributFila[]): PerfilEsborrany {
  const tipusAbans = new Map(e.atributs.map((a) => [a.clau, a.tipus]));
  const valors: PerfilEsborrany["valors"] = {};
  for (const a of atributs) {
    const valor = e.perfil.valors[a.clau];
    if (valor !== undefined && tipusAbans.get(a.clau) === a.tipus) valors[a.clau] = valor;
  }
  return { ...e.perfil, valors };
}

// Si s'ha perdut l'esborrany (per exemple, en recarregar), torna al primer pas
export default function CreacioPlantillaPerfil() {
  const { esborrany, actualitza } = useCreacioEntitat();
  const navigate = useNavigate();

  if (esborrany.nom === "") return <Navigate to="/entitats/nova" replace />;

  return (
    <div className="pantalla">
      <Capcalera titol="Crea la plantilla de perfil" />

      <div className="pantalla__barra">
        <BotoEnrere to="/entitats/nova" />
      </div>

      <main className="pantalla__contingut">
        <PlantillaPerfilForm
          mode="creacio"
          atributs={esborrany.atributs}
          onCanvi={(atributs) => actualitza((e) => ({ atributs, perfil: netejaValors(e, atributs) }))}
          onConfirma={() => navigate("/entitats/nova/perfil")}
        />
      </main>
    </div>
  );
}