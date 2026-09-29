import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const ROLES = ["puerta", "vendedor", "admin", "superusuario"];

export default function Usuarios() {
  const { token, usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "", rol: "vendedor" });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(() => {
    api.get("/api/usuarios", token).then(setUsuarios).catch((e) => setError(e.message));
  }, [token]);

  useEffect(cargar, [cargar]);

  async function crear(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    try {
      await api.post("/api/usuarios", form, token);
      setForm({ nombre: "", apellido: "", email: "", password: "", rol: "vendedor" });
      setMensaje("Usuario creado");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarEstado(u) {
    setError("");
    try {
      await api.put(`/api/usuarios/${u.id}/estado`, { activo: !u.activo }, token);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarRol(u, nuevoRol) {
    setError("");
    try {
      await api.put(`/api/usuarios/${u.id}/rol`, { rol: nuevoRol }, token);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <h1>Usuarios</h1>

      <form onSubmit={crear} className="card" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
        <Campo label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
        <Campo label="Apellido" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} required />
        <Campo label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Campo label="Contraseña" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        <label className="campo">
          Rol
          <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            {ROLES.filter((r) => yo.rol === "superusuario" || !["admin", "superusuario"].includes(r)).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Crear usuario</button>
      </form>

      {error && <p className="error">{error}</p>}
      {mensaje && <p className="ok">{mensaje}</p>}

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.5 }}>
              <td>{u.nombre} {u.apellido}</td>
              <td>{u.email}</td>
              <td>
                {yo.rol === "superusuario" && u.id !== yo.id ? (
                  <select value={u.rol} onChange={(e) => cambiarRol(u, e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  u.rol
                )}
              </td>
              <td>{u.activo ? "activo" : "inactivo"}</td>
              <td>
                {u.id !== yo.id && (
                  <button type="button" onClick={() => cambiarEstado(u)}>
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="campo">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </label>
  );
}
