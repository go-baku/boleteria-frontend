import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

export default function CrearEvento() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    fecha_hora_inicio: "",
    cant_general: 112,
    cant_gradas: 24,
    precio_general: "",
    precio_gradas: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const evento = await api.post(
        "/api/eventos",
        {
          ...form,
          cant_general: Number(form.cant_general),
          cant_gradas: Number(form.cant_gradas),
          precio_general: Number(form.precio_general) || 0,
          precio_gradas: Number(form.precio_gradas) || 0,
        },
        token
      );
      navigate(`/eventos/${evento.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 420 }}>
      <h1 style={{ fontSize: 20 }}>Crear evento</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <Campo label="Nombre" value={form.nombre} onChange={(v) => set("nombre", v)} required />
        <Campo
          label="Fecha y hora de inicio"
          type="datetime-local"
          value={form.fecha_hora_inicio}
          onChange={(v) => set("fecha_hora_inicio", v)}
          required
        />
        <Campo
          label="Asientos generales habilitados (máx. 112)"
          type="number"
          value={form.cant_general}
          onChange={(v) => set("cant_general", v)}
          max={112}
        />
        <Campo
          label="Asientos en gradas habilitados (máx. 24)"
          type="number"
          value={form.cant_gradas}
          onChange={(v) => set("cant_gradas", v)}
          max={24}
        />
        <Campo label="Precio general" type="number" value={form.precio_general} onChange={(v) => set("precio_general", v)} />
        <Campo label="Precio gradas" type="number" value={form.precio_gradas} onChange={(v) => set("precio_gradas", v)} />

        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? "Creando..." : "Crear evento"}
        </button>
      </form>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", required = false, max }) {
  return (
    <label style={{ display: "block", fontSize: 13 }}>
      {label}
      <input
        type={type}
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ display: "block", width: "100%" }}
      />
    </label>
  );
}
