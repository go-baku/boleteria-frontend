import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import SeatMap from "../components/SeatMap.jsx";
import VentaForm from "../components/VentaForm.jsx";
import VentaConfirmada from "../components/VentaConfirmada.jsx";

export default function EventoDetalle() {
  const { id } = useParams();
  const { token, usuario } = useAuth();
  const [asientos, setAsientos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]); // ids
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(""); // aviso de conflicto (409), separado del error del form
  // Guardamos venta + la lista de asientos tal como estaban seleccionados
  // al momento de confirmar, para poder mostrar la etiqueta de cada uno.
  const [confirmacion, setConfirmacion] = useState(null);

  const cargarMapa = useCallback(() => {
    api
      .get(`/api/eventos/${id}/mapa`, token)
      .then(setAsientos)
      .catch((e) => setError(e.message));
  }, [id, token]);

  useEffect(() => {
    cargarMapa();
  }, [cargarMapa]);

  function toggleAsiento(asientoId) {
    setSeleccionados((prev) =>
      prev.includes(asientoId) ? prev.filter((x) => x !== asientoId) : [...prev, asientoId]
    );
  }

  const puedeVender = ["vendedor", "admin", "superusuario"].includes(usuario?.rol);
  const asientosSeleccionadosObj = asientos.filter((a) => seleccionados.includes(a.id));

  function handleVentaCreada(venta) {
    setAviso("");
    setConfirmacion({ venta, asientos: asientosSeleccionadosObj });
    setSeleccionados([]);
    cargarMapa();
  }

  // Otro vendedor se adelantó y vendió alguno de los asientos elegidos:
  // se limpia la selección y se recarga el mapa con el estado real.
  function handleConflicto() {
    setAviso("Uno de los asientos elegidos ya fue vendido por otra persona. Recargamos el mapa, elegí de nuevo.");
    setSeleccionados([]);
    cargarMapa();
  }

  return (
    <div className="container">
      <h1>Mapa de asientos</h1>
      {error && <p className="error">{error}</p>}

      {confirmacion ? (
        <VentaConfirmada
          venta={confirmacion.venta}
          asientosSeleccionados={confirmacion.asientos}
          onCerrar={() => setConfirmacion(null)}
        />
      ) : (
        <>
          {aviso && <p className="warning card">{aviso}</p>}

          <SeatMap asientos={asientos} seleccionados={seleccionados} onToggle={puedeVender ? toggleAsiento : undefined} />

          {puedeVender && asientosSeleccionadosObj.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h2>Datos de la venta</h2>
              <VentaForm
                eventoId={id}
                asientosSeleccionados={asientosSeleccionadosObj}
                onVentaCreada={handleVentaCreada}
                onConflicto={handleConflicto}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
