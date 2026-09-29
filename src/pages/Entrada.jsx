import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";

const COLOR_FONDO = { azul: "#2563eb", verde: "#16a34a", rojo: "#dc2626" };

export default function Entrada() {
  const { token } = useParams();
  const [entrada, setEntrada] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/entradas/${token}`)
      .then(setEntrada)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p style={{ padding: 24, fontFamily: "sans-serif", color: "#dc2626" }}>{error}</p>;
  if (!entrada) return <p style={{ padding: 24, fontFamily: "sans-serif" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 360, margin: "40px auto", fontFamily: "sans-serif", textAlign: "center" }}>
      <div
        style={{
          background: COLOR_FONDO[entrada.color] || "#555",
          color: "#fff",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h2 style={{ margin: 0 }}>{entrada.evento}</h2>
        <p style={{ margin: "6px 0" }}>{new Date(entrada.fecha_hora_inicio).toLocaleString("es-AR")}</p>
        <p style={{ fontSize: 20, fontWeight: 700 }}>Asiento {entrada.asiento}</p>
        <p>{entrada.ocupante}</p>
        <p style={{ textTransform: "uppercase", fontSize: 13, opacity: 0.9 }}>
          {entrada.anulada ? "anulada" : entrada.estado}
        </p>
      </div>

      <img src={api.url(`/api/entradas/${token}/qr.png`)} alt="QR" style={{ marginTop: 16, width: 220 }} />
    </div>
  );
}
