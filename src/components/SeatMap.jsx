import { useMemo } from "react";

// Colores según especificación:
// disponible = blanco/borde verde, seleccionado (local) = azul,
// vendido = rojo, reservado = gris, no_habilitado = gris con rayas.
const COLORES = {
  disponible: "#ffffff",
  seleccionado: "#2563eb",
  vendido: "#dc2626",
  reservado: "#9ca3af",
  no_habilitado: "url(#rayado)",
};

const BORDE = {
  disponible: "#16a34a",
  seleccionado: "#1d4ed8",
  vendido: "#991b1b",
  reservado: "#6b7280",
  no_habilitado: "#6b7280",
};

const SEAT_W = 26;
const SEAT_H = 22;
const GAP_X = 4;
const GAP_Y = 6;
const BLOQUE_GAP = 40; // separación entre bloque izquierdo y derecho

const FILAS_GENERAL = ["A", "B", "C", "D", "E", "F", "G"];

/**
 * Arma la posición (x,y) de cada asiento según sector/lado/fila/numero,
 * replicando el plano: General en 2 bloques de 8 columnas con las filas
 * A-G, y Gradas en 2 bloques de 3 filas x 4 columnas a los costados.
 */
function useLayout(asientos) {
  return useMemo(() => {
    const posiciones = {};

    // --- General ---
    FILAS_GENERAL.forEach((fila, filaIdx) => {
      for (let col = 0; col < 8; col++) {
        // Izquierdo: numero 1-8
        posiciones[`general-izquierdo-${fila}-${col + 1}`] = {
          x: col * (SEAT_W + GAP_X),
          y: filaIdx * (SEAT_H + GAP_Y),
        };
        // Derecho: numero 9-16
        posiciones[`general-derecho-${fila}-${col + 9}`] = {
          x: 8 * (SEAT_W + GAP_X) + BLOQUE_GAP + col * (SEAT_W + GAP_X),
          y: filaIdx * (SEAT_H + GAP_Y),
        };
      }
    });

    const altoGeneral = FILAS_GENERAL.length * (SEAT_H + GAP_Y);

    // --- Gradas: 3 filas x 4 columnas, a cada costado, más abajo ---
    for (let fila = 1; fila <= 3; fila++) {
      for (let col = 1; col <= 4; col++) {
        posiciones[`gradas-izquierdo-F${fila}-${col}`] = {
          x: (col - 1) * (SEAT_W + GAP_X),
          y: altoGeneral + 30 + (fila - 1) * (SEAT_H + GAP_Y),
        };
        posiciones[`gradas-derecho-F${fila}-${col}`] = {
          x: 8 * (SEAT_W + GAP_X) + BLOQUE_GAP + 2 * (SEAT_W + GAP_X) + (col - 1) * (SEAT_W + GAP_X),
          y: altoGeneral + 30 + (fila - 1) * (SEAT_H + GAP_Y),
        };
      }
    }

    return posiciones;
  }, [asientos]);
}

/**
 * @param {Array} asientos  resultado de GET /api/eventos/:id/mapa
 *                          [{ id, sector, lado, fila, numero, etiqueta, estado }]
 * @param {number[]} seleccionados  ids (evento_asiento id) elegidos localmente
 * @param {(id:number)=>void} onToggle  click sobre un asiento disponible/seleccionado
 */
export default function SeatMap({ asientos, seleccionados = [], onToggle }) {
  const posiciones = useLayout(asientos);

  const ancho = 8 * (SEAT_W + GAP_X) * 2 + BLOQUE_GAP + 20;
  const alto =
    FILAS_GENERAL.length * (SEAT_H + GAP_Y) + 30 + 3 * (SEAT_H + GAP_Y) + 20;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={ancho} height={alto + 40} viewBox={`0 0 ${ancho} ${alto + 40}`}>
        <defs>
          <pattern id="rayado" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#9ca3af" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" strokeWidth="2" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={ancho} height="20" fill="#111827" rx="4" />
        <text x={ancho / 2} y="14" textAnchor="middle" fill="#fff" fontSize="10">
          ESCENARIO
        </text>

        {asientos.map((a) => {
          const key = `${a.sector}-${a.lado}-${a.fila}-${a.numero}`;
          const pos = posiciones[key];
          if (!pos) return null;

          const estaSeleccionado = seleccionados.includes(a.id);
          const estadoVisual = estaSeleccionado ? "seleccionado" : a.estado;
          const clickeable = a.estado === "disponible";

          return (
            <g
              key={a.id}
              transform={`translate(${pos.x}, ${pos.y + 30})`}
              onClick={() => clickeable && onToggle?.(a.id)}
              style={{ cursor: clickeable ? "pointer" : "not-allowed" }}
            >
              <rect
                width={SEAT_W}
                height={SEAT_H}
                rx="4"
                fill={COLORES[estadoVisual] || "#fff"}
                stroke={BORDE[estadoVisual] || "#000"}
                strokeWidth="1.5"
              />
              <text
                x={SEAT_W / 2}
                y={SEAT_H / 2 + 3}
                textAnchor="middle"
                fontSize="8"
                fill={estadoVisual === "vendido" || estadoVisual === "seleccionado" ? "#fff" : "#111"}
              >
                {a.numero}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap", fontSize: 13 }}>
        <Leyenda color={COLORES.disponible} borde={BORDE.disponible} label="Disponible" />
        <Leyenda color={COLORES.seleccionado} borde={BORDE.seleccionado} label="Seleccionado" />
        <Leyenda color={COLORES.vendido} borde={BORDE.vendido} label="Vendido" />
        <Leyenda color={COLORES.reservado} borde={BORDE.reservado} label="Reservado" />
        <Leyenda color={COLORES.no_habilitado} borde={BORDE.no_habilitado} label="No habilitado" />
      </div>
    </div>
  );
}

function Leyenda({ color, borde, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 16, height: 16, background: color, border: `1.5px solid ${borde}`, borderRadius: 3, display: "inline-block" }} />
      {label}
    </div>
  );
}
