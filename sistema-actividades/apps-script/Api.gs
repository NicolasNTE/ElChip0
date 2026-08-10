/**
 * Api.gs — Puerta única entre el navegador y los datos.
 *
 * El cliente llama siempre a `api(accion, payload)`. El servidor identifica
 * a la persona, decide qué puede ver y qué puede escribir, y responde solo
 * con eso. El navegador nunca recibe filas que el usuario no debería ver:
 * el filtrado es del lado del servidor, no del lado de la pantalla.
 */

/**
 * @param {string} accion
 * @param {Object} payload Incluye `k` (token del enlace personal, si aplica).
 * @return {{ok:boolean, data:*, error:string}}
 */
function api(accion, payload) {
  const p = payload || {};
  try {
    const usuario = identificarUsuario(p.k);
    const data = _despachar(accion, p, usuario);
    return { ok: true, data: data };
  } catch (err) {
    console.error(accion + ': ' + (err && err.stack ? err.stack : err));
    return { ok: false, error: (err && err.message) || String(err) };
  }
}

function _despachar(accion, p, usuario) {
  switch (accion) {
    case 'bootstrap': return apiBootstrap(usuario);
    case 'listar': return apiListar(usuario, p);
    case 'crear': return apiCrear(usuario, p);
    case 'actualizar': return apiActualizar(usuario, p);
    case 'historial': return apiHistorial(usuario, p);
    case 'indicadores': return apiIndicadores(usuario);
    case 'excepciones': return apiExcepciones(usuario);
    case 'decisiones': return apiDecisiones(usuario);
    case 'resolverDecision': return apiResolverDecision(usuario, p);
    case 'personas': return apiPersonas(usuario);
    case 'generarEnlace': return apiGenerarEnlace(usuario, p);
    case 'revocarEnlace': return apiRevocarEnlace(usuario, p);
    case 'recordatorio': return apiRecordatorio(usuario, p);
    default: throw new Error('Acción desconocida: ' + accion);
  }
}

/** Todo lo que la interfaz necesita para arrancar, en una sola llamada. */
function apiBootstrap(usuario) {
  const personas = listarPersonas();
  return {
    usuario: {
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      proyectos: usuario.proyectos,
    },
    appName: CONFIG.APP_NAME,
    catalogos: {
      estado: CONFIG.CATALOGOS.ESTADO,
      prioridad: CONFIG.CATALOGOS.PRIORIDAD,
      siNo: CONFIG.CATALOGOS.SI_NO,
      proyecto: listarProyectos(),
      // Solo Administración necesita la lista de gente para asignar.
      encargados: esAdmin(usuario)
        ? personas.filter(function (x) { return x.activo; }).map(function (x) { return x.nombre; })
        : [usuario.nombre],
    },
    permisos: {
      puedeCrear: puedeCrear(usuario),
      puedeAsignar: esAdmin(usuario),
      puedeAdministrarAccesos: esAdmin(usuario),
      verTodo: esAdmin(usuario) || esGerencia(usuario),
    },
    /**
     * Los nombres de columna viajan al cliente para que la interfaz no
     * los tenga escritos a mano: si mañana cambia una cabecera en Config,
     * la pantalla sigue funcionando.
     */
    campos: CONFIG.COLS,
    roles: CONFIG.ROLES,
    umbrales: CONFIG.ALERTAS,
  };
}

/** Actividades visibles para este usuario, ya ordenadas para trabajar. */
function apiListar(usuario, p) {
  const filtro = p.filtro || {};
  const visibles = todasLasActividades().filter(function (a) { return puedeVer(usuario, a); });
  var lista = visibles;

  // "Mis actividades" siempre significa MÍAS, incluso para Administración,
  // que en su otra vista sí ve todo.
  if (filtro.soloMias) {
    lista = lista.filter(function (a) {
      return normalizarEmail(a.encargadoEmail) === usuario.email;
    });
  }
  if (filtro.proyecto) {
    lista = lista.filter(function (a) { return a.proyecto === filtro.proyecto; });
  }
  if (filtro.encargado) {
    lista = lista.filter(function (a) { return a.encargado === filtro.encargado; });
  }
  if (filtro.estado) {
    lista = lista.filter(function (a) { return a.estado === filtro.estado; });
  }
  if (filtro.soloAbiertas) {
    lista = lista.filter(function (a) { return !a.cerrada; });
  }
  if (filtro.senal) {
    lista = lista.filter(function (a) { return a.senales.indexOf(filtro.senal) >= 0; });
  }
  // Las etiquetas son libres, no un catálogo: cualquiera pudo haber creado
  // "Fase 1" en Cristobal y "Fase 1" en Madreselva; el filtro es literal.
  if (filtro.etiqueta) {
    lista = lista.filter(function (a) { return a.etiquetas.indexOf(filtro.etiqueta) >= 0; });
  }
  if (filtro.texto) {
    const q = String(filtro.texto).toLowerCase();
    lista = lista.filter(function (a) {
      return (
        a.actividad.toLowerCase().indexOf(q) >= 0 ||
        a.comentario.toLowerCase().indexOf(q) >= 0 ||
        a.proyecto.toLowerCase().indexOf(q) >= 0
      );
    });
  }

  const ordenadas = ordenarParaTrabajo(lista);
  // Cada fila viaja con lo que el usuario puede tocar: la UI no adivina.
  ordenadas.forEach(function (a) { a.editables = camposEditables(usuario, a); });

  return {
    actividades: ordenadas,
    resumen: calcularIndicadores(ordenadas).global,
    // El universo de etiquetas sale de lo VISIBLE, no de lo ya filtrado:
    // así no desaparecen del desplegable en cuanto filtras por una de ellas.
    etiquetas: listarEtiquetas(visibles),
  };
}

/** Alta de actividad. El Responsable solo puede crearse trabajo a sí mismo. */
function apiCrear(usuario, p) {
  if (!puedeCrear(usuario)) throw new Error('Tu rol no puede crear actividades.');
  const C = CONFIG.COLS;
  const entrada = p.actividad || {};

  const encargado = esAdmin(usuario)
    ? String(entrada.encargado || usuario.nombre).trim()
    : usuario.nombre;

  const parche = {};
  parche[C.PROYECTO] = entrada.proyecto;
  parche[C.ACTIVIDAD] = entrada.actividad;
  parche[C.ETIQUETAS] = entrada.etiquetas || '';
  parche[C.ENCARGADO] = encargado;
  parche[C.PRIORIDAD] = entrada.prioridad || DEFAULTS.PRIORIDAD;
  parche[C.ESTADO] = entrada.estado || DEFAULTS.ESTADO;
  parche[C.RIESGO] = entrada.riesgo || DEFAULTS.RIESGO;
  parche[C.RIESGO_DETALLE] = entrada.riesgoDetalle || '';
  parche[C.BLOQUEO] = entrada.bloqueo || DEFAULTS.BLOQUEO;
  parche[C.DECISION] = entrada.decision || '';
  parche[C.COMENTARIO] = entrada.comentario || '';
  if (entrada.fechaLimite) parche[C.FECHA_LIMITE] = entrada.fechaLimite;

  const limpio = validarCampos(parche, usuario);

  return conBloqueo(function () {
    const id = nuevoId();
    limpio[C.ID] = id;
    limpio[C.CREADO_POR] = usuario.email;
    limpio[C.CREADO_EN] = new Date();
    limpio[C.ACTUALIZADO_POR] = usuario.email;
    limpio[C.ACTUALIZADO_EN] = new Date();

    agregarFila(CONFIG.SHEETS.MADRE, limpio);
    registrarBitacora(usuario.email, 'ALTA', id, CONFIG.COLS.ACTIVIDAD, '', limpio[C.ACTIVIDAD]);

    const creada = actividadPorId(id);
    creada.editables = camposEditables(usuario, creada);
    return creada;
  });
}

/**
 * Edición campo a campo, con permiso por campo y por fila.
 * Un Responsable puede mover el estado de SU actividad y nada más.
 */
function apiActualizar(usuario, p) {
  const C = CONFIG.COLS;
  const id = String(p.id || '').trim();
  if (!id) throw new Error('Falta el ID de la actividad.');

  const actual = actividadPorId(id);
  if (!puedeVer(usuario, actual)) throw new Error('No tienes acceso a esa actividad.');

  const permitidos = camposEditables(usuario, actual);
  const solicitado = p.cambios || {};
  const parche = {};

  Object.keys(solicitado).forEach(function (campo) {
    if (permitidos.indexOf(campo) < 0) {
      throw new Error('Tu rol no puede modificar "' + campo + '".');
    }
    parche[campo] = solicitado[campo];
  });
  if (!Object.keys(parche).length) throw new Error('No hay cambios que guardar.');

  const limpio = validarCampos(parche, usuario);

  return conBloqueo(function () {
    // Releemos dentro del lock: si alguien más escribió, trabajamos sobre lo último.
    invalidarCache(CONFIG.SHEETS.MADRE);
    const vigente = actividadPorId(id);

    const antes = {};
    Object.keys(limpio).forEach(function (campo) {
      antes[campo] = _valorActual(vigente, campo);
    });

    limpio[C.ACTUALIZADO_POR] = usuario.email;
    limpio[C.ACTUALIZADO_EN] = new Date();

    actualizarFila(CONFIG.SHEETS.MADRE, vigente.fila, limpio);
    registrarCambios(usuario.email, id, antes, parche);

    const nueva = actividadPorId(id);
    nueva.editables = camposEditables(usuario, nueva);
    return nueva;
  });
}

/** Lee del objeto de dominio el valor que corresponde a una cabecera. */
function _valorActual(actividad, cabecera) {
  const C = CONFIG.COLS;
  const mapa = {};
  mapa[C.PROYECTO] = actividad.proyecto;
  mapa[C.ACTIVIDAD] = actividad.actividad;
  mapa[C.ETIQUETAS] = actividad.etiquetasTexto;
  mapa[C.ENCARGADO] = actividad.encargado;
  mapa[C.FECHA_LIMITE] = actividad.fechaLimite;
  mapa[C.PRIORIDAD] = actividad.prioridad;
  mapa[C.ESTADO] = actividad.estado;
  mapa[C.RIESGO] = actividad.riesgo;
  mapa[C.RIESGO_DETALLE] = actividad.riesgoDetalle;
  mapa[C.BLOQUEO] = actividad.bloqueo;
  mapa[C.DECISION] = actividad.decision;
  mapa[C.COMENTARIO] = actividad.comentario;
  return mapa[cabecera] !== undefined ? mapa[cabecera] : '';
}

function apiHistorial(usuario, p) {
  const actual = actividadPorId(p.id);
  if (!puedeVer(usuario, actual)) throw new Error('No tienes acceso a esa actividad.');
  return historialDe(p.id, 30);
}

/** Vista Gerencial: consolidado. */
function apiIndicadores(usuario) {
  if (esResponsable(usuario)) throw new Error('Vista no disponible para tu rol.');
  const visibles = todasLasActividades().filter(function (a) { return puedeVer(usuario, a); });
  const ind = calcularIndicadores(visibles);
  ind.decisiones = colaDeDecisiones(visibles);
  return ind;
}

/** Vista Administración: el tablero de excepciones (detectar y escalar). */
function apiExcepciones(usuario) {
  if (!esAdmin(usuario) && !esGerencia(usuario)) throw new Error('Vista no disponible para tu rol.');
  const visibles = todasLasActividades().filter(function (a) { return puedeVer(usuario, a); });
  const tablero = tableroDeExcepciones(visibles);
  Object.keys(tablero).forEach(function (k) {
    tablero[k].forEach(function (a) { a.editables = camposEditables(usuario, a); });
  });
  return tablero;
}

function apiDecisiones(usuario) {
  const visibles = todasLasActividades().filter(function (a) { return puedeVer(usuario, a); });
  return colaDeDecisiones(visibles);
}

/**
 * Gerencia cierra un bloqueo: baja la bandera y deja la decisión escrita
 * en el comentario, con fecha. Así la respuesta queda en el sistema y no
 * en un chat.
 */
function apiResolverDecision(usuario, p) {
  if (!esGerencia(usuario) && !esAdmin(usuario)) {
    throw new Error('Solo Gerencia o Administración pueden cerrar un bloqueo.');
  }
  const C = CONFIG.COLS;
  const respuesta = String(p.respuesta || '').trim();
  if (!respuesta) throw new Error('Escribe la decisión antes de cerrar el bloqueo.');

  const actual = actividadPorId(p.id);
  const nuevoComentario = (
    '[' + ahoraTexto() + ' · Gerencia] ' + respuesta + (actual.comentario ? ' | ' + actual.comentario : '')
  ).slice(0, 2000);

  const cambios = {};
  cambios[C.BLOQUEO] = 'No';
  cambios[C.COMENTARIO] = nuevoComentario;

  return apiActualizar(usuario, { id: p.id, cambios: cambios });
}

/** Padrón de accesos: solo Administración. */
function apiPersonas(usuario) {
  if (!esAdmin(usuario)) throw new Error('Solo Administración administra los accesos.');
  return listarPersonas().map(function (x) {
    return {
      email: x.email,
      nombre: x.nombre,
      rol: x.rol,
      activo: x.activo,
      tieneEnlace: !!x.tokenHash,
      proyectos: x.proyectos,
    };
  });
}

function apiGenerarEnlace(usuario, p) {
  if (!esAdmin(usuario)) throw new Error('Solo Administración administra los accesos.');
  return conBloqueo(function () { return generarEnlaceAcceso(p.email); });
}

function apiRevocarEnlace(usuario, p) {
  if (!esAdmin(usuario)) throw new Error('Solo Administración administra los accesos.');
  return conBloqueo(function () { return revocarEnlaceAcceso(p.email); });
}

/** Eslabón 4: escalar. Administración empuja a un responsable concreto. */
function apiRecordatorio(usuario, p) {
  if (!esAdmin(usuario)) throw new Error('Solo Administración puede escalar.');
  return enviarRecordatorio(String(p.email || ''), String(p.mensaje || ''), usuario);
}
