import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reportes() {
  const { id: eventoId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    api
      .get(`/api/reportes/evento/${eventoId}`, token)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [eventoId, token]);

  async function descargar(formato) {
    try {
      const blob = await api.blob(`/api/reportes/evento/${eventoId}/${formato}`, { token });
      descargarBlob(blob, `reporte-${eventoId}.${formato === "excel" ? "xlsx" : "pdf"}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function enviar(canal, formato = "pdf") {
    setEnviando(true);
    setMensaje("");
    try {
      await api.post(`/api/reportes/evento/${eventoId}/enviar`, { canal, email: email || undefined, whatsapp: whatsapp || undefined, formato }, token);
      setMensaje("Reporte enviado");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (error) return <p style={{ padding: 24, color: "#dc2626" }}>{error}</p>;
  if (!data) return <p style={{ padding: 24 }}>Cargando...</p>;

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 600 }}>
      <h1 style={{ fontSize: 20 }}>Reporte — {data.evento.nombre}</h1>

      <div style={{ display: "flex", gap: 16, margin: "16px 0", fontSize: 14 }}>
        <span>Vendidas: <b>{data.totales.cantidad_vendida}</b></span>
        <span>Total: <b>${data.totales.monto_total.toFixed(2)}</b></span>
        <span>Descuentos: <b>${data.totales.monto_descuento.toFixed(2)}</b></span>
        <span>Asistentes: <b>{data.totales.asistentes}</b></span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button type="button" onClick={() => descargar("pdf")}>Descargar PDF</button>
        <button type="button" onClick={() => descargar("excel")}>Descargar Excel</button>
      </div>

      <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, maxWidth: 340 }}>
        <legend>Enviar reporte</legend>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: "block", width: "100%" }} />
        </label>
        <button type="button" disabled={!email || enviando} onClick={() => enviar("mail")} style={{ marginBottom: 10 }}>
          Enviar por mail
        </button>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          WhatsApp
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ display: "block", width: "100%" }} />
        </label>
        <button type="button" disabled={!whatsapp || enviando} onClick={() => enviar("whatsapp")}>
          Enviar por WhatsApp
        </button>
        {mensaje && <p style={{ color: "#16a34a", fontSize: 13 }}>{mensaje}</p>}
      </fieldset>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 24 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Asiento</th><th>Ocupante</th><th>Comprador</th><th>Vendedor</th><th>Pago</th><th>Monto</th><th>Asistencia</th>
          </tr>
        </thead>
        <tbody>
          {data.filas.map((f, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{f.etiqueta}</td>
              <td>{f.ocupante_nombre} {f.ocupante_apellido}</td>
              <td>{f.comprador_nombre} {f.comprador_apellido}</td>
              <td>{f.vendedor_nombre} {f.vendedor_apellido}</td>
              <td>{f.metodo_pago}</td>
              <td>${(f.precio_unitario - f.descuento_aplicado).toFixed(2)}</td>
              <td>{f.asistencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
