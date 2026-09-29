import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

export default function DashboardSuperusuario() {
  const { token } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [correos, setCorreos] = useState([]);
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/reportes/dashboard", token).then(setEventos).catch((e) => setError(e.message));
    api.get("/api/reportes/correos-institucionales", token).then(setCorreos).catch(() => {});
  }, [token]);

  async function agregarCorreo(e) {
    e.preventDefault();
    try {
      await api.post("/api/reportes/correos-institucionales", { email: nuevoCorreo }, token);
      setNuevoCorreo("");
      const data = await api.get("/api/reportes/correos-institucionales", token);
      setCorreos(data);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalGeneral = eventos.reduce((acc, e) => acc + e.monto_total, 0);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 700 }}>
      <h1 style={{ fontSize: 20 }}>Dashboard general</h1>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <p style={{ fontSize: 14 }}>
        Total acumulado de todos los eventos: <b>${totalGeneral.toFixed(2)}</b>
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Evento</th><th>Fecha</th><th>Vendidas</th><th>Monto</th><th></th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{e.nombre}</td>
              <td>{new Date(e.fecha_hora_inicio).toLocaleDateString("es-AR")}</td>
              <td>{e.cantidad_vendida}</td>
              <td>${e.monto_total.toFixed(2)}</td>
              <td><Link to={`/eventos/${e.id}/reportes`}>Ver reporte</Link></td>
            </tr>
          ))}
        </tbody>
      </table>

      <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginTop: 24, maxWidth: 360 }}>
        <legend>Correos institucionales (reportes automáticos 24hs)</legend>
        <ul style={{ fontSize: 13, paddingLeft: 18 }}>
          {correos.map((c) => (
            <li key={c.id}>{c.email}</li>
          ))}
        </ul>
        <form onSubmit={agregarCorreo} style={{ display: "flex", gap: 6 }}>
          <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} required style={{ flex: 1 }} />
          <button type="submit">Agregar</button>
        </form>
      </fieldset>
    </div>
  );
}
