/**
 * WebApp.gs — La puerta de entrada de las personas.
 *
 * La web app se publica ejecutándose COMO EL DUEÑO. Eso es lo que permite
 * que un responsable use el sistema sin tener acceso al Spreadsheet:
 * él nunca toca el archivo, solo esta interfaz, y el servidor le entrega
 * exclusivamente sus filas.
 */

function doGet(e) {
  const params = (e && e.parameter) || {};
  const t = HtmlService.createTemplateFromFile('ui/Index');

  t.token = params.k || '';
  t.appName = CONFIG.APP_NAME;
  t.vistaInicial = params.v || '';

  return t
    .evaluate()
    .setTitle(CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Permite partir la interfaz en archivos. */
function include(archivo) {
  return HtmlService.createHtmlOutputFromFile(archivo).getContent();
}
