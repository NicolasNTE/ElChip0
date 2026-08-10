/**
 * Actividades.gs — El modelo.
 *
 * Traduce entre la fila del Sheet (lo que ve Administración) y el objeto
 * que consumen las tres vistas. Aquí viven las reglas derivadas: avance,
 * vencimiento, señales de alerta. Nada de eso se escribe a mano.
 */

/** Índice nombre-de-persona -> persona, para resolver el Encargado. */
function _indicePersonasPorNombre() {
  const idx = {};
  listarPersonas().forEach(function (p) {
    if (p.nombre) idx[p.nombre.trim().toLowerCase()] = p;
  });
  return idx;
}

/** Convierte una fila de la Tabla Madre en objeto de dominio. */
function filaAActividad(fila, indicePersonas, hoy) {
  const C = CONFIG.COLS;
  const idx = indicePersonas || _indicePersonasPorNombre();
  const ref = hoy || new Date();

  const encargadoNombre = String(fila[C.ENCARGADO] || '').trim();
  const persona = idx[encargadoNombre.toLowerCase()];
  const estado = String(fila[C.ESTADO] || '').trim() || DEFAULTS.ESTADO;
  const fechaLimite = aFecha(fila[C.FECHA_LIMITE]);
  const actualizadoEn = aFecha(fila[C.ACTUALIZADO_EN]) || aFecha(fila[C.CREADO_EN]);
  const cerrada = CONFIG.ESTADOS_CERRADOS.indexOf(estado) >= 0;

  const diasParaVencer = fechaLimite ? diasEntre(ref, fechaLimite) : null;
  const diasSinTocar = actualizadoEn ? diasEntre(actualizadoEn, ref) : null;

  const act = {
    id: String(fila[C.ID] || '').trim(),
    fila: fila._fila,
    proyecto: String(fila[C.PROYECTO] || '').trim(),
    actividad: String(fila[C.ACTIVIDAD] || '').trim(),
    etiquetasTexto: String(fila[C.ETIQUETAS] || '').trim(),
    encargado: encargadoNombre,
    encargadoEmail: persona ? persona.email : '',
    fechaLimite: aTextoFecha(fechaLimite),
    prioridad: String(fila[C.PRIORIDAD] || '').trim() || DEFAULTS.PRIORIDAD,
    estado: estado,
    riesgo: normalizarSiNo(fila[C.RIESGO]),
    riesgoDetalle: String(fila[C.RIESGO_DETALLE] || '').trim(),
    bloqueo: normalizarSiNo(fila[C.BLOQUEO]),
    decision: String(fila[C.DECISION] || '').trim(),
    comentario: String(fila[C.COMENTARIO] || '').trim(),
    creadoPor: normalizarEmail(fila[C.CREADO_POR]),
    creadoEn: aTextoFecha(fila[C.CREADO_EN]),
    actualizadoPor: normalizarEmail(fila[C.ACTUALIZADO_POR]),
    actualizadoEn: aTextoFecha(fila[C.ACTUALIZADO_EN]),
  };

  // --- Campos derivados: se calculan, no se ingresan ---
  /** Etiquetas libres (separadas por coma) con las que cualquier rol agrupa tareas de un proyecto. */
  act.etiquetas = act.etiquetasTexto
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(String);
  act.avance = CONFIG.PESO_AVANCE[estado] !== undefined ? CONFIG.PESO_AVANCE[estado] : 0;
  act.cerrada = cerrada;
  act.diasParaVencer = diasParaVencer;
  act.vencida = !cerrada && diasParaVencer !== null && diasParaVencer < 0;
  act.porVencer =
    !cerrada &&
    diasParaVencer !== null &&
    diasParaVencer >= 0 &&
    diasParaVencer <= CONFIG.ALERTAS.DIAS_POR_VENCER;
  act.sinFecha = !cerrada && !fechaLimite;
  act.desactualizada =
    !cerrada && diasSinTocar !== null && diasSinTocar > CONFIG.ALERTAS.DIAS_SIN_ACTUALIZAR;
  act.diasSinTocar = diasSinTocar;
  act.enRiesgo = !cerrada && act.riesgo === 'Si';
  act.esperaGerencia = !cerrada && act.bloqueo === 'Si';

  act.senales = [];
  if (act.vencida) act.senales.push('Vencida');
  if (act.porVencer) act.senales.push('Por vencer');
  if (act.enRiesgo) act.senales.push('Riesgo/Interferencia');
  if (act.esperaGerencia) act.senales.push('Espera Gerencia');
  if (act.desactualizada) act.senales.push('Sin actualizar');
  if (act.sinFecha) act.senales.push('Sin fecha límite');

  /** Semáforo de una sola mirada. */
  act.semaforo = act.cerrada
    ? 'cerrada'
    : act.vencida || act.enRiesgo || act.esperaGerencia
    ? 'rojo'
    : act.porVencer || act.desactualizada || act.sinFecha
    ? 'ambar'
    : 'verde';

  return act;
}

/** Todas las actividades del sistema, ya enriquecidas. */
function todasLasActividades() {
  const tabla = leerTabla(CONFIG.SHEETS.MADRE);
  const idx = _indicePersonasPorNombre();
  const hoy = new Date();
  return tabla.filas
    .filter(function (f) {
      // Filas de relleno sin actividad ni proyecto no son datos.
      return String(f[CONFIG.COLS.ACTIVIDAD] || '').trim() !== '';
    })
    .map(function (f) {
      return filaAActividad(f, idx, hoy);
    });
}

/** Busca una actividad por su ID. */
function actividadPorId(id) {
  const objetivo = String(id || '').trim();
  const encontrada = todasLasActividades().filter(function (a) { return a.id === objetivo; })[0];
  if (!encontrada) throw new Error('No existe la actividad ' + objetivo + '.');
  return encontrada;
}

/**
 * Orden estándar de trabajo: primero lo que arde, luego por fecha, luego
 * por prioridad. Es el orden que la Vista Responsable necesita para que
 * nadie tenga que decidir "¿por dónde empiezo?".
 */
function ordenarParaTrabajo(actividades) {
  const pesoPrioridad = { Alta: 0, Media: 1, Baja: 2 };
  return actividades.slice().sort(function (a, b) {
    if (a.cerrada !== b.cerrada) return a.cerrada ? 1 : -1;
    const semaforos = { rojo: 0, ambar: 1, verde: 2, cerrada: 3 };
    if (semaforos[a.semaforo] !== semaforos[b.semaforo]) {
      return semaforos[a.semaforo] - semaforos[b.semaforo];
    }
    const fa = a.fechaLimite || '9999-12-31';
    const fb = b.fechaLimite || '9999-12-31';
    if (fa !== fb) return fa < fb ? -1 : 1;
    const pa = pesoPrioridad[a.prioridad] === undefined ? 9 : pesoPrioridad[a.prioridad];
    const pb = pesoPrioridad[b.prioridad] === undefined ? 9 : pesoPrioridad[b.prioridad];
    return pa - pb;
  });
}

/**
 * Valida un objeto de entrada antes de escribirlo.
 * @return {Object} valores normalizados listos para el Sheet.
 */
function validarCampos(parche, usuario) {
  const C = CONFIG.COLS;
  const limpio = {};

  Object.keys(parche).forEach(function (campo) {
    var valor = parche[campo];

    switch (campo) {
      case C.ESTADO:
        valor = String(valor).trim();
        if (CONFIG.CATALOGOS.ESTADO.indexOf(valor) < 0) {
          throw new Error('Estado inválido: "' + valor + '".');
        }
        break;

      case C.PRIORIDAD:
        valor = String(valor).trim();
        if (CONFIG.CATALOGOS.PRIORIDAD.indexOf(valor) < 0) {
          throw new Error('Prioridad inválida: "' + valor + '".');
        }
        break;

      case C.RIESGO:
      case C.BLOQUEO:
        valor = normalizarSiNo(valor);
        break;

      case C.FECHA_LIMITE:
        valor = valor ? aFecha(valor) : '';
        if (parche[campo] && !valor) throw new Error('Fecha límite inválida.');
        break;

      case C.ENCARGADO: {
        valor = String(valor).trim();
        if (!valor) throw new Error('La actividad necesita un encargado.');
        const idx = _indicePersonasPorNombre();
        if (!idx[valor.toLowerCase()]) {
          throw new Error(
            'El encargado "' + valor + '" no está en el padrón de Personas. Agrégalo primero.'
          );
        }
        break;
      }

      case C.PROYECTO:
        valor = String(valor).trim();
        if (!valor) throw new Error('La actividad necesita un proyecto.');
        if (listarProyectos().indexOf(valor) < 0) {
          throw new Error('El proyecto "' + valor + '" no está en el catálogo.');
        }
        break;

      case C.ACTIVIDAD:
        valor = String(valor).trim();
        if (!valor) throw new Error('La actividad necesita una descripción.');
        if (valor.length > 500) throw new Error('La descripción es demasiado larga (máx. 500).');
        break;

      case C.ETIQUETAS:
        valor = String(valor || '')
          .split(',')
          .map(function (s) { return s.trim(); })
          .filter(String)
          .join(', ');
        if (valor.length > 300) throw new Error('Las etiquetas son demasiado largas (máx. 300).');
        break;

      default:
        valor = typeof valor === 'string' ? valor.trim() : valor;
        if (typeof valor === 'string' && valor.length > 2000) {
          throw new Error('El texto de "' + campo + '" es demasiado largo (máx. 2000).');
        }
    }

    limpio[campo] = valor;
  });

  // Coherencia: si se pide decisión de Gerencia, hay que decir qué se decide.
  if (limpio[C.BLOQUEO] === 'Si') {
    const detalle = limpio[C.DECISION];
    if (detalle !== undefined && !String(detalle).trim()) {
      throw new Error('Si marcas "Bloqueo de Gerencia", describe qué decisión se necesita.');
    }
  }
  if (limpio[C.RIESGO] === 'Si') {
    const det = limpio[C.RIESGO_DETALLE];
    if (det !== undefined && !String(det).trim()) {
      throw new Error('Si marcas "Riesgo/Interferencia", explica cuál es.');
    }
  }

  return limpio;
}

/**
 * Etiquetas en uso dentro de un conjunto de actividades, sin repetir.
 * No es un catálogo cerrado: cualquiera con permiso escribe la etiqueta que
 * necesita y, en cuanto existe en una fila, aparece aquí para filtrar por ella.
 */
function listarEtiquetas(actividades) {
  const vistas = {};
  const resultado = [];
  actividades.forEach(function (a) {
    (a.etiquetas || []).forEach(function (e) {
      if (!vistas[e]) {
        vistas[e] = true;
        resultado.push(e);
      }
    });
  });
  return resultado.sort(function (a, b) { return a.localeCompare(b); });
}

/** Catálogo vivo de proyectos (hoja Catalogos, columna Proyecto). */
function listarProyectos() {
  const tabla = leerTabla(CONFIG.SHEETS.CATALOGOS);
  return tabla.filas
    .map(function (f) { return String(f['Proyecto'] || '').trim(); })
    .filter(String);
}
