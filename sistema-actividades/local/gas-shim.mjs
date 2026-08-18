/**
 * gas-shim.mjs — Servicios de Google emulados en Node.
 *
 * Permite ejecutar EXACTAMENTE los mismos archivos .gs fuera de Google:
 * el Spreadsheet se convierte en un JSON local. Sirve para desarrollar,
 * probar y depurar sin desplegar nada y sin tocar datos reales.
 *
 * No pretende ser fiel al 100%: implementa lo que este sistema usa.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';

/** Libro de trabajo en memoria: { nombreHoja: [[fila], [fila]] }. */
class Libro {
  constructor(datos) {
    this.hojas = new Map();
    Object.keys(datos || {}).forEach((n) => this.hojas.set(n, datos[n].map((f) => f.slice())));
  }

  aJson() {
    const out = {};
    for (const [n, filas] of this.hojas) {
      out[n] = filas.map((f) => f.map((v) => (v instanceof Date ? { __fecha: v.toISOString() } : v)));
    }
    return out;
  }
}

class Rango {
  constructor(hoja, fila, col, numFilas, numCols) {
    this.hoja = hoja;
    this.fila = fila;
    this.col = col;
    this.numFilas = numFilas;
    this.numCols = numCols;
  }

  getValues() {
    const out = [];
    for (let i = 0; i < this.numFilas; i++) {
      const fila = [];
      for (let j = 0; j < this.numCols; j++) {
        fila.push(this.hoja._celda(this.fila + i, this.col + j));
      }
      out.push(fila);
    }
    return out;
  }

  getValue() {
    return this.hoja._celda(this.fila, this.col);
  }

  setValues(matriz) {
    matriz.forEach((fila, i) => {
      fila.forEach((v, j) => this.hoja._setCelda(this.fila + i, this.col + j, v));
    });
    return this;
  }

  setValue(v) {
    this.hoja._setCelda(this.fila, this.col, v);
    return this;
  }

  getA1Notation() {
    return _letraColumna(this.col) + this.fila;
  }

  // Formato: no aplica fuera de Google, pero la cadena debe seguir funcionando.
  setDataValidation() { return this; }
  setNumberFormat() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  setFontWeight() { return this; }
  clearDataValidations() { return this; }
}

function _letraColumna(n) {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

class Hoja {
  constructor(libro, nombre) {
    this.libro = libro;
    this.nombre = nombre;
    if (!libro.hojas.has(nombre)) libro.hojas.set(nombre, []);
  }

  get filas() { return this.libro.hojas.get(this.nombre); }

  _celda(fila, col) {
    const f = this.filas[fila - 1];
    if (!f) return '';
    const v = f[col - 1];
    return v === undefined || v === null ? '' : v;
  }

  _setCelda(fila, col, valor) {
    while (this.filas.length < fila) this.filas.push([]);
    const f = this.filas[fila - 1];
    while (f.length < col) f.push('');
    f[col - 1] = valor;
  }

  getName() { return this.nombre; }
  getLastRow() { return this.filas.length; }
  getLastColumn() { return this.filas.reduce((m, f) => Math.max(m, f.length), 0); }
  getMaxRows() { return Math.max(this.filas.length, 1000); }
  getMaxColumns() { return Math.max(this.getLastColumn(), 26); }

  getRange(fila, col, numFilas, numCols) {
    return new Rango(this, fila, col, numFilas || 1, numCols || 1);
  }

  getDataRange() {
    return new Rango(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1));
  }

  appendRow(valores) {
    this.filas.push(valores.slice());
    return this;
  }

  setFrozenRows() { return this; }
  setConditionalFormatRules() { return this; }
  getConditionalFormatRules() { return []; }
}

class Spreadsheet {
  constructor(libro) { this.libro = libro; }
  getSheetByName(n) { return this.libro.hojas.has(n) ? new Hoja(this.libro, n) : null; }
  insertSheet(n) { this.libro.hojas.set(n, []); return new Hoja(this.libro, n); }
  setSpreadsheetTimeZone() { return this; }
  toast(mensaje) { console.log('[toast] ' + mensaje); }
  getId() { return 'LOCAL'; }
}

/** Constructor encadenable que no hace nada (validaciones, formato). */
function constructorInerte() {
  const inerte = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'build') return () => ({});
        return () => inerte;
      },
    }
  );
  return inerte;
}

/**
 * Crea el entorno global que consumirán los archivos .gs.
 * @param {string} rutaDatos JSON con el libro de trabajo.
 */
export function crearEntorno(rutaDatos) {
  const crudo = fs.existsSync(rutaDatos)
    ? JSON.parse(fs.readFileSync(rutaDatos, 'utf8'))
    : {};
  // Rehidrata las fechas serializadas.
  Object.keys(crudo).forEach((hoja) => {
    crudo[hoja] = crudo[hoja].map((fila) =>
      fila.map((v) => (v && typeof v === 'object' && v.__fecha ? new Date(v.__fecha) : v))
    );
  });

  const libro = new Libro(crudo);
  const spreadsheet = new Spreadsheet(libro);
  const propiedades = new Map();
  const correos = [];

  const estado = {
    /** Correo del usuario "conectado" en esta petición local. */
    usuarioActual: '',
    libro,
    correos,
    guardar() {
      fs.writeFileSync(rutaDatos, JSON.stringify(libro.aJson(), null, 2), 'utf8');
    },
  };

  const globals = {
    console,
    Date,
    Math,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Array,
    Error,
    RegExp,
    isNaN,
    parseInt,
    parseFloat,
    setTimeout,

    SpreadsheetApp: {
      openById: () => spreadsheet,
      getActiveSpreadsheet: () => spreadsheet,
      getActive: () => spreadsheet,
      newDataValidation: constructorInerte,
      newConditionalFormatRule: constructorInerte,
      getUi: () => {
        throw new Error('No hay interfaz de hoja de cálculo en modo local.');
      },
    },

    Session: {
      getActiveUser: () => ({ getEmail: () => estado.usuarioActual }),
      getEffectiveUser: () => ({ getEmail: () => estado.usuarioActual }),
      getScriptTimeZone: () => 'America/Lima',
    },

    Utilities: {
      getUuid: () => crypto.randomUUID(),
      computeDigest: (_alg, texto) => {
        const buf = crypto.createHash('sha256').update(String(texto)).digest();
        return Array.from(buf).map((b) => (b > 127 ? b - 256 : b));
      },
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      formatDate: (fecha, _tz, patron) => {
        const d = fecha instanceof Date ? fecha : new Date(fecha);
        const p = (n) => String(n).padStart(2, '0');
        return patron
          .replace('yyyy', d.getFullYear())
          .replace('MM', p(d.getMonth() + 1))
          .replace('dd', p(d.getDate()))
          .replace('HH', p(d.getHours()))
          .replace('mm', p(d.getMinutes()));
      },
    },

    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (propiedades.has(k) ? propiedades.get(k) : null),
        setProperty: (k, v) => propiedades.set(k, v),
        deleteProperty: (k) => propiedades.delete(k),
      }),
    },

    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }),
    },

    MailApp: {
      sendEmail: (opciones) => {
        correos.push(opciones);
        console.log('[correo simulado] -> ' + opciones.to + ' :: ' + opciones.subject);
      },
    },

    ScriptApp: {
      getService: () => ({ getUrl: () => 'http://localhost:8080/' }),
      getProjectTriggers: () => [],
      newTrigger: () => constructorInerte(),
      deleteTrigger: () => {},
    },

    HtmlService: {
      createTemplateFromFile: () => {
        throw new Error('Las plantillas se sirven desde servidor.mjs en modo local.');
      },
      createHtmlOutputFromFile: () => {
        throw new Error('Las plantillas se sirven desde servidor.mjs en modo local.');
      },
    },
  };

  globals.globalThis = globals;
  return { globals, estado };
}
