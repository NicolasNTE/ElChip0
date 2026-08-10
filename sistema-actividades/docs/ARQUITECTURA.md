# Arquitectura

Por qué el sistema está hecho así y no de otra forma.

---

## La decisión de fondo

Un Google Sheet compartido **no puede** dar acceso por fila. O ves el archivo
completo o no lo ves. Cualquier intento de arreglarlo dentro del Sheet
—pestañas con `FILTER()`, hojas protegidas, archivos espejo con `IMPORTRANGE`—
termina en lo mismo: alguien copiando datos de un lado a otro, que es
exactamente lo que hay que eliminar.

Por eso el sistema separa dos cosas que en el Excel de hoy están pegadas:

- **El Sheet es la base de datos.** Solo Administración lo abre.
- **La web app es la interfaz.** Todos entran por ahí.

La web app se publica con *«Ejecutar como: yo»*. Cuando Mafer abre el sistema,
el código corre con los permisos del dueño, lee la Tabla Madre completa, se
queda **solo con las filas donde ella es la encargada**, y le manda eso al
navegador. Las demás filas no están ocultas en la pantalla: nunca salieron del
servidor.

Eso convierte lo que era una limitación en la propiedad más importante del
sistema: **para participar no hace falta tener el archivo.**

---

## Las capas

```
ui/Index · ui/Styles · ui/App     Interfaz. No decide permisos: los recibe.
             │  google.script.run
        ┌────▼─────┐
        │  Api.gs  │              Puerta única. Identifica, despacha, responde.
        └────┬─────┘
   ┌─────────┼──────────┬────────────┐
   │         │          │            │
┌──▼───┐ ┌───▼──────┐ ┌─▼───────┐ ┌──▼─────┐
│Auth  │ │Actividad.│ │Metrics  │ │Audit   │
│quién │ │reglas    │ │indicad. │ │bitácora│
└──┬───┘ └───┬──────┘ └─┬───────┘ └──┬─────┘
   └─────────┴──────┬───┴────────────┘
              ┌─────▼─────┐
              │  Repo.gs  │        Lo único que sabe que hay un Sheet.
              └─────┬─────┘
              ┌─────▼─────┐
              │  Google   │
              │  Sheet    │
              └───────────┘
```

Reglas que sostienen esto:

1. **Solo `Repo.gs` habla con el Sheet.** El resto pide y recibe objetos.
   Migrar a otra base es reescribir un archivo.
2. **Solo `Api.gs` habla con el navegador**, y siempre después de pasar por
   `Auth.gs`. No hay un segundo camino hacia los datos.
3. **Las columnas se resuelven por nombre**, nunca por índice. Puedes reordenar
   el Sheet a mano sin romper nada.
4. **La interfaz no decide permisos.** Cada fila viaja con la lista de campos
   que ese usuario puede tocar (`editables`), calculada en el servidor. Si el
   navegador manda algo fuera de esa lista, el servidor lo rechaza igual.

---

## Permisos: por rol y por fila

No basta con "este rol puede editar". La pregunta es *qué campo*, *en qué fila*.

```
¿Puede VER esta fila?          Auth.puedeVer()
   Responsable → solo si Encargado = él
   Admin/Gerencia → todo (o su alcance de proyectos)

¿Qué campos puede ESCRIBIR?    Auth.camposEditables()
   Responsable → Estado, Comentario, Etiquetas, Riesgo, Detalle, Bloqueo, Decisión
                 + Actividad, Fecha, Prioridad, Proyecto
                   si él mismo creó la actividad
   Administración → todo
   Gerencia → Bloqueo, Decisión, Comentario, Etiquetas
```

`Etiquetas` es la excepción a "cada rol ve/edita solo lo suyo": es libre para
los tres roles a propósito. No es un dato del negocio como el Estado o el
Bloqueo — es una forma de que cada quien agrupe tareas de un mismo proyecto
para filtrarlas y darles seguimiento, sin abrir una hoja aparte.

El detalle de las actividades propias importa: un responsable puede organizar
el trabajo que él mismo se pone, pero **no puede mover la fecha de lo que le
asignaron**. Esa distinción es la que hace que el tablero siga significando
algo.

Y en ningún caso un responsable puede cambiar el `Encargado`: nadie se saca
trabajo de encima solo.

---

## Concurrencia

Escribir en un Sheet desde varias personas a la vez corrompe datos si no se
controla. Toda escritura pasa por `conBloqueo()`:

```js
conBloqueo(function () {
  invalidarCache(...);           // relee: si alguien más escribió, trabajamos
  const vigente = actividadPorId(id);   // sobre lo último, no sobre lo que
  ...                                   // el navegador tenía en pantalla
  actualizarFila(...);
});
```

Además, `actualizarFila()` escribe **celda por celda**, solo las que cambiaron.
Nunca reescribe la fila completa, así que no pisa columnas que alguien haya
agregado a mano en el Sheet.

---

## Lo derivado no se guarda

`% de avance`, `vencida`, `sin actualizar`, `días esperando` y el semáforo se
calculan cada vez que se piden, en `Actividades.gs` y `Metrics.gs`.

Guardarlos sería más rápido y sería un error: un campo calculado que se
almacena es un campo que en algún momento queda desfasado, y entonces vuelve a
aparecer la persona que "actualiza el tablero". No hay hoja de indicadores que
alguien tenga que refrescar.

---

## Identidad sin presupuesto

Dos mecanismos, según lo que tenga la organización:

**Modo `DOMINIO`** — `Session.getActiveUser().getEmail()` devuelve el correo si
quien entra pertenece al mismo dominio de Workspace. Cero fricción.

**Modo `TOKEN`** — para cuentas Gmail sueltas, donde lo anterior devuelve vacío.
Administración genera un UUID por persona; se guarda `SHA-256(token + sal)`, la
sal vive en las propiedades del script, y la comparación es en tiempo constante
para no filtrar información por el tiempo de respuesta. El token viaja en la URL
del enlace personal.

Honestamente: un token en una URL es más débil que una sesión de Google. Es la
mejor opción disponible sin presupuesto y sin dominio propio, y se compensa con
lo que sí se puede hacer — revocar en un clic, alcance limitado a lo que ese rol
ve, y todo movimiento registrado en la bitácora. Si la organización adopta
Workspace, se cambia una línea en `Config.gs` y los enlaces dejan de usarse.

---

## La cadena de cumplimiento

El sistema implementa dos eslabones de forma automática:

**Eslabón 2 — detectar.** `Metrics.tableroDeExcepciones()` clasifica todo lo
abierto en seis canastas: vencidas, por vencer, en riesgo, esperando a Gerencia,
sin actualizar, sin fecha límite. No es un número: es una lista de trabajo.

**Eslabón 4 — escalar.** `Notify.rutinaDiaria()` corre cada mañana y reparte
solo lo que le toca a cada quien. Administración puede además escalar a una
persona concreta desde la Vista Administración, y ese empujón queda en la
bitácora.

El correo no es el sistema: es el empujón. El dato sigue viviendo en un solo
lugar, y cada correo enlaza de vuelta ahí.

---

## Desarrollo local

`local/gas-shim.mjs` emula los servicios de Google (`SpreadsheetApp`,
`Session`, `Utilities`, `LockService`, `MailApp`, `PropertiesService`,
`ScriptApp`) sobre un JSON. `local/servidor.mjs` carga **los mismos archivos
`.gs`** en un contexto de Node y los sirve.

Esto no es una maqueta: es el código real corriendo. Sirve para desarrollar sin
desplegar, para revisar los permisos cambiando de persona en el selector, y para
mostrarle el sistema a alguien sin darle acceso a nada.

---

## Lo que este diseño no hace

Vale la pena decirlo explícitamente:

- **No hay edición colaborativa en vivo.** Si dos personas abren la misma
  actividad, gana quien guarde último. El bloqueo evita la corrupción, no el
  desacuerdo. Con este volumen de trabajo, no es un problema real.
- **No hay archivos adjuntos.** Si una actividad necesita un plano, va el enlace
  de Drive en el comentario.
- **No hay dependencias entre actividades** ("esta empieza cuando termine
  aquella"). Se puede agregar, pero es exactamente el tipo de campo que la gente
  deja de mantener. Hoy eso se expresa en el comentario.
- **La web app es más lenta que abrir el Sheet.** Cada carga son 2–4 segundos.
  A cambio, nadie tiene el archivo.
