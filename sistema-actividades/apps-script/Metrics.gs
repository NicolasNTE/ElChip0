/**
 * Metrics.gs — Indicadores.
 *
 * Todo se calcula desde la Tabla Madre en el momento de pedirlo.
 * No hay una "hoja de indicadores" que alguien tenga que refrescar:
 * ese es exactamente el error que este sistema elimina.
 */

/**
 * Consolidado para la Vista Gerencial.
 * @param {Object[]} actividades Actividades ya filtradas por permisos.
 */
function calcularIndicadores(actividades) {
  const vivas = actividades.filter(function (a) { return !a.cerrada; });

  const porProyecto = {};
  actividades.forEach(function (a) {
    const p = a.proyecto || '(Sin proyecto)';
    if (!porProyecto[p]) {
      porProyecto[p] = {
        proyecto: p,
        total: 0,
        finalizadas: 0,
        enCurso: 0,
        porHacer: 0,
        vencidas: 0,
        riesgo: 0,
        bloqueos: 0,
        sumaAvance: 0,
        cerradasContadas: 0,
      };
    }
    const g = porProyecto[p];
    if (a.estado === 'Anulado') return; // anuladas no cuentan para el avance
    g.total++;
    g.sumaAvance += a.avance;
    if (a.estado === 'Finalizado') g.finalizadas++;
    if (a.estado === 'En curso') g.enCurso++;
    if (a.estado === 'Por hacer') g.porHacer++;
    if (a.vencida) g.vencidas++;
    if (a.enRiesgo) g.riesgo++;
    if (a.esperaGerencia) g.bloqueos++;
  });

  const proyectos = Object.keys(porProyecto)
    .map(function (k) {
      const g = porProyecto[k];
      g.avance = g.total ? Math.round((g.sumaAvance / g.total) * 100) : 0;
      delete g.sumaAvance;
      delete g.cerradasContadas;
      return g;
    })
    .sort(function (a, b) { return a.avance - b.avance; }); // lo más atrasado, primero

  const porResponsable = {};
  actividades.forEach(function (a) {
    if (a.estado === 'Anulado') return;
    const r = a.encargado || '(Sin encargado)';
    if (!porResponsable[r]) {
      porResponsable[r] = {
        responsable: r,
        email: a.encargadoEmail,
        total: 0,
        abiertas: 0,
        vencidas: 0,
        riesgo: 0,
        bloqueos: 0,
        desactualizadas: 0,
        finalizadas: 0,
        sumaAvance: 0,
      };
    }
    const g = porResponsable[r];
    g.total++;
    g.sumaAvance += a.avance;
    if (!a.cerrada) g.abiertas++;
    if (a.vencida) g.vencidas++;
    if (a.enRiesgo) g.riesgo++;
    if (a.esperaGerencia) g.bloqueos++;
    if (a.desactualizada) g.desactualizadas++;
    if (a.estado === 'Finalizado') g.finalizadas++;
  });

  const responsables = Object.keys(porResponsable)
    .map(function (k) {
      const g = porResponsable[k];
      g.avance = g.total ? Math.round((g.sumaAvance / g.total) * 100) : 0;
      // Cumplimiento: de lo abierto, cuánto NO está vencido ni desactualizado.
      const problemas = g.vencidas + g.desactualizadas;
      g.cumplimiento = g.abiertas ? Math.max(0, Math.round((1 - problemas / g.abiertas) * 100)) : 100;
      delete g.sumaAvance;
      return g;
    })
    .sort(function (a, b) { return b.vencidas - a.vencidas; });

  const totalConteo = actividades.filter(function (a) { return a.estado !== 'Anulado'; }).length;
  const sumaAvanceGlobal = actividades.reduce(function (s, a) {
    return a.estado === 'Anulado' ? s : s + a.avance;
  }, 0);

  return {
    global: {
      total: totalConteo,
      abiertas: vivas.length,
      avance: totalConteo ? Math.round((sumaAvanceGlobal / totalConteo) * 100) : 0,
      vencidas: vivas.filter(function (a) { return a.vencida; }).length,
      porVencer: vivas.filter(function (a) { return a.porVencer; }).length,
      riesgo: vivas.filter(function (a) { return a.enRiesgo; }).length,
      bloqueos: vivas.filter(function (a) { return a.esperaGerencia; }).length,
      desactualizadas: vivas.filter(function (a) { return a.desactualizada; }).length,
      sinFecha: vivas.filter(function (a) { return a.sinFecha; }).length,
    },
    proyectos: proyectos,
    responsables: responsables,
  };
}

/**
 * Lo que espera decisión de Gerencia, listado aparte y contado.
 * Es el "Bloqueo de gerencia" / "Sr. Jerónimo debe revisar" del tablero actual,
 * pero como cola de trabajo con antigüedad, no como comentario perdido.
 */
function colaDeDecisiones(actividades) {
  const hoy = new Date();
  return actividades
    .filter(function (a) { return a.esperaGerencia; })
    .map(function (a) {
      const desde = aFecha(a.actualizadoEn) || aFecha(a.creadoEn);
      const dias = desde ? diasEntre(desde, hoy) : null;
      return {
        id: a.id,
        proyecto: a.proyecto,
        actividad: a.actividad,
        encargado: a.encargado,
        decision: a.decision || '(sin detalle: pídeselo al encargado)',
        fechaLimite: a.fechaLimite,
        diasEsperando: dias,
        critico: dias !== null && dias >= CONFIG.ALERTAS.DIAS_BLOQUEO_CRITICO,
      };
    })
    .sort(function (a, b) { return (b.diasEsperando || 0) - (a.diasEsperando || 0); });
}

/**
 * Excepciones para Administración — eslabón 2 de la cadena: DETECTAR.
 * Cada bloque es una lista de trabajo, no un número suelto.
 */
function tableroDeExcepciones(actividades) {
  const vivas = actividades.filter(function (a) { return !a.cerrada; });
  const pick = function (fn) { return ordenarParaTrabajo(vivas.filter(fn)); };
  return {
    vencidas: pick(function (a) { return a.vencida; }),
    porVencer: pick(function (a) { return a.porVencer; }),
    riesgo: pick(function (a) { return a.enRiesgo; }),
    bloqueos: pick(function (a) { return a.esperaGerencia; }),
    desactualizadas: pick(function (a) { return a.desactualizada; }),
    sinFecha: pick(function (a) { return a.sinFecha; }),
  };
}
