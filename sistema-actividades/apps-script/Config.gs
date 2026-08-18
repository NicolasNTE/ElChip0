/**
 * Config.gs — Parámetros del sistema.
 *
 * Todo lo que puede cambiar sin tocar lógica vive aquí: nombres de hojas,
 * cabeceras canónicas, catálogos, pesos de avance y umbrales de alerta.
 *
 * Regla de oro del sistema: el dato se ingresa UNA vez, en la Tabla Madre.
 * Las tres vistas son proyecciones de esa misma tabla. Nadie copia nada.
 */

const CONFIG = {
  /**
   * ID del Google Sheet que hace de base de datos.
   * Déjalo vacío si el script está enlazado al propio Sheet (recomendado).
   */
  SPREADSHEET_ID: '',

  /** Nombre visible del sistema (aparece en la cabecera de la web app). */
  APP_NAME: 'Sistema de Seguimiento de Actividades',

  /** Zona horaria para fechas y reportes. */
  TIMEZONE: 'America/Lima',

  SHEETS: {
    MADRE: 'Tabla Madre',
    PERSONAS: 'Personas',
    CATALOGOS: 'Catalogos',
    BITACORA: 'Bitacora',
  },

  /**
   * Cabeceras canónicas de la Tabla Madre.
   * El código NUNCA usa índices fijos: resuelve la columna por su nombre,
   * así puedes reordenar columnas en el Sheet sin romper nada.
   */
  COLS: {
    ID: 'ID',
    PROYECTO: 'Proyecto',
    ACTIVIDAD: 'Actividad',
    ETIQUETAS: 'Etiquetas',
    ENCARGADO: 'Encargado',
    FECHA_LIMITE: 'Fecha limite',
    PRIORIDAD: 'Prioridad',
    ESTADO: 'Estado',
    RIESGO: 'Riesgo/Interferencia',
    RIESGO_DETALLE: 'Detalle del riesgo',
    BLOQUEO: 'Bloqueo de Gerencia',
    DECISION: 'Decision requerida',
    COMENTARIO: 'Comentario',
    CREADO_POR: 'Creado por',
    CREADO_EN: 'Creado en',
    ACTUALIZADO_POR: 'Actualizado por',
    ACTUALIZADO_EN: 'Actualizado en',
  },

  /** Cabeceras de la hoja Personas (padrón de accesos). */
  COLS_PERSONAS: {
    EMAIL: 'Email',
    NOMBRE: 'Nombre',
    ROL: 'Rol',
    ACTIVO: 'Activo',
    TOKEN_HASH: 'Token hash',
    PROYECTOS: 'Proyectos',
  },

  /** Cabeceras de la hoja Bitacora (auditoría append-only). */
  COLS_BITACORA: {
    FECHA: 'Fecha',
    ACTOR: 'Actor',
    ACCION: 'Accion',
    ACTIVIDAD_ID: 'Actividad ID',
    CAMPO: 'Campo',
    ANTERIOR: 'Valor anterior',
    NUEVO: 'Valor nuevo',
  },

  /** Catálogos cerrados. Cambiarlos aquí actualiza validaciones y filtros. */
  CATALOGOS: {
    ESTADO: ['Por hacer', 'En curso', 'Finalizado', 'Anulado'],
    PRIORIDAD: ['Alta', 'Media', 'Baja'],
    SI_NO: ['No', 'Si'],
    /** Los proyectos se administran desde la hoja Catalogos, no aquí. */
    PROYECTO_SEMILLA: ['Cristobal', 'Madreselva', 'Bellaterra'],
  },

  ROLES: {
    RESPONSABLE: 'Responsable',
    ADMIN: 'Administracion',
    GERENCIA: 'Gerencia',
  },

  /**
   * Pesos para calcular el % de avance sin pedir un dato extra.
   * El avance se DERIVA del estado: nadie tiene que escribir "35%".
   */
  PESO_AVANCE: {
    'Por hacer': 0,
    'En curso': 0.5,
    'Finalizado': 1,
  },

  /** Estados que ya no cuentan como carga viva. */
  ESTADOS_CERRADOS: ['Finalizado', 'Anulado'],

  /** Umbrales de la cadena de cumplimiento (eslabón 2: detectar). */
  ALERTAS: {
    /** Días de anticipación para marcar "por vencer". */
    DIAS_POR_VENCER: 3,
    /** Días sin tocar una actividad viva antes de marcarla "sin actualizar". */
    DIAS_SIN_ACTUALIZAR: 7,
    /** Días que una decisión de Gerencia puede esperar antes de escalar. */
    DIAS_BLOQUEO_CRITICO: 5,
  },

  /**
   * Modo de identidad:
   *  'DOMINIO' — Google Workspace: la web app reconoce al usuario por su sesión.
   *  'TOKEN'   — Cuentas Gmail sueltas: cada persona entra con su enlace personal.
   *  'AUTO'    — Intenta dominio y cae a token si no hay sesión reconocible.
   */
  MODO_IDENTIDAD: 'AUTO',

  /** Correo del administrador (recibe el resumen de excepciones). */
  EMAIL_ADMIN: '',
};

/** Estados/valores por defecto al crear una actividad. */
const DEFAULTS = {
  ESTADO: 'Por hacer',
  PRIORIDAD: 'Media',
  RIESGO: 'No',
  BLOQUEO: 'No',
};
