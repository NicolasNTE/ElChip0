# Bitácora de cambios

Registro en texto plano de qué se modificó en el sistema y por qué. No es el
historial técnico de Git (eso vive en los commits) — es la versión legible
para quien no programa: qué cambió, para qué sirve, qué hay que actualizar
en Apps Script para que tome efecto.

Cada entrada corresponde a uno o más commits en la rama
`claude/multi-vista-info-system-u8slbx`.

---

## 2026-08-17 — Gerencia con los mismos permisos que Administración

Gerencia pasa de "solo mirar y registrar decisiones" a poder hacer
exactamente lo mismo que Administración: crear actividades, asignarlas a
cualquiera, mover fechas, editar cualquier campo, escalar. La única puerta
que sigue siendo exclusiva de Administración es **Accesos** (generar y
revocar enlaces, dar de alta personas).

**Archivos que hay que actualizar en Apps Script:** `Auth.gs`, `Api.gs`,
`ui/App.html`.

---

## 2026-08-17 — Notificaciones por correo en caliente

Antes, para enterarse de algo nuevo había que esperar al resumen de las 7am
o abrir el tablero. Ahora:

- **Se crea una actividad** → correo al encargado y a Gerencia, en el momento.
- **Cambia el Estado de una actividad** → correo a Gerencia, en el momento.

Ningún otro campo (fecha, comentario, riesgo…) dispara correo — si no, cada
edición mandaría uno.

**Archivos que hay que actualizar:** `Api.gs`, `Notify.gs`.

---

## 2026-08-12 — Aviso manual de "el sistema se actualizó"

Nueva opción en el menú de Sheets: **⚙️ Sistema → Avisar actualización a
todo el equipo**. Pide un mensaje corto y lo manda por correo a cada persona
activa del padrón, con un botón para abrir el sistema. Útil para avisar
cuando se sube una versión nueva del código.

**Archivos que hay que actualizar:** `Notify.gs`, `Setup.gs`.

---

## 2026-08-10 — Etiquetas y Gerencia con más vistas

Dos cambios juntos:

1. **Sistema de etiquetas.** Nueva columna "Etiquetas" en la Tabla Madre:
   texto libre separado por coma, que cualquier rol puede escribir para
   agrupar tareas de un mismo proyecto (fases, frentes de trabajo, etc.) y
   después filtrarlas. No es un catálogo cerrado — se escribe la que haga
   falta y queda disponible para filtrar.
2. **Gerencia ve más pestañas.** Antes solo veía la vista Gerencial. Ahora
   también ve "Mis actividades" y "Administración" (en ese momento todavía
   sin poder editar todo — eso se resolvió después, el 17 de agosto). Sigue
   sin acceso a Accesos.

**Archivos que hay que actualizar:** `Config.gs`, `Actividades.gs`,
`Auth.gs`, `Api.gs`, `Setup.gs`, `ui/App.html`, `ui/Index.html`,
`ui/Styles.html`.

---

## 2026-08-04 — Primera versión del sistema

Sistema completo de tres vistas sobre una tabla madre en Google Sheets:
Responsable, Administración y Gerencial. Identidad por sesión de Google o
por enlace personal con token. Bitácora de auditoría, correos diarios
segmentados por rol, entorno de desarrollo local sin necesidad de cuenta de
Google.

Ver `docs/ARQUITECTURA.md` para las decisiones de diseño completas.

---

## Cómo leer esta bitácora

Cada entrada dice **qué archivos tocar** en el editor de Apps Script para
que el cambio tome efecto ahí. El orden de los pasos es siempre el mismo:

1. Copiar el contenido actualizado de cada archivo listado
2. Guardar (`Ctrl+S`)
3. Si la entrada menciona `Config.gs` o `Setup.gs` con cambios de
   estructura, volver a ejecutar `instalarSistema()`
4. Subir nueva versión en **Implementar → Gestionar implementaciones**
