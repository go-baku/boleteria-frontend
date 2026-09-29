import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const LECTOR_ID = "lector-qr";

/** El QR codifica una URL tipo https://tu-app/entrada/<token>; extraemos el token. */
function extraerToken(textoEscaneado) {
  try {
    const url = new URL(textoEscaneado);
    const partes = url.pathname.split("/").filter(Boolean);
    return partes[partes.length - 1];
  } catch {
    // Si no es una URL válida, se asume que ya es el token pelado.
    return textoEscaneado.trim();
  }
}

export default function Escaneo() {
  const { token: authToken } = useAuth();
  const [entradaToken, setEntradaToken] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const lectorRef = useRef(null);
  const procesandoRef = useRef(false);

  async function escanear(token) {
    if (!token || procesandoRef.current) return;
    procesandoRef.current = true;
    setError("");
    setResultado(null);
    setCargando(true);
    try {
      const data = await api.post(`/api/entradas/${token}/escanear`, {}, authToken);
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
      // Pequeña pausa para no reprocesar el mismo QR mientras sigue en cuadro.
      setTimeout(() => (procesandoRef.current = false), 2000);
    }
  }

  useEffect(() => {
    if (!camaraActiva) return;
    const lector = new Html5Qrcode(LECTOR_ID);
    lectorRef.current = lector;

    lector
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (textoDecodificado) => escanear(extraerToken(textoDecodificado)),
        () => {} // errores de "no se detectó QR en este frame": se ignoran
      )
      .catch((err) => setError(`No se pudo abrir la cámara: ${err}`));

    return () => {
      lector.stop().then(() => lector.clear()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camaraActiva]);

  const colorResultado = {
    valido: "#16a34a",
    ya_usado: "#d97706",
    expirado: "#dc2626",
    invalido: "#dc2626",
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 420 }}>
      <h1 style={{ fontSize: 20 }}>Escaneo de entradas</h1>

      <button type="button" onClick={() => setCamaraActiva((v) => !v)} style={{ marginTop: 12 }}>
        {camaraActiva ? "Apagar cámara" : "Escanear con cámara"}
      </button>

      {camaraActiva && <div id={LECTOR_ID} style={{ width: "100%", marginTop: 12 }} />}

      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
        También podés pegar el token manualmente:
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          escanear(entradaToken);
          setEntradaToken("");
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          placeholder="Token de la entrada"
          value={entradaToken}
          onChange={(e) => setEntradaToken(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={cargando || !entradaToken}>
          Verificar
        </button>
      </form>

      {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}

      {resultado && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 8,
            color: "#fff",
            background: colorResultado[resultado.resultado] || "#555",
          }}
        >
          <p style={{ fontWeight: 700, textTransform: "uppercase" }}>{resultado.resultado}</p>
          <p>{resultado.mensaje}</p>
          {resultado.ocupante && <p>{resultado.ocupante} — Asiento {resultado.asiento}</p>}
        </div>
      )}
    </div>
  );
}
