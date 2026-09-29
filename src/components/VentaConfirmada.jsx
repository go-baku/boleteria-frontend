import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

/**
 * @param {object} venta  respuesta de POST /api/ventas ({ id, entradas: [{venta_asiento_id, token}] })
 * @param {Array} asientosSeleccionados  mismo orden que se mandó al crear la venta, [{id, etiqueta}]
 */
export default function VentaConfirmada({ venta, asientosSeleccionados, onCerrar }) {
  return (
    <div style={{ border: "1px solid #16a34a", background: "#f0fdf4", borderRadius: 8, padding: 16, maxWidth: 480 }}>
      <p style={{ fontWeight: 700, color: "#166534" }}>Venta confirmada (#{venta.id})</p>
      <p style={{ fontSize: 13 }}>
        Total: ${venta.monto_total?.toFixed?.(2) ?? venta.monto_total}
        {venta.monto_descuento > 0 && ` (descuento: $${venta.monto_descuento.toFixed(2)})`}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {venta.entradas.map((entrada, i) => (
          <EntradaRow
            key={entrada.venta_asiento_id}
            ventaId={venta.id}
            entrada={entrada}
            etiqueta={asientosSeleccionados[i]?.etiqueta}
          />
        ))}
      </div>

      <button style={{ marginTop: 14 }} onClick={onCerrar}>
        Listo, volver al mapa
      </button>
    </div>
  );
}

function EntradaRow({ ventaId, entrada, etiqueta }) {
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [estado, setEstado] = useState(""); // "", "enviando", "ok", "error"
  const [mensaje, setMensaje] = useState("");

  async function enviar(canal) {
    setEstado("enviando");
    setMensaje("");
    try {
      await api.post(
        `/api/ventas/${ventaId}/asientos/${entrada.venta_asiento_id}/enviar`,
        { canal, email: email || undefined, whatsapp: whatsapp || undefined },
        token
      );
      setEstado("ok");
      setMensaje("Enviado");
    } catch (err) {
      setEstado("error");
      setMensaje(err.message);
    }
  }

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 10, background: "#fff" }}>
      <p style={{ fontSize: 13, fontWeight: 600 }}>Asiento {etiqueta}</p>
      <a href={api.url(`/api/entradas/${entrada.token}/qr.png`)} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
        Ver QR
      </a>

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, fontSize: 12 }} />
        <button type="button" onClick={() => enviar("mail")} disabled={!email || estado === "enviando"}>
          Mail
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ flex: 1, fontSize: 12 }} />
        <button type="button" onClick={() => enviar("whatsapp")} disabled={!whatsapp || estado === "enviando"}>
          WhatsApp
        </button>
      </div>

      {mensaje && (
        <p style={{ fontSize: 12, color: estado === "error" ? "#dc2626" : "#16a34a", marginTop: 4 }}>{mensaje}</p>
      )}
    </div>
  );
}
