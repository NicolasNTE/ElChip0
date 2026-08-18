# Instalación

Tiempo estimado: **40–60 minutos**. Costo: **cero**.
Solo hace falta una cuenta de Google con Drive.

---

## Antes de empezar: elige el modo de identidad

De esto depende un solo ajuste, pero conviene decidirlo ahora.

| Situación | Modo | Qué implica |
|---|---|---|
| La organización tiene Google Workspace con dominio propio (`@tuempresa.com`) | `DOMINIO` | Cada quien entra con su cuenta de trabajo. No repartes nada. Es lo más limpio. |
| El equipo usa Gmail suelto (`@gmail.com`) | `TOKEN` | Administración genera un enlace personal por persona. Funciona igual de bien, requiere repartir los enlaces una vez. |
| No estás seguro | `AUTO` | Intenta el dominio y, si no reconoce la sesión, pide el enlace personal. **Este es el valor por defecto.** |

---

## Paso 1 — Crear la hoja

1. En Drive: **Nuevo → Google Sheets**.
2. Nómbrala, por ejemplo, `Sistema de Actividades (BASE)`.
3. **No la compartas con nadie todavía.** Este archivo es la base de datos; el
   equipo no va a entrar por aquí.

## Paso 2 — Abrir el editor de Apps Script

En la hoja: **Extensiones → Apps Script**. Se abre un proyecto vacío llamado
`Código.gs`.

## Paso 3 — Cargar el código

### Opción A — Copiar y pegar (sin instalar nada)

Crea un archivo por cada uno de estos y pega su contenido. **El orden no
importa**, pero los nombres sí:

| Archivo en Apps Script | Tipo | Contenido de |
|---|---|---|
| `Config` | Script | `apps-script/Config.gs` |
| `Repo` | Script | `apps-script/Repo.gs` |
| `Auth` | Script | `apps-script/Auth.gs` |
| `Actividades` | Script | `apps-script/Actividades.gs` |
| `Audit` | Script | `apps-script/Audit.gs` |
| `Metrics` | Script | `apps-script/Metrics.gs` |
| `Notify` | Script | `apps-script/Notify.gs` |
| `Api` | Script | `apps-script/Api.gs` |
| `WebApp` | Script | `apps-script/WebApp.gs` |
| `Setup` | Script | `apps-script/Setup.gs` |
| `ui/Index` | HTML | `apps-script/ui/Index.html` |
| `ui/Styles` | HTML | `apps-script/ui/Styles.html` |
| `ui/App` | HTML | `apps-script/ui/App.html` |

> Para los tres últimos: **Archivo → Nuevo → Archivo HTML**, y escribe el nombre
> incluyendo la barra: `ui/Index`. Apps Script lo acepta.

Borra el `Código.gs` vacío que venía por defecto.

### Opción B — Con `clasp` (recomendado si vas a mantenerlo desde aquí)

```bash
npm install -g @google/clasp
clasp login

cd apps-script
cp .clasp.json.ejemplo .clasp.json
# pega el ID del proyecto: en Apps Script, Configuración del proyecto → ID
clasp push
```

A partir de ahí, cada cambio en este repositorio se despliega con `clasp push`.

## Paso 4 — Ajustar la configuración

En `Config.gs`, revisa:

```js
TIMEZONE: 'America/Lima',
MODO_IDENTIDAD: 'AUTO',        // o 'DOMINIO' / 'TOKEN'
EMAIL_ADMIN: 'tucorreo@...',   // recibe el resumen diario de excepciones
```

Y los umbrales, si quieres otros:

```js
ALERTAS: {
  DIAS_POR_VENCER: 3,          // cuántos días antes avisar
  DIAS_SIN_ACTUALIZAR: 7,      // cuándo una actividad se considera abandonada
  DIAS_BLOQUEO_CRITICO: 5,     // cuánto puede esperar una decisión de Gerencia
}
```

## Paso 5 — Instalar la estructura

En el editor, selecciona la función **`instalarSistema`** y pulsa ▶ *Ejecutar*.

La primera vez Google pedirá autorización: **Revisar permisos → tu cuenta →
Configuración avanzada → Ir a (nombre del proyecto)**. Es tu propio script
pidiendo permiso sobre tu propia hoja; la advertencia aparece porque el proyecto
no está verificado públicamente.

Esto crea cuatro hojas:

- **Tabla Madre** — los datos. Con listas desplegables y colores automáticos.
- **Personas** — el padrón de accesos.
- **Catalogos** — los proyectos.
- **Bitacora** — quién cambió qué y cuándo.

`instalarSistema()` se puede volver a ejecutar cuando quieras: no borra nada,
solo agrega lo que falte.

> **¿Ya tienes un tablero armado?** Pega tus filas en `Tabla Madre` respetando
> las cabeceras y vuelve a ejecutar `instalarSistema()`: le pondrá ID a las
> filas que no lo tengan. Detalle en [MODELO-DATOS.md](MODELO-DATOS.md).

## Paso 6 — Registrar al equipo

Ve a la hoja **Personas** y llena una fila por persona:

| Email | Nombre | Rol | Activo | Token hash | Proyectos |
|---|---|---|---|---|---|
| `mafer@...` | `Mafer` | `Responsable` | `Si` | *(vacío)* | *(vacío)* |
| `admin@...` | `Administracion` | `Administracion` | `Si` | | |
| `gerencia@...` | `Gerencia` | `Gerencia` | `Si` | | |

Reglas:

- **Nombre** debe coincidir exactamente con lo que aparece en la columna
  `Encargado` de la Tabla Madre. Es la llave que conecta a la persona con su
  trabajo.
- **Rol** solo puede ser `Responsable`, `Administracion` o `Gerencia`.
- **Activo** en `No` bloquea el acceso sin borrar el historial.
- **Token hash** lo llena el sistema. No lo escribas a mano.
- **Proyectos** (opcional) limita a alguien de Administración o Gerencia a
  ciertos proyectos: `Cristobal, Madreselva`. Vacío = todos.

Vuelve a ejecutar `instalarSistema()` para que los desplegables del Sheet tomen
los nombres nuevos.

## Paso 7 — Publicar la web app

**Implementar → Nueva implementación → Tipo: Aplicación web**

| Campo | Valor | Por qué |
|---|---|---|
| Ejecutar como | **Yo** | Es lo que permite que nadie más necesite acceso al archivo |
| Quién tiene acceso | **Cualquier usuario** (o **Cualquier usuario de tu organización** si usas Workspace) | El control real lo hace el padrón de Personas, no este ajuste |

Copia la URL que te da. Esa es la dirección del sistema.

> **Cada vez que cambies el código**, publica una **versión nueva**
> (*Implementar → Gestionar implementaciones → editar → Versión: Nueva*), o la
> URL seguirá sirviendo el código viejo.

## Paso 8 — Repartir accesos

**Si usas modo `DOMINIO`:** ya está. Manda la URL al equipo.

**Si usas modo `TOKEN` o `AUTO` con cuentas Gmail:** entra a la web app como
Administración, ve a la pestaña **Accesos** y pulsa *Generar* junto a cada
persona. Te muestra un enlace personal — cópialo y mándaselo por privado.

- El enlace se muestra **una sola vez**. En la hoja queda solo su hash.
- *Regenerar* invalida el anterior. *Revocar* corta el acceso de inmediato.
- Cada quien debe guardarlo como marcador. Es su llave.

También funciona desde el menú **⚙️ Sistema → Generar enlaces de acceso** en la
hoja.

## Paso 9 — Encender la cadena de cumplimiento

Ejecuta **`instalarDisparadorDiario`** una vez. Desde entonces, cada mañana a
las 7:00:

- cada responsable recibe **solo sus** pendientes críticos;
- Administración recibe el tablero de excepciones completo;
- Gerencia recibe la cola de decisiones que la está esperando.

Cada correo enlaza de vuelta al sistema. El correo empuja; el dato sigue
viviendo en un solo lugar.

Para probarlo sin esperar: menú **⚙️ Sistema → Enviar resumen ahora**.

---

## Verificación

Antes de invitar a nadie, comprueba estas seis cosas:

1. Abres la URL como Administración y ves las cuatro pestañas.
2. Abres la URL en una ventana de incógnito con el enlace de un responsable y
   ves **solo sus** actividades y una sola pestaña.
3. Ese responsable puede cambiar un estado y no puede cambiar el encargado.
4. Gerencia ve el consolidado y la cola de decisiones, y no puede tocar estados.
5. Al registrar una decisión, el bloqueo baja y el comentario queda con fecha.
6. La hoja `Bitacora` registró todos esos movimientos.

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| "Falta tu enlace personal de acceso" | Modo `AUTO` sin sesión reconocible | Genera un enlace personal desde *Accesos* |
| "El correo … no está en el padrón" | Falta la fila en `Personas` | Agrégala y ejecuta `instalarSistema()` |
| "El encargado X no está en el padrón" | El nombre en `Encargado` no coincide con `Personas` | Iguala la escritura exacta |
| Los cambios de código no se ven | La implementación quedó en la versión vieja | Publica una **versión nueva** |
| "El sistema está ocupado guardando otro cambio" | Dos escrituras simultáneas | Es el bloqueo funcionando. Reintenta |
| No llegan los correos | Cuota diaria agotada (100/día en Gmail gratuito, 1500 en Workspace) | Sube `DIAS_SIN_ACTUALIZAR` o pasa a Workspace |
