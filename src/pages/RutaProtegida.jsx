import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RutaProtegida({ roles, children }) {
  const { token, usuario } = useAuth();
  const location = useLocation();

  if (!token || !usuario) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <p style={{ padding: 24 }}>No tenés permiso para ver esta sección.</p>;
  }
  return children;
}
