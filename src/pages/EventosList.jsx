import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

export default function EventosList() {
  const { token, usuario } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState("");
  const esAdmin = ["admin", "superusuario"].includes(usuario?.rol);

  useEffect(() => {
    api
      .get("/api/eventos", token)
      .then(setEventos)
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>Eventos</h1>
        {esAdmin && <Link to="/eventos/nuevo">+ Nuevo evento</Link>}
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {eventos.map((ev) => (
          <li key={ev.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <Link to={`/eventos/${ev.id}`} style={{ fontWeight: 600 }}>
              {ev.nombre}
            </Link>
            <div style={{ fontSize: 13, color: "#555" }}>
              {new Date(ev.fecha_hora_inicio).toLocaleString("es-AR")} — estado: {ev.estado}
            </div>
            {esAdmin && (
              <div style={{ fontSize: 12, display: "flex", gap: 10, marginTop: 6 }}>
                <Link to={`/eventos/${ev.id}/cupones`}>Cupones</Link>
                <Link to={`/eventos/${ev.id}/reportes`}>Reportes</Link>
              </div>
            )}
          </li>
        ))}
        {eventos.length === 0 && !error && <p>No hay eventos cargados todavía.</p>}
      </ul>
    </div>
  );
}
