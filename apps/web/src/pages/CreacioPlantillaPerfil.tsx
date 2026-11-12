import { Navigate, useNavigate } from "react-router-dom";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PlantillaPerfilForm from "../components/PlantillaPerfilForm";
import { useCreacioEntitat } from "../context/CreacioEntitatContext";
import "../components/Formulari.css";

export default function CreacioPlantillaPerfil() {
  const { esborrany, actualitza } = useCreacioEntitat();
  const navigate = useNavigate();

  // Si s'ha perdut l'esborrany (per exemple en recarregar), tornem al primer pas
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
          onCanvi={(atributs) => actualitza({ atributs })}
          onConfirma={() => navigate("/entitats/nova/perfil")}
        />
      </main>
    </div>
  );
}