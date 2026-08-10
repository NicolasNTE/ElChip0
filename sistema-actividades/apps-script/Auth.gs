/**
 * Auth.gs — Identidad y permisos.
 *
 * Principio de acceso: la Tabla Madre NO se comparte con nadie salvo
 * Administración. Todos entran por la web app, que se ejecuta con permisos
 * del dueño y devuelve únicamente lo que el rol permite ver.
 *
 * Dos modos de identidad (ver CONFIG.MODO_IDENTIDAD):
 *  - DOMINIO: Google Workspace. La sesión identifica a la persona.
 *  - TOKEN:   Cuentas Gmail sueltas. Cada persona recibe un enlace personal
 *             con ?k=<token>; en la hoja Personas solo se guarda su hash.
 */

/** Campos que cada rol puede escribir en una actividad ya existente. */
const PERMISOS_CAMPO = {
  Responsable: [
    CONFIG.COLS.ESTADO,
    CONFIG.COLS.COMENTARIO,
    CONFIG.COLS.ETIQUETAS,
    CONFIG.COLS.RIESGO,
    CONFIG.COLS.RIESGO_DETALLE,
    CONFIG.COLS.BLOQUEO,
    CONFIG.COLS.DECISION,
  ],
  Administracion: [
    CONFIG.COLS.PROYECTO,
    CONFIG.COLS.ACTIVIDAD,
    CONFIG.COLS.ETIQUETAS,
    CONFIG.COLS.ENCARGADO,
    CONFIG.COLS.FECHA_LIMITE,
    CONFIG.COLS.PRIORIDAD,
    CONFIG.COLS.ESTADO,
    CONFIG.COLS.RIESGO,
    CONFIG.COLS.RIESGO_DETALLE,
    CONFIG.COLS.BLOQUEO,
    CONFIG.COLS.DECISION,
    CONFIG.COLS.COMENTARIO,
  ],
  Gerencia: [
    CONFIG.COLS.BLOQUEO,
    CONFIG.COLS.DECISION,
    CONFIG.COLS.COMENTARIO,
    CONFIG.COLS.ETIQUETAS,
  ],
};

/**
 * Campos extra que el Responsable puede editar SOLO en las actividades que
 * él mismo creó (todavía no las tomó Administración).
 */
const PERMISOS_CAMPO_PROPIA = [
  CONFIG.COLS.ACTIVIDAD,
  CONFIG.COLS.FECHA_LIMITE,
  CONFIG.COLS.PRIORIDAD,
  CONFIG.COLS.PROYECTO,
];

/** Lee el padrón de personas como lista de objetos normalizados. */
function listarPersonas() {
  const P = CONFIG.COLS_PERSONAS;
  return leerTabla(CONFIG.SHEETS.PERSONAS).filas.map(function (f) {
    return {
      email: String(f[P.EMAIL] || '').trim().toLowerCase(),
      nombre: String(f[P.NOMBRE] || '').trim(),
      rol: String(f[P.ROL] || '').trim(),
      activo: normalizarSiNo(f[P.ACTIVO]) === 'Si',
      tokenHash: String(f[P.TOKEN_HASH] || '').trim(),
      proyectos: String(f[P.PROYECTOS] || '')
        .split(',')
        .map(function (s) { return s.trim(); })
        .filter(String),
      _fila: f._fila,
    };
  });
}

/** Acepta Si/Sí/TRUE/1/x y devuelve 'Si' o 'No'. */
function normalizarSiNo(valor) {
  if (valor === true) return 'Si';
  if (valor === false || valor === '' || valor === null || valor === undefined) return 'No';
  const t = String(valor).trim().toLowerCase();
  if (t === 'si' || t === 'sí' || t === 'true' || t === '1' || t === 'x' || t === 'yes') return 'Si';
  return 'No';
}

/** Hash del token de acceso. No guardamos el token en claro en ningún lado. */
function hashToken(token) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(token) + '|' + _salToken()
  );
  return bytes
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); })
    .join('');
}

/** Sal del hash, generada una vez y guardada en propiedades del script. */
function _salToken() {
  const props = PropertiesService.getScriptProperties();
  var sal = props.getProperty('SAL_TOKEN');
  if (!sal) {
    sal = Utilities.getUuid();
    props.setProperty('SAL_TOKEN', sal);
  }
  return sal;
}

/** Comparación en tiempo constante para no filtrar información por timing. */
function comparaSegura(a, b) {
  const x = String(a || '');
  const y = String(b || '');
  if (x.length !== y.length) return false;
  var dif = 0;
  for (var i = 0; i < x.length; i++) dif |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return dif === 0;
}

/**
 * Resuelve quién está usando el sistema.
 * @param {string=} token Token del enlace personal (modo TOKEN).
 * @return {{email:string, nombre:string, rol:string, proyectos:string[]}}
 * @throws si la persona no está en el padrón o está inactiva.
 */
function identificarUsuario(token) {
  const personas = listarPersonas();
  const modo = CONFIG.MODO_IDENTIDAD;

  if (modo === 'DOMINIO' || modo === 'AUTO') {
    var email = '';
    try {
      email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
    } catch (err) {
      email = '';
    }
    if (email) {
      const persona = personas.filter(function (p) { return p.email === email; })[0];
      if (persona && persona.activo) return persona;
      if (persona && !persona.activo) throw new Error('Tu acceso está desactivado. Habla con Administración.');
      if (modo === 'DOMINIO') {
        throw new Error('El correo ' + email + ' no está en el padrón. Habla con Administración.');
      }
    } else if (modo === 'DOMINIO') {
      throw new Error('No se pudo identificar tu sesión de Google.');
    }
  }

  // Modo TOKEN (o AUTO sin sesión reconocible).
  if (!token) {
    throw new Error('Falta tu enlace personal de acceso. Pídelo a Administración.');
  }
  const hash = hashToken(token);
  const porToken = personas.filter(function (p) {
    return p.tokenHash && comparaSegura(p.tokenHash, hash);
  })[0];
  if (!porToken) throw new Error('Enlace de acceso inválido o revocado.');
  if (!porToken.activo) throw new Error('Tu acceso está desactivado. Habla con Administración.');
  return porToken;
}

function esAdmin(usuario) { return usuario.rol === CONFIG.ROLES.ADMIN; }
function esGerencia(usuario) { return usuario.rol === CONFIG.ROLES.GERENCIA; }
function esResponsable(usuario) { return usuario.rol === CONFIG.ROLES.RESPONSABLE; }

/** ¿Este usuario puede ver esta actividad? */
function puedeVer(usuario, actividad) {
  if (esAdmin(usuario) || esGerencia(usuario)) {
    // Alcance opcional por proyecto (útil para gerentes de una sola unidad).
    if (usuario.proyectos.length) return usuario.proyectos.indexOf(actividad.proyecto) >= 0;
    return true;
  }
  return normalizarEmail(actividad.encargadoEmail) === usuario.email;
}

function normalizarEmail(v) { return String(v || '').trim().toLowerCase(); }

/**
 * Devuelve la lista de campos que este usuario puede escribir en esta actividad.
 * @return {string[]}
 */
function camposEditables(usuario, actividad) {
  const base = (PERMISOS_CAMPO[usuario.rol] || []).slice();
  if (esResponsable(usuario) && actividad && normalizarEmail(actividad.creadoPor) === usuario.email) {
    PERMISOS_CAMPO_PROPIA.forEach(function (c) {
      if (base.indexOf(c) < 0) base.push(c);
    });
  }
  return base;
}

/** ¿Puede crear actividades? Todos los roles operativos sí; Gerencia no. */
function puedeCrear(usuario) {
  return esAdmin(usuario) || esResponsable(usuario);
}

/**
 * Genera (o regenera) el enlace personal de una persona.
 * Solo Administración. Devuelve el token en claro UNA vez: no se puede recuperar.
 */
function generarEnlaceAcceso(emailDestino) {
  const P = CONFIG.COLS_PERSONAS;
  const email = normalizarEmail(emailDestino);
  const persona = listarPersonas().filter(function (p) { return p.email === email; })[0];
  if (!persona) throw new Error('No existe la persona ' + email + ' en el padrón.');

  const token = Utilities.getUuid().replace(/-/g, '');
  const parche = {};
  parche[P.TOKEN_HASH] = hashToken(token);
  actualizarFila(CONFIG.SHEETS.PERSONAS, persona._fila, parche);

  const url = ScriptApp.getService().getUrl() + '?k=' + token;
  registrarBitacora('SISTEMA', 'ENLACE_GENERADO', '', 'Token', '', email);
  return { email: email, nombre: persona.nombre, url: url };
}

/** Revoca el enlace personal de alguien (deja de poder entrar en modo TOKEN). */
function revocarEnlaceAcceso(emailDestino) {
  const P = CONFIG.COLS_PERSONAS;
  const email = normalizarEmail(emailDestino);
  const persona = listarPersonas().filter(function (p) { return p.email === email; })[0];
  if (!persona) throw new Error('No existe la persona ' + email + ' en el padrón.');
  const parche = {};
  parche[P.TOKEN_HASH] = '';
  actualizarFila(CONFIG.SHEETS.PERSONAS, persona._fila, parche);
  registrarBitacora('SISTEMA', 'ENLACE_REVOCADO', '', 'Token', email, '');
  return true;
}
