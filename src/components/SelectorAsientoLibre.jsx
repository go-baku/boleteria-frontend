import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

/**
 * Lista simple (no el SVG completo) de asientos disponibles del mismo
 * sector, para elegir el reemplazo al editar una venta.
 */
export default function SelectorAsientoLibre({ eventoId, sector, onElegir, onCancelar }) {
  const { token } = useAuth();
  const [libres, setLibres] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/eventos/${eventoId}/mapa`, token)
      .then((asientos) => setLibres(asientos.filter((a) => a.sector === sector && a.estado === "disponible")))
      .catch((e) => setError(e.message));
  }, [eventoId, sector, token]);

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginTop: 6 }}>
      <p style={{ fontSize: 12, fontWeight: 600 }}>Elegí el nuevo asiento ({sector}):</p>
      {error && <p style={{ color: "#dc2626", fontSize: 12 }}>{error}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {libres.map((a) => (
          <button key={a.id} type="button" onClick={() => onElegir(a.id)} style={{ fontSize: 12 }}>
            {a.etiqueta}
          </button>
        ))}
        {libres.length === 0 && !error && <span style={{ fontSize: 12 }}>No hay asientos libres en esta categoría.</span>}
      </div>
      <button type="button" onClick={onCancelar} style={{ marginTop: 8, fontSize: 12 }}>
        Cancelar
      </button>
    </div>
  );
}
