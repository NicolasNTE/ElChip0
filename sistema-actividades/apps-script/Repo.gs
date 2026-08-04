/**
 * Repo.gs — Capa de acceso a datos.
 *
 * Única puerta de entrada al Spreadsheet. El resto del código no sabe que
 * detrás hay un Sheet: pide y recibe objetos. Si mañana la base migra a
 * otra cosa, solo se reescribe este archivo.
 *
 * Las columnas se resuelven por nombre de cabecera, nunca por índice fijo.
 */

/** Memo por ejecución para no releer la misma hoja varias veces. */
var _memo = {};

function _ss() {
  if (!_memo.ss) {
    _memo.ss = CONFIG.SPREADSHEET_ID
      ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    if (!_memo.ss) {
      throw new Error(
        'No hay Spreadsheet. Enlaza el script a la hoja o define CONFIG.SPREADSHEET_ID.'
      );
    }
  }
  return _memo.ss;
}

function _sheet(nombre) {
  const sh = _ss().getSheetByName(nombre);
  if (!sh) {
    throw new Error('Falta la hoja "' + nombre + '". Ejecuta instalarSistema() una vez.');
  }
  return sh;
}

/**
 * Lee una hoja completa como lista de objetos.
 * Cada objeto incluye `_fila` (número de fila real) para poder escribir después.
 * @return {{headers: string[], filas: Object[], mapa: Object<string,number>}}
 */
function leerTabla(nombreHoja) {
  if (_memo[nombreHoja]) return _memo[nombreHoja];

  const sh = _sheet(nombreHoja);
  const ultimaFila = sh.getLastRow();
  const ultimaCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, ultimaCol).getValues()[0].map(function (h) {
    return String(h).trim();
  });

  const mapa = {};
  headers.forEach(function (h, i) {
    if (h) mapa[h] = i;
  });

  const filas = [];
  if (ultimaFila > 1) {
    const valores = sh.getRange(2, 1, ultimaFila - 1, ultimaCol).getValues();
    for (var i = 0; i < valores.length; i++) {
      const fila = valores[i];
      if (fila.join('').trim() === '') continue; // fila vacía: se ignora
      const obj = { _fila: i + 2 };
      headers.forEach(function (h, j) {
        if (h) obj[h] = fila[j];
      });
      filas.push(obj);
    }
  }

  const res = { headers: headers, filas: filas, mapa: mapa };
  _memo[nombreHoja] = res;
  return res;
}

/** Invalida el memo (obligatorio tras escribir). */
function invalidarCache(nombreHoja) {
  if (nombreHoja) delete _memo[nombreHoja];
  else _memo = { ss: _memo.ss };
}

/**
 * Escribe un subconjunto de campos en una fila existente.
 * Solo toca las celdas indicadas: no reescribe la fila completa, así no
 * pisa columnas que alguien haya agregado a mano en el Sheet.
 */
function actualizarFila(nombreHoja, numeroFila, parche) {
  const tabla = leerTabla(nombreHoja);
  const sh = _sheet(nombreHoja);
  Object.keys(parche).forEach(function (campo) {
    const idx = tabla.mapa[campo];
    if (idx === undefined) {
      throw new Error('La columna "' + campo + '" no existe en ' + nombreHoja + '.');
    }
    sh.getRange(numeroFila, idx + 1).setValue(parche[campo]);
  });
  invalidarCache(nombreHoja);
}

/** Agrega una fila nueva a partir de un objeto {cabecera: valor}. */
function agregarFila(nombreHoja, objeto) {
  const tabla = leerTabla(nombreHoja);
  const sh = _sheet(nombreHoja);
  const fila = tabla.headers.map(function (h) {
    return objeto[h] !== undefined ? objeto[h] : '';
  });
  sh.appendRow(fila);
  invalidarCache(nombreHoja);
  return sh.getLastRow();
}

/**
 * Corre una operación de escritura bajo lock global.
 * Dos personas guardando a la vez no se pisan.
 */
function conBloqueo(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    throw new Error('El sistema está ocupado guardando otro cambio. Reintenta en unos segundos.');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** Identificador corto, ordenable por fecha de creación. */
function nuevoId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.floor(Math.random() * 1679616).toString(36).toUpperCase();
  return 'ACT-' + t + '-' + ('00000' + r).slice(-4);
}

/** Normaliza una fecha (Date | string | vacío) a Date o null. */
function aFecha(valor) {
  if (!valor && valor !== 0) return null;
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return isNaN(valor.getTime()) ? null : valor;
  }
  const texto = String(valor).trim();
  if (!texto) return null;
  const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(texto);
  return isNaN(d.getTime()) ? null : d;
}

/** Serializa una fecha a 'yyyy-MM-dd' para el cliente. */
function aTextoFecha(valor) {
  const d = aFecha(valor);
  if (!d) return '';
  return Utilities.formatDate(d, CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

/** Fecha/hora legible para bitácora y comentarios. */
function ahoraTexto() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm');
}

/** Días de diferencia entre dos fechas, ignorando la hora. */
function diasEntre(desde, hasta) {
  if (!desde || !hasta) return null;
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b - a) / 86400000);
}
