import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import RutaProtegida from "./pages/RutaProtegida.jsx";
import Login from "./pages/Login.jsx";
import EventosList from "./pages/EventosList.jsx";
import EventoDetalle from "./pages/EventoDetalle.jsx";
import CrearEvento from "./pages/CrearEvento.jsx";
import Cupones from "./pages/Cupones.jsx";
import Reportes from "./pages/Reportes.jsx";
import HistorialVentas from "./pages/HistorialVentas.jsx";
import DashboardSuperusuario from "./pages/DashboardSuperusuario.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Escaneo from "./pages/Escaneo.jsx";
import Entrada from "./pages/Entrada.jsx";

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      {usuario && (
        <nav className="navbar">
          <Link to="/">Eventos</Link>
          {["vendedor", "admin", "superusuario"].includes(usuario.rol) && <Link to="/ventas">Ventas</Link>}
          {["puerta", "admin", "superusuario"].includes(usuario.rol) && <Link to="/escaneo">Escaneo</Link>}
          {["admin", "superusuario"].includes(usuario.rol) && <Link to="/eventos/nuevo">Nuevo evento</Link>}
          {["admin", "superusuario"].includes(usuario.rol) && <Link to="/usuarios">Usuarios</Link>}
          {usuario.rol === "superusuario" && <Link to="/dashboard">Dashboard</Link>}
          <span className="usuario">
            {usuario.nombre} ({usuario.rol})
          </span>
          <button
            className="secundario"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Salir
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/entrada/:token" element={<Entrada />} />

            <Route path="/" element={<RutaProtegida><EventosList /></RutaProtegida>} />

            <Route
              path="/eventos/nuevo"
              element={
                <RutaProtegida roles={["admin", "superusuario"]}>
                  <CrearEvento />
                </RutaProtegida>
              }
            />
            <Route path="/eventos/:id" element={<RutaProtegida><EventoDetalle /></RutaProtegida>} />
            <Route
              path="/eventos/:id/cupones"
              element={
                <RutaProtegida roles={["admin", "superusuario"]}>
                  <Cupones />
                </RutaProtegida>
              }
            />
            <Route
              path="/eventos/:id/reportes"
              element={
                <RutaProtegida roles={["admin", "superusuario"]}>
                  <Reportes />
                </RutaProtegida>
              }
            />

            <Route
              path="/ventas"
              element={
                <RutaProtegida roles={["vendedor", "admin", "superusuario"]}>
                  <HistorialVentas />
                </RutaProtegida>
              }
            />

            <Route
              path="/usuarios"
              element={
                <RutaProtegida roles={["admin", "superusuario"]}>
                  <Usuarios />
                </RutaProtegida>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RutaProtegida roles={["superusuario"]}>
                  <DashboardSuperusuario />
                </RutaProtegida>
              }
            />

            <Route
              path="/escaneo"
              element={
                <RutaProtegida roles={["puerta", "admin", "superusuario"]}>
                  <Escaneo />
                </RutaProtegida>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
