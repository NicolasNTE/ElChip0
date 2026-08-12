/**
 * Notify.gs — Cadena de cumplimiento automatizada.
 *
 * Eslabón 2 (detectar) y eslabón 4 (escalar) sin que nadie tenga que
 * revisar el tablero a mano. Un disparador diario manda:
 *  - a cada responsable, solo SU lista de pendientes críticos;
 *  - a Administración, el tablero de excepciones;
 *  - a Gerencia, la cola de decisiones que la están esperando.
 *
 * El correo no es el sistema: es el empujón. El dato sigue viviendo
 * en un solo lugar, y cada correo enlaza de vuelta a la web app.
 */

/** Instala el disparador diario (7:00 am hora local). Correr una sola vez. */
function instalarDisparadorDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'rutinaDiaria') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('rutinaDiaria').timeBased().atHour(7).everyDays(1).create();
  _avisar('Recordatorio diario instalado (7:00 am).');
}

/** Punto de entrada del disparador. */
function rutinaDiaria() {
  const actividades = todasLasActividades();
  const personas = listarPersonas().filter(function (p) { return p.activo; });
  const url = _urlApp();

  // --- Responsables: cada quien recibe lo suyo ---
  personas
    .filter(function (p) { return p.rol === CONFIG.ROLES.RESPONSABLE; })
    .forEach(function (p) {
      const suyas = actividades.filter(function (a) {
        return !a.cerrada && normalizarEmail(a.encargadoEmail) === p.email;
      });
      const criticas = suyas.filter(function (a) {
        return a.vencida || a.porVencer || a.enRiesgo || a.desactualizada;
      });
      if (!criticas.length) return;
      _enviar(
        p.email,
        'Tus pendientes: ' + criticas.length + ' requieren atención',
        _htmlResponsable(p, criticas, suyas, url)
      );
    });

  // --- Administración: el tablero de excepciones completo ---
  const admins = personas.filter(function (p) { return p.rol === CONFIG.ROLES.ADMIN; });
  const destinoAdmin = admins.map(function (p) { return p.email; });
  if (CONFIG.EMAIL_ADMIN && destinoAdmin.indexOf(CONFIG.EMAIL_ADMIN) < 0) {
    destinoAdmin.push(CONFIG.EMAIL_ADMIN);
  }
  if (destinoAdmin.length) {
    const exc = tableroDeExcepciones(actividades);
    const total = exc.vencidas.length + exc.riesgo.length + exc.bloqueos.length + exc.desactualizadas.length;
    if (total) {
      _enviar(
        destinoAdmin.join(','),
        'Excepciones del día: ' + total + ' actividades',
        _htmlAdmin(exc, url)
      );
    }
  }

  // --- Gerencia: solo lo que la está esperando ---
  const cola = colaDeDecisiones(actividades);
  if (cola.length) {
    const gerentes = personas
      .filter(function (p) { return p.rol === CONFIG.ROLES.GERENCIA; })
      .map(function (p) { return p.email; });
    if (gerentes.length) {
      _enviar(
        gerentes.join(','),
        cola.length + ' decisiones esperan a Gerencia',
        _htmlGerencia(cola, url)
      );
    }
  }
}

/**
 * Aviso manual a todo el equipo activo: "el sistema cambió, entra a ver".
 * No es parte de la cadena de cumplimiento diaria; lo dispara Administración
 * a mano desde el menú cuando hay una actualización que avisar.
 */
function avisarActualizacionSistema(mensaje, actor) {
  const personas = listarPersonas().filter(function (p) { return p.activo; });
  if (!personas.length) return { enviados: 0 };
  const url = _urlApp();
  const cuerpo = _htmlAviso(mensaje, url);
  personas.forEach(function (p) { _enviar(p.email, 'El sistema se actualizó', cuerpo); });
  registrarBitacora((actor && actor.email) || 'SISTEMA', 'AVISO_ACTUALIZACION', '', 'Aviso', '', String(personas.length) + ' personas');
  return { enviados: personas.length };
}

function _htmlAviso(mensaje, url) {
  return (
    '<h2 style="font:600 18px system-ui;color:#1f2a44">El sistema se actualizó</h2>' +
    '<p style="font:14px system-ui">' + _escapar(mensaje || 'Hay cambios nuevos en el sistema de actividades. Entra a revisar tu tablero.') + '</p>' +
    _pie(url)
  );
}

/** Escalamiento manual desde la Vista Administración. */
function enviarRecordatorio(email, mensaje, actor) {
  const destino = normalizarEmail(email);
  const persona = listarPersonas().filter(function (p) { return p.email === destino; })[0];
  if (!persona) throw new Error('No existe la persona ' + destino + '.');

  const suyas = todasLasActividades().filter(function (a) {
    return !a.cerrada && normalizarEmail(a.encargadoEmail) === destino;
  });
  const criticas = suyas.filter(function (a) {
    return a.vencida || a.porVencer || a.enRiesgo || a.desactualizada;
  });

  const cuerpo =
    '<p>' + _escapar(mensaje || 'Por favor actualiza tus actividades en el sistema.') + '</p>' +
    _tabla(criticas.length ? criticas : suyas) +
    _pie(_urlApp());

  _enviar(destino, 'Seguimiento de tus actividades', cuerpo);
  registrarBitacora(actor.email, 'ESCALAMIENTO', '', 'Recordatorio', '', destino);
  return { enviado: destino, actividades: (criticas.length ? criticas : suyas).length };
}

// --- Plantillas ------------------------------------------------------------

function _htmlResponsable(persona, criticas, todas, url) {
  return (
    '<h2 style="font:600 18px system-ui;color:#1f2a44">Hola ' + _escapar(persona.nombre) + '</h2>' +
    '<p style="font:14px system-ui">Tienes <b>' + todas.length + '</b> actividades abiertas. ' +
    '<b>' + criticas.length + '</b> necesitan que hagas algo hoy.</p>' +
    _tabla(criticas) +
    '<p style="font:13px system-ui;color:#555">Si algo depende de otra persona o de Gerencia, ' +
    'márcalo en el sistema como <b>Riesgo/Interferencia</b> o <b>Bloqueo de Gerencia</b>. ' +
    'Así se ve solo, sin que tengas que escribirlo por WhatsApp.</p>' +
    _pie(url)
  );
}

function _htmlAdmin(exc, url) {
  const bloque = function (titulo, lista) {
    if (!lista.length) return '';
    return '<h3 style="font:600 15px system-ui;color:#1f2a44;margin:18px 0 6px">' +
      _escapar(titulo) + ' (' + lista.length + ')</h3>' + _tabla(lista);
  };
  return (
    '<h2 style="font:600 18px system-ui;color:#1f2a44">Excepciones del día</h2>' +
    bloque('Vencidas', exc.vencidas) +
    bloque('Esperando a Gerencia', exc.bloqueos) +
    bloque('En riesgo o interferencia', exc.riesgo) +
    bloque('Sin actualizar hace más de ' + CONFIG.ALERTAS.DIAS_SIN_ACTUALIZAR + ' días', exc.desactualizadas) +
    bloque('Por vencer', exc.porVencer) +
    bloque('Sin fecha límite', exc.sinFecha) +
    _pie(url)
  );
}

function _htmlGerencia(cola, url) {
  const filas = cola
    .map(function (d) {
      return (
        '<tr>' +
        '<td style="' + _td() + '">' + _escapar(d.proyecto) + '</td>' +
        '<td style="' + _td() + '">' + _escapar(d.actividad) + '</td>' +
        '<td style="' + _td() + '">' + _escapar(d.decision) + '</td>' +
        '<td style="' + _td() + '">' + _escapar(d.encargado) + '</td>' +
        '<td style="' + _td() + (d.critico ? ';color:#b00020;font-weight:600' : '') + '">' +
        (d.diasEsperando === null ? '—' : d.diasEsperando + ' d') +
        '</td></tr>'
      );
    })
    .join('');
  return (
    '<h2 style="font:600 18px system-ui;color:#1f2a44">Decisiones pendientes</h2>' +
    '<p style="font:14px system-ui">' + cola.length + ' actividades están detenidas esperando una definición.</p>' +
    '<table style="border-collapse:collapse;font:13px system-ui"><tr>' +
    ['Proyecto', 'Actividad', 'Qué se decide', 'Encargado', 'Esperando']
      .map(function (h) { return '<th style="' + _th() + '">' + h + '</th>'; })
      .join('') +
    '</tr>' + filas + '</table>' +
    _pie(url)
  );
}

function _tabla(lista) {
  if (!lista.length) return '<p style="font:14px system-ui;color:#2e7d32">Nada pendiente. 🎉</p>';
  const filas = lista
    .slice(0, 50)
    .map(function (a) {
      return (
        '<tr>' +
        '<td style="' + _td() + '">' + _escapar(a.proyecto) + '</td>' +
        '<td style="' + _td() + '">' + _escapar(a.actividad) + '</td>' +
        '<td style="' + _td() + '">' + _escapar(a.encargado) + '</td>' +
        '<td style="' + _td() + '">' + (a.fechaLimite || '—') + '</td>' +
        '<td style="' + _td() + '">' + _escapar(a.estado) + '</td>' +
        '<td style="' + _td() + ';color:#b00020">' + _escapar(a.senales.join(', ')) + '</td>' +
        '</tr>'
      );
    })
    .join('');
  return (
    '<table style="border-collapse:collapse;font:13px system-ui"><tr>' +
    ['Proyecto', 'Actividad', 'Encargado', 'Fecha límite', 'Estado', 'Señales']
      .map(function (h) { return '<th style="' + _th() + '">' + h + '</th>'; })
      .join('') +
    '</tr>' + filas + '</table>'
  );
}

function _th() {
  return 'text-align:left;padding:6px 10px;background:#1f2a44;color:#fff;font-weight:600';
}
function _td() {
  return 'padding:6px 10px;border-bottom:1px solid #e6e6e6;vertical-align:top';
}

function _pie(url) {
  if (!url) return '';
  return (
    '<p style="margin-top:20px"><a href="' + url + '" ' +
    'style="font:600 14px system-ui;background:#1f2a44;color:#fff;padding:10px 16px;' +
    'border-radius:6px;text-decoration:none">Abrir el sistema</a></p>' +
    '<p style="font:12px system-ui;color:#888">Actualiza ahí mismo. No respondas este correo.</p>'
  );
}

function _escapar(t) {
  return String(t === null || t === undefined ? '' : t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _urlApp() {
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (err) {
    return '';
  }
}

function _enviar(destino, asunto, html) {
  if (!destino) return;
  try {
    MailApp.sendEmail({ to: destino, subject: '[Actividades] ' + asunto, htmlBody: html });
  } catch (err) {
    console.error('No se pudo enviar a ' + destino + ': ' + err.message);
  }
}
