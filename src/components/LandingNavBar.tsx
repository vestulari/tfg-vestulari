/* La barra de navegació de la Landing Page */

import { NavLink } from "react-router-dom";
import "./LandingNavBar.css";

const links = [
  { to: "/", label: "Inici" },
  { to: "/info", label: "Info" },
  { to: "/mes", label: "Més" },
];

export default function LandingNavBar() {
  return (
    <header className="landing-navbar">
      <NavLink to="/" className="navbar__brand">
        Vestulari
      </NavLink>
      <nav className="navbar__links" aria-label="Navegació principal">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              "navbar__link" + (isActive ? " navbar__link--active" : "")
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}