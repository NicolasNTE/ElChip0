/**
 * Setup.gs — Instalación y mantenimiento del archivo.
 *
 * `instalarSistema()` es idempotente: se puede correr sobre un Sheet vacío
 * o sobre el tablero que ya existe hoy. Si faltan columnas, las agrega al
 * final sin tocar las que ya están; si faltan IDs, los genera.
 */

/** Menú propio al abrir la hoja (solo lo ve Administración). */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ Sistema')
    .addItem('Instalar / reparar estructura', 'instalarSistema')
    .addItem('Cargar datos de ejemplo', 'cargarEjemplo')
    .addSeparator()
    .addItem('Generar enlaces de acceso', 'menuGenerarEnlaces')
    .addItem('Instalar recordatorio diario', 'instalarDisparadorDiario')
    .addSeparator()
    .addItem('Enviar resumen ahora', 'rutinaDiaria')
    .addToUi();
}

/** Crea o repara todas las hojas y sus validaciones. */
function instalarSistema() {
  const ss = _ss();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  _asegurarHoja(ss, CONFIG.SHEETS.MADRE, _cabecerasMadre());
  _asegurarHoja(ss, CONFIG.SHEETS.PERSONAS, _valores(CONFIG.COLS_PERSONAS));
  _asegurarHoja(ss, CONFIG.SHEETS.CATALOGOS, ['Proyecto', 'Notas']);
  _asegurarHoja(ss, CONFIG.SHEETS.BITACORA, _valores(CONFIG.COLS_BITACORA));

  _sembrarProyectos(ss);
  _aplicarValidaciones(ss);
  _aplicarFormato(ss);
  _rellenarIdsFaltantes();

  invalidarCache();
  _avisar('Estructura lista. Revisa la hoja "Personas" y registra a tu equipo.');
  return true;
}

function _valores(obj) {
  return Object.keys(obj).map(function (k) { return obj[k]; });
}

function _cabecerasMadre() {
  const C = CONFIG.COLS;
  // Orden pensado para que Administración trabaje cómoda en el Sheet.
  return [
    C.ID, C.PROYECTO, C.ACTIVIDAD, C.ETIQUETAS, C.ENCARGADO, C.FECHA_LIMITE, C.PRIORIDAD,
    C.ESTADO, C.RIESGO, C.RIESGO_DETALLE, C.BLOQUEO, C.DECISION, C.COMENTARIO,
    C.CREADO_POR, C.CREADO_EN, C.ACTUALIZADO_POR, C.ACTUALIZADO_EN,
  ];
}

/**
 * Garantiza que la hoja exista y tenga todas las cabeceras.
 * Las columnas que ya existen no se mueven: solo se agregan las que faltan.
 */
function _asegurarHoja(ss, nombre, cabeceras) {
  var sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
    sh.setFrozenRows(1);
    return sh;
  }
  const ultimaCol = Math.max(1, sh.getLastColumn());
  const actuales = sh.getRange(1, 1, 1, ultimaCol).getValues()[0].map(function (h) {
    return String(h).trim();
  });
  const faltantes = cabeceras.filter(function (h) { return actuales.indexOf(h) < 0; });
  if (faltantes.length) {
    sh.getRange(1, actuales.length + 1, 1, faltantes.length).setValues([faltantes]);
  }
  sh.setFrozenRows(1);
  return sh;
}

function _sembrarProyectos(ss) {
  const sh = ss.getSheetByName(CONFIG.SHEETS.CATALOGOS);
  if (sh.getLastRow() > 1) return; // ya hay catálogo: no lo tocamos
  const filas = CONFIG.CATALOGOS.PROYECTO_SEMILLA.map(function (p) { return [p, '']; });
  sh.getRange(2, 1, filas.length, 2).setValues(filas);
}

/** Listas desplegables en el Sheet, para que Administración no escriba libre. */
function _aplicarValidaciones(ss) {
  const sh = ss.getSheetByName(CONFIG.SHEETS.MADRE);
  const tabla = leerTabla(CONFIG.SHEETS.MADRE);
  const filas = Math.max(sh.getMaxRows() - 1, 1);

  const poner = function (cabecera, valores) {
    const idx = tabla.mapa[cabecera];
    if (idx === undefined) return;
    const regla = SpreadsheetApp.newDataValidation()
      .requireValueInList(valores, true)
      .setAllowInvalid(false)
      .build();
    sh.getRange(2, idx + 1, filas, 1).setDataValidation(regla);
  };

  poner(CONFIG.COLS.ESTADO, CONFIG.CATALOGOS.ESTADO);
  poner(CONFIG.COLS.PRIORIDAD, CONFIG.CATALOGOS.PRIORIDAD);
  poner(CONFIG.COLS.RIESGO, CONFIG.CATALOGOS.SI_NO);
  poner(CONFIG.COLS.BLOQUEO, CONFIG.CATALOGOS.SI_NO);

  const proyectos = listarProyectos();
  if (proyectos.length) poner(CONFIG.COLS.PROYECTO, proyectos);

  const personas = listarPersonas().filter(function (p) { return p.activo && p.nombre; });
  if (personas.length) {
    poner(CONFIG.COLS.ENCARGADO, personas.map(function (p) { return p.nombre; }));
  }

  const idxFecha = tabla.mapa[CONFIG.COLS.FECHA_LIMITE];
  if (idxFecha !== undefined) {
    sh.getRange(2, idxFecha + 1, filas, 1).setNumberFormat('yyyy-mm-dd');
  }
  [CONFIG.COLS.CREADO_EN, CONFIG.COLS.ACTUALIZADO_EN].forEach(function (c) {
    const i = tabla.mapa[c];
    if (i !== undefined) sh.getRange(2, i + 1, filas, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  });
}

/** Formato condicional: el Sheet también debe gritar lo que está mal. */
function _aplicarFormato(ss) {
  const sh = ss.getSheetByName(CONFIG.SHEETS.MADRE);
  const tabla = leerTabla(CONFIG.SHEETS.MADRE);
  const ultimaCol = sh.getLastColumn();
  const rango = sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), ultimaCol);

  const letra = function (cabecera) {
    const i = tabla.mapa[cabecera];
    return i === undefined ? null : sh.getRange(1, i + 1).getA1Notation().replace(/\d+/, '');
  };
  const colEstado = letra(CONFIG.COLS.ESTADO);
  const colFecha = letra(CONFIG.COLS.FECHA_LIMITE);
  const colRiesgo = letra(CONFIG.COLS.RIESGO);
  const colBloqueo = letra(CONFIG.COLS.BLOQUEO);

  const reglas = [];
  const abierta = colEstado ? '$' + colEstado + '2<>"Finalizado", $' + colEstado + '2<>"Anulado", ' : '';

  if (colFecha && colEstado) {
    reglas.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=AND(' + abierta + '$' + colFecha + '2<>"", $' + colFecha + '2<TODAY())')
        .setBackground('#f8d7da')
        .setRanges([rango])
        .build()
    );
  }
  if (colRiesgo) {
    reglas.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=$' + colRiesgo + '2="Si"')
        .setBackground('#fff3cd')
        .setRanges([rango])
        .build()
    );
  }
  if (colBloqueo) {
    reglas.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=$' + colBloqueo + '2="Si"')
        .setBackground('#e2d9f3')
        .setRanges([rango])
        .build()
    );
  }
  sh.setConditionalFormatRules(reglas);

  sh.getRange(1, 1, 1, ultimaCol)
    .setBackground('#1f2a44')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

/** Toda fila con actividad debe tener ID. Las viejas lo reciben aquí. */
function _rellenarIdsFaltantes() {
  const C = CONFIG.COLS;
  const sh = _sheet(CONFIG.SHEETS.MADRE);
  const tabla = leerTabla(CONFIG.SHEETS.MADRE);
  const idxId = tabla.mapa[C.ID];
  if (idxId === undefined) return;

  var escritas = 0;
  tabla.filas.forEach(function (f) {
    if (String(f[C.ACTIVIDAD] || '').trim() === '') return;
    if (String(f[C.ID] || '').trim() !== '') return;
    sh.getRange(f._fila, idxId + 1).setValue(nuevoId());
    if (!f[C.CREADO_EN] && tabla.mapa[C.CREADO_EN] !== undefined) {
      sh.getRange(f._fila, tabla.mapa[C.CREADO_EN] + 1).setValue(new Date());
    }
    escritas++;
  });
  if (escritas) invalidarCache(CONFIG.SHEETS.MADRE);
  return escritas;
}

/**
 * Carga el tablero de ejemplo (el mismo del Excel actual) para probar el
 * sistema sin datos reales. Seguro: no borra nada, solo agrega.
 */
function cargarEjemplo() {
  const C = CONFIG.COLS;
  const P = CONFIG.COLS_PERSONAS;

  const personas = [
    ['mafer@ejemplo.com', 'Mafer', CONFIG.ROLES.RESPONSABLE],
    ['renato@ejemplo.com', 'Renato', CONFIG.ROLES.RESPONSABLE],
    ['nicolas@ejemplo.com', 'Nicolas', CONFIG.ROLES.RESPONSABLE],
    ['ingrid@ejemplo.com', 'Ingrid', CONFIG.ROLES.RESPONSABLE],
    ['ailin@ejemplo.com', 'Ailin', CONFIG.ROLES.RESPONSABLE],
    ['rafael@ejemplo.com', 'Rafael J.', CONFIG.ROLES.RESPONSABLE],
    ['salvador@ejemplo.com', 'Salvador', CONFIG.ROLES.RESPONSABLE],
    ['administracion@ejemplo.com', 'Administracion', CONFIG.ROLES.ADMIN],
    ['gerencia@ejemplo.com', 'Gerencia', CONFIG.ROLES.GERENCIA],
  ];
  const yaEstan = listarPersonas().map(function (p) { return p.email; });
  personas.forEach(function (p) {
    if (yaEstan.indexOf(p[0]) >= 0) return;
    const fila = {};
    fila[P.EMAIL] = p[0];
    fila[P.NOMBRE] = p[1];
    fila[P.ROL] = p[2];
    fila[P.ACTIVO] = 'Si';
    fila[P.TOKEN_HASH] = '';
    fila[P.PROYECTOS] = '';
    agregarFila(CONFIG.SHEETS.PERSONAS, fila);
  });

  const hoy = new Date();
  const dia = function (n) {
    const d = new Date(hoy.getTime());
    d.setDate(d.getDate() + n);
    return d;
  };

  // El penúltimo valor son etiquetas de ejemplo (grupos dentro del proyecto);
  // el último es hace cuántos días se tocó por última vez, así el ejemplo
  // muestra "sin actualizar" como una señal real y no como ruido.
  const muestras = [
    ['Cristobal', 'Revisar planos de fachada', 'Mafer', dia(8), 'Alta', 'Por hacer', 'No', '', 'No', '', '', 'Fase 1 - Diseño', 2],
    ['Madreselva', 'Coordinar con proveedor de acabados', 'Mafer', dia(1), 'Alta', 'Por hacer', 'Si', 'El proveedor no confirma stock', 'No', '', '', 'Acabados', 1],
    ['Bellaterra', 'Aprobar cambio de presupuesto de obra', 'Renato', dia(11), 'Media', 'En curso', 'No', '', 'Si', 'Aprobar sobrecosto de 12k', '', '', 6],
    ['Cristobal', 'Firma de Minuta de Compra Venta', 'Nicolas', dia(17), 'Alta', 'Por hacer', 'No', '', 'No', '', 'Confirmar detalles para firma', 'Legal', 3],
    ['Cristobal', 'Escritura publica', 'Nicolas', dia(83), 'Alta', 'Por hacer', 'No', '', 'No', '', 'Depende de la firma de la minuta', 'Legal', 3],
    ['Cristobal', 'Empresa para siguiente proyecto - Crear empresa', 'Ingrid', dia(-26), 'Alta', 'Finalizado', 'No', '', 'No', '', 'Se entregaron la declaracion de bienes', 'Legal', 26],
    ['Cristobal', 'Devolucion Sandro - Ultimo dia de cada mes', 'Salvador', dia(-35), 'Baja', 'Por hacer', 'No', '', 'No', '', '', '', 33],
    ['Cristobal', 'Expediente para MTC - Seguimiento', 'Ingrid', dia(-21), 'Media', 'Finalizado', 'No', '', 'No', '', 'Rafael debe tener plano topografico', 'Permisos MTC', 20],
    ['Cristobal', 'Respuesta al MTC sobre las observaciones', 'Ailin', dia(-18), 'Alta', 'En curso', 'No', '', 'No', '', 'Proceso de conseguir todos los requisitos', 'Permisos MTC', 4],
    ['Cristobal', 'Resolver tarjeta de credito interbank', 'Ailin', dia(-21), 'Alta', 'En curso', 'No', '', 'No', '', 'Falta ir al banco presencialmente', '', 15],
    ['Cristobal', 'Solucion Observaciones', 'Rafael J.', dia(107), 'Alta', 'En curso', 'No', '', 'No', '', '', 'Fase 1 - Diseño', 5],
    ['Cristobal', 'Plazo Observaciones', 'Ingrid', dia(-1), 'Alta', 'En curso', 'No', '', 'No', '', '', 'Permisos MTC', 1],
    ['Cristobal', 'Entregar Planos firmados y plteados - Archivar', 'Mafer', dia(-50), 'Alta', 'Finalizado', 'No', '', 'No', '', 'En coordinacion con Bruno', 'Fase 1 - Diseño', 48],
    ['Cristobal', 'Sellado Aprobacion Munic - Ingresar solicitud', 'Mafer', '', 'Alta', 'Por hacer', 'No', '', 'No', '', '', 'Permisos MTC', 4],
    ['Cristobal', 'Licencia de Obra - Cotizaciones', 'Rafael J.', '', 'Alta', 'Por hacer', 'No', '', 'No', '', '', '', 9],
    ['Cristobal', 'Cotizacion Electricas', 'Rafael J.', '', 'Media', 'Por hacer', 'No', '', 'No', '', '', 'Acabados', 12],
    ['Cristobal', 'Reclutar estudio de proyectistas', 'Renato', '', 'Media', 'Por hacer', 'No', '', 'No', '', '', '', 2],
    ['Cristobal', 'Creacion de empresa Madretierra SAC - Minuta', 'Mafer', '', 'Alta', 'Por hacer', 'No', '', 'Si', 'Definir socios y aportes', '', 'Legal', 8],
  ];

  muestras.forEach(function (m) {
    const fila = {};
    fila[C.ID] = nuevoId();
    fila[C.PROYECTO] = m[0];
    fila[C.ACTIVIDAD] = m[1];
    fila[C.ETIQUETAS] = m[11];
    fila[C.ENCARGADO] = m[2];
    fila[C.FECHA_LIMITE] = m[3];
    fila[C.PRIORIDAD] = m[4];
    fila[C.ESTADO] = m[5];
    fila[C.RIESGO] = m[6];
    fila[C.RIESGO_DETALLE] = m[7];
    fila[C.BLOQUEO] = m[8];
    fila[C.DECISION] = m[9];
    fila[C.COMENTARIO] = m[10];
    fila[C.CREADO_POR] = 'administracion@ejemplo.com';
    fila[C.CREADO_EN] = dia(-(m[12] + 30));
    fila[C.ACTUALIZADO_POR] = 'administracion@ejemplo.com';
    fila[C.ACTUALIZADO_EN] = dia(-m[12]);
    agregarFila(CONFIG.SHEETS.MADRE, fila);
  });

  _aplicarValidaciones(_ss());
  _avisar('Cargadas ' + muestras.length + ' actividades de ejemplo.');
}

/** Diálogo simple para repartir enlaces personales. */
function menuGenerarEnlaces() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt(
    'Enlace de acceso',
    'Correo de la persona (se generará un enlace nuevo y el anterior dejará de servir):',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  try {
    const r = generarEnlaceAcceso(resp.getResponseText());
    ui.alert(
      'Enlace para ' + (r.nombre || r.email),
      r.url + '\n\nEnvíaselo por privado. No se puede volver a mostrar.',
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert('Error', err.message, ui.ButtonSet.OK);
  }
}

function _avisar(mensaje) {
  try {
    SpreadsheetApp.getActive().toast(mensaje, 'Sistema', 8);
  } catch (err) {
    console.log(mensaje);
  }
}
