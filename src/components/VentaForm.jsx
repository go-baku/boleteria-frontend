import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const METODOS_PAGO = ["efectivo", "transferencia", "tarjeta", "mercado_pago"];

/**
 * @param {number} eventoId
 * @param {Array} asientosSeleccionados  [{ id, etiqueta, sector }]
 * @param {() => void} onVentaCreada
 */
export default function VentaForm({ eventoId, asientosSeleccionados, onVentaCreada, onConflicto }) {
  const { token } = useAuth();
  const [comprador, setComprador] = useState({ nombre: "", apellido: "", contacto: "", email: "" });
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [cuponCodigo, setCuponCodigo] = useState("");
  const [ocupantes, setOcupantes] = useState(() =>
    Object.fromEntries(asientosSeleccionados.map((a) => [a.id, { nombre: "", apellido: "", contacto: "", email: "" }]))
  );
  const [copiarComprador, setCopiarComprador] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  function actualizarOcupante(asientoId, campo, valor) {
    setOcupantes((prev) => ({ ...prev, [asientoId]: { ...prev[asientoId], [campo]: valor } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const asientos = asientosSeleccionados.map((a) => ({
        evento_asiento_id: a.id,
        ocupante: copiarComprador ? comprador : ocupantes[a.id],
      }));

      const venta = await api.post(
        "/api/ventas",
        {
          evento_id: eventoId,
          comprador,
          metodo_pago: metodoPago,
          cupon_codigo: cuponCodigo || undefined,
          asientos,
        },
        token
      );
      onVentaCreada(venta);
    } catch (err) {
      setError(err.message);
      if (err.status === 409) onConflicto?.();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
      <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <legend>Comprador</legend>
        <Campo label="Nombre" value={comprador.nombre} onChange={(v) => setComprador({ ...comprador, nombre: v })} required />
        <Campo label="Apellido" value={comprador.apellido} onChange={(v) => setComprador({ ...comprador, apellido: v })} required />
        <Campo label="Contacto (WhatsApp)" value={comprador.contacto} onChange={(v) => setComprador({ ...comprador, contacto: v })} />
        <Campo label="Email" type="email" value={comprador.email} onChange={(v) => setComprador({ ...comprador, email: v })} />
      </fieldset>

      <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
        <input type="checkbox" checked={copiarComprador} onChange={(e) => setCopiarComprador(e.target.checked)} />
        Todos los asientos son para el comprador (no hay otros ocupantes)
      </label>

      {!copiarComprador &&
        asientosSeleccionados.map((a) => (
          <fieldset key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <legend>Ocupante — asiento {a.etiqueta}</legend>
            <Campo label="Nombre" value={ocupantes[a.id]?.nombre} onChange={(v) => actualizarOcupante(a.id, "nombre", v)} required />
            <Campo label="Apellido" value={ocupantes[a.id]?.apellido} onChange={(v) => actualizarOcupante(a.id, "apellido", v)} required />
            <Campo label="Contacto" value={ocupantes[a.id]?.contacto} onChange={(v) => actualizarOcupante(a.id, "contacto", v)} />
            <Campo label="Email" type="email" value={ocupantes[a.id]?.email} onChange={(v) => actualizarOcupante(a.id, "email", v)} />
          </fieldset>
        ))}

      <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <legend>Pago</legend>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          Método de pago
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={{ display: "block", width: "100%" }}>
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <Campo label="Cupón (opcional)" value={cuponCodigo} onChange={setCuponCodigo} />
      </fieldset>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <button type="submit" disabled={enviando}>
        {enviando ? "Confirmando..." : `Confirmar venta (${asientosSeleccionados.length} asiento/s)`}
      </button>
    </form>
  );
}

function Campo({ label, value, onChange, type = "text", required = false }) {
  return (
    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
      {label}
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ display: "block", width: "100%" }}
      />
    </label>
  );
}
