import { useEffect, useState, useCallback, Fragment } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import SelectorAsientoLibre from "../components/SelectorAsientoLibre.jsx";

export default function HistorialVentas() {
  const { token, usuario } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [verTodas, setVerTodas] = useState(false);
  const [error, setError] = useState("");
  const [expandido, setExpandido] = useState(null); // venta_id con detalle abierto
  const [detalle, setDetalle] = useState(null);
  const [editandoItem, setEditandoItem] = useState(null); // venta_asiento_id
  const [reloadSelector, setReloadSelector] = useState(0); // fuerza refetch del selector tras un 409

  const puedeVerTodas = ["admin", "superusuario"].includes(usuario?.rol);

  const cargar = useCallback(() => {
    api
      .get(`/api/ventas${verTodas && puedeVerTodas ? "?todas=1" : ""}`, token)
      .then(setVentas)
      .catch((e) => setError(e.message));
  }, [token, verTodas, puedeVerTodas]);

  useEffect(cargar, [cargar]);

  async function verDetalle(ventaId) {
    if (expandido === ventaId) {
      setExpandido(null);
      setDetalle(null);
      return;
    }
    setExpandido(ventaId);
    try {
      const data = await api.get(`/api/ventas/${ventaId}/detalle`, token);
      setDetalle(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelarVenta(ventaId) {
    if (!confirm("¿Cancelar esta venta? Se liberan los asientos.")) return;
    setError("");
    try {
      await api.del(`/api/ventas/${ventaId}`, token);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarAsiento(ventaId, ventaAsientoId, nuevoEventoAsientoId) {
    setError("");
    try {
      await api.put(
        `/api/ventas/${ventaId}/asiento`,
        { venta_asiento_id: ventaAsientoId, nuevo_evento_asiento_id: nuevoEventoAsientoId },
        token
      );
      setEditandoItem(null);
      const data = await api.get(`/api/ventas/${ventaId}/detalle`, token);
      setDetalle(data);
    } catch (err) {
      setError(err.message);
      if (err.status === 409) setReloadSelector((n) => n + 1); // el asiento ya no estaba libre: refrescar opciones
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>Historial de ventas</h1>

      {puedeVerTodas && (
        <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", marginBottom: 12 }}>
          <input type="checkbox" checked={verTodas} onChange={(e) => setVerTodas(e.target.checked)} />
          Ver todas (no solo las mías)
        </label>
      )}

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>#</th>
            <th>Comprador</th>
            <th>Vendedor</th>
            <th>Pago</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => {
            const minutosPasados = (Date.now() - new Date(v.creado_en + "Z").getTime()) / 60000;
            const puedeCancelarVendedor = usuario.rol === "vendedor" && v.vendedor_id === usuario.id && minutosPasados < 15;
            const puedeGestionar = ["admin", "superusuario"].includes(usuario.rol) || puedeCancelarVendedor;

            return (
              <Fragment key={v.id}>
                <tr style={{ borderBottom: "1px solid #f3f4f6", opacity: v.estado === "activa" ? 1 : 0.5 }}>
                  <td>{v.id}</td>
                  <td>{v.comprador_nombre} {v.comprador_apellido}</td>
                  <td>{v.vendedor_nombre} {v.vendedor_apellido}</td>
                  <td>{v.metodo_pago}</td>
                  <td>${v.monto_total?.toFixed?.(2) ?? v.monto_total}</td>
                  <td>{v.estado}</td>
                  <td>{new Date(v.creado_en + "Z").toLocaleString("es-AR")}</td>
                  <td>
                    <button type="button" onClick={() => verDetalle(v.id)}>
                      {expandido === v.id ? "Ocultar" : "Detalle"}
                    </button>
                    {v.estado === "activa" && puedeGestionar && (
                      <button type="button" onClick={() => cancelarVenta(v.id)} style={{ marginLeft: 6 }}>
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
                {expandido === v.id && detalle && (
                  <tr>
                    <td colSpan={8} style={{ background: "#f9fafb", padding: 10 }}>
                      {detalle.items.map((it) => (
                        <div key={it.venta_asiento_id} style={{ marginBottom: 6 }}>
                          <b>{it.etiqueta}</b> ({it.sector}) — {it.ocupante_nombre} {it.ocupante_apellido} — {it.estado}
                          {" "}${(it.precio_unitario - it.descuento_aplicado).toFixed(2)}
                          {it.estado === "vendido" && v.estado === "activa" && (
                            <button
                              type="button"
                              onClick={() => setEditandoItem(editandoItem === it.venta_asiento_id ? null : it.venta_asiento_id)}
                              style={{ marginLeft: 8, fontSize: 12 }}
                            >
                              Cambiar asiento
                            </button>
                          )}
                          {editandoItem === it.venta_asiento_id && (
                            <SelectorAsientoLibre
                              key={reloadSelector}
                              eventoId={v.evento_id}
                              sector={it.sector}
                              onElegir={(nuevoId) => cambiarAsiento(v.id, it.venta_asiento_id, nuevoId)}
                              onCancelar={() => setEditandoItem(null)}
                            />
                          )}
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {ventas.length === 0 && (
            <tr>
              <td colSpan={8}>No hay ventas registradas todavía.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
