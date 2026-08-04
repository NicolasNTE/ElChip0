/**
 * servidor.mjs — El sistema completo corriendo en tu máquina.
 *
 *   node local/servidor.mjs        →  http://localhost:8080
 *
 * Carga los MISMOS archivos .gs que se despliegan en Google, pero con el
 * Spreadsheet emulado sobre un JSON local (local/datos.json). Sirve para
 * desarrollar, revisar permisos y mostrar el sistema sin cuenta de Google
 * y sin tocar datos reales.
 *
 * En esta pantalla local puedes cambiar de persona con el selector de
 * arriba: así se comprueba que cada rol ve exactamente lo que debe ver.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { crearEntorno } from './gas-shim.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const DIR_GS = path.join(RAIZ, 'apps-script');
const RUTA_DATOS = path.join(AQUI, 'datos.json');
const PUERTO = Number(process.env.PUERTO || 8080);

// --- 1. Entorno emulado + carga del código de servidor ----------------------

const { globals, estado } = crearEntorno(RUTA_DATOS);
const contexto = vm.createContext(globals);

const ORDEN = [
  'Config.gs',
  'Repo.gs',
  'Auth.gs',
  'Actividades.gs',
  'Audit.gs',
  'Metrics.gs',
  'Notify.gs',
  'Api.gs',
  'Setup.gs',
  'WebApp.gs',
];

for (const archivo of ORDEN) {
  const ruta = path.join(DIR_GS, archivo);
  const codigo = fs.readFileSync(ruta, 'utf8');
  try {
    vm.runInContext(codigo, contexto, { filename: archivo });
  } catch (err) {
    console.error('Error cargando ' + archivo + ': ' + err.message);
    process.exit(1);
  }
}

// --- 2. Datos: si no hay libro local, se crea uno con el ejemplo ------------

if (!fs.existsSync(RUTA_DATOS)) {
  console.log('No hay datos locales. Creando estructura y tablero de ejemplo…');
  estado.usuarioActual = 'administracion@ejemplo.com';
  vm.runInContext('instalarSistema();', contexto);
  vm.runInContext('cargarEjemplo();', contexto);
  estado.guardar();
  console.log('Listo: ' + RUTA_DATOS);
}

/** Personas disponibles para el selector local. */
function personasLocales() {
  try {
    vm.runInContext('invalidarCache();', contexto);
    return vm.runInContext('listarPersonas();', contexto).map((p) => ({
      email: p.email,
      nombre: p.nombre,
      rol: p.rol,
    }));
  } catch (err) {
    return [];
  }
}

// --- 3. Plantillas: se resuelven los include del lado de Apps Script -------

function leerUi(nombre) {
  return fs.readFileSync(path.join(DIR_GS, nombre + '.html'), 'utf8');
}

function renderizarIndex(usuario, vista) {
  let html = leerUi('ui/Index');
  html = html.replace(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g, (_m, archivo) => leerUi(archivo));
  html = html
    .replace(/<\?=\s*token\s*\?>/g, '')
    .replace(/<\?=\s*appName\s*\?>/g, nombreApp())
    .replace(/<\?=\s*vistaInicial\s*\?>/g, vista || '');
  return html.replace('</body>', barraLocal(usuario) + '</body>');
}

function nombreApp() {
  try {
    return vm.runInContext('CONFIG.APP_NAME', contexto);
  } catch (err) {
    return 'Sistema de Actividades';
  }
}

/** Selector de persona + puente hacia /api, solo en modo local. */
function barraLocal(usuario) {
  const personas = personasLocales();
  const opciones = personas
    .map(
      (p) =>
        `<option value="${p.email}"${p.email === usuario ? ' selected' : ''}>` +
        `${p.nombre} — ${p.rol}</option>`
    )
    .join('');

  return `
<div style="position:fixed;left:0;right:0;bottom:0;background:#ffefc2;border-top:1px solid #e0c97a;
            padding:7px 14px;font:13px system-ui;display:flex;gap:10px;align-items:center;z-index:80">
  <b>Modo local</b>
  <span style="color:#7a6a3a">Estás viendo el sistema como:</span>
  <select id="__usuario_local" style="padding:4px 8px;border-radius:6px;border:1px solid #d9c489">
    ${opciones}
  </select>
  <span style="color:#7a6a3a;margin-left:auto">Los datos viven en local/datos.json</span>
</div>
<script>
  (function () {
    var USUARIO = ${JSON.stringify(usuario)};
    window.__API_LOCAL__ = function (accion, payload) {
      return fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: accion, payload: payload, usuario: USUARIO })
      })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (r.ok) return r.data;
          throw new Error(r.error);
        });
    };
    document.getElementById('__usuario_local').addEventListener('change', function () {
      location.search = '?u=' + encodeURIComponent(this.value);
    });
    document.body.style.paddingBottom = '46px';
  })();
</script>`;
}

// --- 4. Servidor -----------------------------------------------------------

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/api') {
    let cuerpo = '';
    req.on('data', (c) => {
      cuerpo += c;
      if (cuerpo.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      let salida;
      try {
        const { accion, payload, usuario } = JSON.parse(cuerpo || '{}');
        estado.usuarioActual = usuario || '';
        vm.runInContext('invalidarCache();', contexto);
        globals.__accion = accion;
        globals.__payload = payload || {};
        salida = vm.runInContext('api(__accion, __payload);', contexto);
        estado.guardar();
      } catch (err) {
        salida = { ok: false, error: err.message };
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(salida));
    });
    return;
  }

  if (url.pathname === '/correos') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(estado.correos, null, 2));
    return;
  }

  if (url.pathname === '/rutina-diaria') {
    estado.usuarioActual = 'administracion@ejemplo.com';
    vm.runInContext('invalidarCache(); rutinaDiaria();', contexto);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Rutina ejecutada. Revisa /correos y la consola.');
    return;
  }

  if (url.pathname === '/') {
    const personas = personasLocales();
    const porDefecto = (personas.filter((p) => p.rol === 'Administracion')[0] || personas[0] || {}).email || '';
    const usuario = url.searchParams.get('u') || porDefecto;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderizarIndex(usuario, url.searchParams.get('v') || ''));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('No encontrado');
});

servidor.listen(PUERTO, () => {
  console.log('');
  console.log('  Sistema de actividades — modo local');
  console.log('  http://localhost:' + PUERTO);
  console.log('');
  console.log('  /               interfaz (cambia de persona con el selector de abajo)');
  console.log('  /rutina-diaria  simula los correos de la cadena de cumplimiento');
  console.log('  /correos        lo que se habría enviado');
  console.log('');
});
