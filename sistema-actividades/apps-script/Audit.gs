/**
 * Audit.gs — Bitácora append-only.
 *
 * Responde tres preguntas que hoy se contestan por WhatsApp:
 * quién cambió qué, cuándo, y desde qué valor.
 * Es también el insumo del indicador "quién no actualiza".
 */

/** Escribe una línea de bitácora. Nunca lanza: auditar no puede romper la operación. */
function registrarBitacora(actor, accion, actividadId, campo, anterior, nuevo) {
  try {
    const B = CONFIG.COLS_BITACORA;
    const registro = {};
    registro[B.FECHA] = new Date();
    registro[B.ACTOR] = actor;
    registro[B.ACCION] = accion;
    registro[B.ACTIVIDAD_ID] = actividadId;
    registro[B.CAMPO] = campo;
    registro[B.ANTERIOR] = _recortar(anterior);
    registro[B.NUEVO] = _recortar(nuevo);
    agregarFila(CONFIG.SHEETS.BITACORA, registro);
  } catch (err) {
    console.error('No se pudo registrar en bitácora: ' + err.message);
  }
}

/** Registra de golpe todos los campos que cambiaron en una edición. */
function registrarCambios(actor, actividadId, antes, parche) {
  Object.keys(parche).forEach(function (campo) {
    const valorAnterior = antes && antes[campo] !== undefined ? antes[campo] : '';
    const valorNuevo = parche[campo];
    if (_texto(valorAnterior) === _texto(valorNuevo)) return; // sin cambio real
    registrarBitacora(actor, 'EDICION', actividadId, campo, valorAnterior, valorNuevo);
  });
}

function _texto(v) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return aTextoFecha(v);
  return String(v).trim();
}

function _recortar(v) {
  const t = _texto(v);
  return t.length > 300 ? t.slice(0, 297) + '...' : t;
}

/** Últimos movimientos de una actividad, para el panel de detalle. */
function historialDe(actividadId, limite) {
  const B = CONFIG.COLS_BITACORA;
  const tope = limite || 20;
  return leerTabla(CONFIG.SHEETS.BITACORA)
    .filas.filter(function (f) {
      return String(f[B.ACTIVIDAD_ID] || '').trim() === String(actividadId).trim();
    })
    .slice(-tope)
    .reverse()
    .map(function (f) {
      return {
        fecha: Utilities.formatDate(
          aFecha(f[B.FECHA]) || new Date(),
          CONFIG.TIMEZONE,
          'yyyy-MM-dd HH:mm'
        ),
        actor: String(f[B.ACTOR] || ''),
        accion: String(f[B.ACCION] || ''),
        campo: String(f[B.CAMPO] || ''),
        anterior: String(f[B.ANTERIOR] || ''),
        nuevo: String(f[B.NUEVO] || ''),
      };
    });
}
