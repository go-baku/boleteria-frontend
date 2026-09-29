import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

export default function Cupones() {
  const { id: eventoId } = useParams();
  const { token } = useAuth();
  const [cupones, setCupones] = useState([]);
  const [form, setForm] = useState({ codigo: "", tipo: "porcentaje", valor: "" });
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(null); // id del cupón en edición

  const cargar = useCallback(() => {
    api
      .get(`/api/cupones?evento_id=${eventoId}`, token)
      .then(setCupones)
      .catch((e) => setError(e.message));
  }, [eventoId, token]);

  useEffect(cargar, [cargar]);

  async function crear(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/cupones", { evento_id: Number(eventoId), ...form, valor: Number(form.valor) }, token);
      setForm({ codigo: "", tipo: "porcentaje", valor: "" });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarEdicion(cupon, nuevoValor) {
    setError("");
    try {
      await api.put(`/api/cupones/${cupon.id}`, { valor: Number(nuevoValor) }, token);
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(cupon) {
    if (!confirm(`¿Eliminar el cupón ${cupon.codigo}?`)) return;
    setError("");
    try {
      await api.del(`/api/cupones/${cupon.id}`, token);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 520 }}>
      <h1 style={{ fontSize: 20 }}>Cupones / descuentos</h1>

      <form onSubmit={crear} style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 20 }}>
        <input
          placeholder="Código"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          required
        />
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          <option value="porcentaje">%</option>
          <option value="monto_fijo">$ fijo</option>
        </select>
        <input
          type="number"
          placeholder="Valor"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })}
          required
          style={{ width: 90 }}
        />
        <button type="submit">Crear</button>
      </form>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Código</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Estado</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cupones.map((c) => {
            const creadoHace = Date.now() - new Date(c.creado_en + "Z").getTime();
            const editable = creadoHace < 24 * 60 * 60 * 1000;
            return (
              <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6", opacity: c.activo ? 1 : 0.5 }}>
                <td>{c.codigo}</td>
                <td>{c.tipo === "porcentaje" ? "%" : "$"}</td>
                <td>
                  {editando === c.id ? (
                    <EdicionValor valorInicial={c.valor} onGuardar={(v) => guardarEdicion(c, v)} onCancelar={() => setEditando(null)} />
                  ) : (
                    c.valor
                  )}
                </td>
                <td>{c.activo ? "activo" : "eliminado"}</td>
                <td>{editable ? "editable (< 24hs)" : "bloqueado"}</td>
                <td>
                  {c.activo && (
                    <>
                      {editable && editando !== c.id && (
                        <button type="button" onClick={() => setEditando(c.id)} style={{ marginRight: 6 }}>
                          Editar
                        </button>
                      )}
                      <button type="button" onClick={() => eliminar(c)}>
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {cupones.length === 0 && (
            <tr>
              <td colSpan={6}>No hay cupones cargados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EdicionValor({ valorInicial, onGuardar, onCancelar }) {
  const [valor, setValor] = useState(valorInicial);
  return (
    <span style={{ display: "flex", gap: 4 }}>
      <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} style={{ width: 60 }} />
      <button type="button" onClick={() => onGuardar(valor)}>
        ✓
      </button>
      <button type="button" onClick={onCancelar}>
        ✕
      </button>
    </span>
  );
}
