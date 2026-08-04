# Sistema de Seguimiento de Actividades

Un sistema de información de **tres vistas** sobre una sola tabla de datos.
Corre sobre Google Drive, cuesta cero y se mantiene desde este repositorio.

> **El principio:** el dato se ingresa **una sola vez** y aparece en todas las
> vistas. Si alguien tiene que copiar información de un tablero a otro, el
> sistema está mal diseñado.

---

## El problema que resuelve

Hoy el tablero es un Excel compartido. Eso trae tres fallas que no se arreglan
con más columnas:

| Falla de hoy | Qué pasa | Cómo lo resuelve el sistema |
|---|---|---|
| Cada quien rastrea sus pendientes por WhatsApp | Mafer revisa tres chats (Cristóbal, Madreselva, Bellaterra) para saber qué le toca | La Vista Responsable filtra `Encargado = yo` sobre **todos** los proyectos |
| Compartir el archivo es todo o nada | Para que alguien actualice su estado hay que darle acceso a la tabla completa | Nadie recibe el archivo. Todos entran por una interfaz que solo devuelve lo que su rol permite |
| Los bloqueos viven en un comentario | "Sr. Jerónimo debe revisar" queda enterrado en la columna Comentario | `Bloqueo de Gerencia` es un campo. La Vista Gerencial lo lista aparte, lo cuenta y mide cuántos días lleva esperando |

---

## Las tres vistas

Las tres leen la **misma** tabla. Ninguna copia datos de otra.

### Vista 1 — Responsable
`Encargado = yo`, sin importar el proyecto.

Cada persona ve solo sus actividades, ordenadas por urgencia y fecha. Puede
**cambiar el estado**, **comentar**, **marcar un riesgo** y **pedir una decisión
de Gerencia**. También puede **agregar actividades propias** — que quedan
automáticamente a su nombre, no puede asignarle trabajo a nadie más.

Cuando Administración le asigna algo, aparece solo. Sin aviso por WhatsApp.

### Vista 2 — Administración
Todos los responsables, todas las actividades, con la data viva.

Es lo que hoy se hace con el Excel, pero encima trae el **tablero de
excepciones**: vencidas, en riesgo, esperando a Gerencia, sin actualizar, sin
fecha límite. Aquí operan los eslabones 2 y 4 de la cadena de cumplimiento
(**detectar** y **escalar**). Administración es dueña de la tabla madre: es el
único rol que reasigna, mueve fechas y administra accesos.

### Vista 3 — Gerencial
El consolidado: % de avance por proyecto, actividades en riesgo/interferencia,
indicadores de cumplimiento por responsable y —lo importante— **la cola de
decisiones que espera a Gerencia**, listada aparte, contada y con antigüedad.

Gerencia no edita el trabajo de nadie: solo **registra su decisión**, y al
hacerlo el bloqueo se levanta y la respuesta queda escrita en la actividad con
fecha y autor. Deja de vivir en un chat.

---

## Cómo se ve

```
                    ┌──────────────────────────────┐
                    │   TABLA MADRE (Google Sheet) │
                    │   un dato, un solo lugar     │
                    └──────────────┬───────────────┘
                                   │  solo Administración tiene el archivo
                    ┌──────────────▼───────────────┐
                    │  Web App (Apps Script)       │
                    │  identifica · filtra · valida│
                    └──┬───────────┬───────────┬───┘
                       │           │           │
              ┌────────▼───┐ ┌─────▼──────┐ ┌──▼─────────┐
              │Responsable │ │Administrac.│ │  Gerencia  │
              │ solo lo    │ │ todo +     │ │ consolidado│
              │ suyo       │ │ excepciones│ │ + decisiones│
              └────────────┘ └────────────┘ └────────────┘
```

El filtrado ocurre **en el servidor**. El navegador de un responsable nunca
recibe las filas de otro: no es que estén ocultas, es que no viajan.

---

## Empezar

### Probarlo aquí mismo, sin cuenta de Google

```bash
node local/servidor.mjs      # http://localhost:8080
```

Levanta el sistema completo en tu máquina con un tablero de ejemplo (el mismo
del Excel actual). Abajo hay un selector para cambiar de persona y comprobar
que cada rol ve exactamente lo que debe ver. Los datos viven en
`local/datos.json`; bórralo para volver a empezar.

Extras: `/rutina-diaria` simula los correos de la cadena de cumplimiento y
`/correos` muestra lo que se habría enviado.

### Instalarlo de verdad en Drive

Instrucciones paso a paso en **[docs/INSTALACION.md](docs/INSTALACION.md)**.
Resumen: crear un Sheet → pegar el código en Apps Script → `instalarSistema()`
→ registrar al equipo en la hoja `Personas` → publicar la web app → repartir
los enlaces. Toma menos de una hora y no requiere pagar nada.

---

## Accesos

El archivo de datos **no se comparte con nadie** salvo Administración. Todos
entran por la web app, que se ejecuta con permisos del dueño.

| Rol | Ve | Puede escribir |
|---|---|---|
| **Responsable** | Solo sus actividades | Estado, comentario, riesgo, pedido de decisión. Y todo lo demás en las actividades que él mismo creó |
| **Administración** | Todo | Todo, incluida la asignación de encargados y los accesos |
| **Gerencia** | Todo (solo lectura) | Registrar decisiones sobre los bloqueos |

Dos formas de identificar a las personas, según lo que tenga la organización:

- **Google Workspace (dominio propio):** la sesión de Google identifica a cada
  quien. No hay que repartir nada.
- **Cuentas Gmail sueltas:** Administración genera un **enlace personal** por
  persona desde la pestaña *Accesos*. En la hoja solo se guarda el hash del
  token, nunca el token. Se puede revocar en un clic.

`CONFIG.MODO_IDENTIDAD = 'AUTO'` intenta lo primero y cae a lo segundo.

---

## Qué se calcula solo

Nadie escribe un porcentaje ni marca "atrasado". Todo esto se deriva:

- **% de avance** — desde el estado (`Por hacer` 0, `En curso` 50, `Finalizado` 100).
  Los pesos se ajustan en `Config.gs`.
- **Vencida / Por vencer** — desde la fecha límite.
- **Sin actualizar** — más de 7 días sin tocarse (ajustable). Este es el
  indicador de "quién no actualiza".
- **Sin fecha límite** — una actividad sin fecha no se puede exigir.
- **Cumplimiento por responsable** — de sus actividades abiertas, cuántas no
  están vencidas ni abandonadas.
- **Antigüedad de cada bloqueo** — cuántos días lleva Gerencia sin responder.

---

## Estructura del repositorio

```
apps-script/          Lo que se despliega en Google
  Config.gs             Todo lo configurable: hojas, columnas, catálogos, umbrales
  Repo.gs               Acceso a datos (única capa que sabe que hay un Sheet)
  Auth.gs               Identidad, roles y permisos por campo
  Actividades.gs        El modelo y las reglas derivadas
  Metrics.gs            Indicadores y tablero de excepciones
  Audit.gs              Bitácora append-only
  Notify.gs             Correos de la cadena de cumplimiento
  Api.gs                Puerta única navegador ↔ datos
  WebApp.gs             doGet / plantillas
  Setup.gs              Instalador idempotente + datos de ejemplo
  ui/                   Interfaz (Index, Styles, App)

local/                Mismo código corriendo en Node, sin Google
  servidor.mjs          Servidor de desarrollo
  gas-shim.mjs          Servicios de Google emulados sobre un JSON

docs/                 Instalación, arquitectura, operación, modelo de datos
```

---

## Escalar sin reescribir

- **Más proyectos** → una fila en la hoja `Catalogos`.
- **Más gente** → una fila en la hoja `Personas`.
- **Más campos** → agregar la columna en `Config.gs` y en `PERMISOS_CAMPO`. El
  código resuelve columnas por nombre de cabecera, nunca por posición: puedes
  reordenar el Sheet sin romper nada.
- **Otro criterio de alerta** → un umbral en `CONFIG.ALERTAS`.
- **Si algún día el Sheet queda chico** (más o menos por encima de 20 000 filas)
  solo hay que reescribir `Repo.gs`. Todo lo demás pide y recibe objetos: no
  sabe que detrás había una hoja de cálculo.
