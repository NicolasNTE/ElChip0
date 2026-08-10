# Modelo de datos

Cuatro hojas. Una sola es la fuente de verdad; las otras tres la sostienen.

---

## Tabla Madre

Una fila = una actividad. **Nunca** se borran filas: se pasan a estado
`Anulado`, así el historial y los indicadores siguen cuadrando.

| Columna | Quién la llena | Reglas |
|---|---|---|
| `ID` | El sistema | Inmutable. Es lo que enlaza la actividad con su bitácora |
| `Proyecto` | Administración / Responsable | Debe existir en la hoja `Catalogos` |
| `Actividad` | Administración / Responsable | Qué hay que hacer, en una línea. Máx. 500 caracteres |
| `Etiquetas` | Cualquiera con permiso (los tres roles) | Libre, separadas por coma. Agrupa tareas de un mismo proyecto para poder filtrarlas; no es un catálogo cerrado, se escribe según haga falta |
| `Encargado` | Administración | **Nombre** exacto de la hoja `Personas`. Un responsable no puede cambiarlo |
| `Fecha limite` | Administración / Responsable | Sin fecha, la actividad no se puede exigir: el sistema la marca `Sin fecha límite` |
| `Prioridad` | Administración | `Alta` · `Media` · `Baja` |
| `Estado` | Responsable | `Por hacer` · `En curso` · `Finalizado` · `Anulado` |
| `Riesgo/Interferencia` | Responsable | `Si` / `No`. Es el aviso de "esto se va a caer" |
| `Detalle del riesgo` | Responsable | Obligatorio si el riesgo es `Si` |
| `Bloqueo de Gerencia` | Responsable | `Si` / `No`. Reemplaza al "Sr. Jerónimo debe revisar" perdido en un comentario |
| `Decision requerida` | Responsable | Obligatorio si hay bloqueo. **Qué** se decide, no "consultar" |
| `Comentario` | Cualquiera con permiso | Contexto. Al registrar una decisión, el sistema antepone `[fecha · Gerencia] …` |
| `Creado por` / `Creado en` | El sistema | |
| `Actualizado por` / `Actualizado en` | El sistema | De aquí sale el indicador "sin actualizar" |

### Lo que **no** es una columna

Estos datos existen, pero se **calculan** al momento de mostrarlos. Ponerlos en
una columna obligaría a alguien a mantenerlos, y ahí empiezan los tableros que
no cuadran:

`% de avance` · `vencida` · `por vencer` · `sin actualizar` · `sin fecha` ·
`días esperando decisión` · `semáforo` · `cumplimiento por responsable`

---

## Personas — el padrón de accesos

| Columna | Para qué |
|---|---|
| `Email` | Identidad en modo `DOMINIO`. En minúsculas |
| `Nombre` | **Llave con la Tabla Madre.** Debe coincidir con `Encargado` |
| `Rol` | `Responsable` · `Administracion` · `Gerencia` |
| `Activo` | `No` bloquea el acceso sin borrar nada |
| `Token hash` | Lo escribe el sistema. Nunca contiene el token en claro |
| `Proyectos` | Opcional: limita a un rol amplio a ciertos proyectos. Vacío = todos |

> El vínculo entre persona y trabajo es el **nombre**, no el correo. Es lo que
> permite que la Tabla Madre siga siendo legible para un humano. A cambio,
> cambiar el nombre de alguien exige actualizar sus filas — el sistema avisa si
> un `Encargado` no está en el padrón.

---

## Catalogos

| Columna | Para qué |
|---|---|
| `Proyecto` | La lista viva de proyectos |
| `Notas` | Libre |

Agregar un proyecto es agregar una fila. Corre `instalarSistema()` después para
refrescar los desplegables del Sheet.

---

## Bitacora

Append-only. Nadie la edita a mano.

`Fecha` · `Actor` · `Accion` · `Actividad ID` · `Campo` · `Valor anterior` · `Valor nuevo`

Acciones: `ALTA`, `EDICION`, `ESCALAMIENTO`, `ENLACE_GENERADO`, `ENLACE_REVOCADO`.

Responde tres preguntas que hoy se contestan buscando en un chat: quién cambió
qué, cuándo, y desde qué valor.

---

## Migrar el tablero actual

1. Ejecuta `instalarSistema()` sobre la hoja donde ya está tu tablero. Agrega
   las columnas que falten **al final**, sin mover las que ya están.
2. Renombra tus cabeceras para que coincidan con las de arriba — o al revés:
   cambia los nombres en `CONFIG.COLS` para que coincidan con las tuyas. El
   código resuelve columnas por nombre, así que cualquiera de las dos funciona.
3. Vuelve a ejecutar `instalarSistema()`: le pone `ID` a toda fila que tenga
   `Actividad` y no tenga identificador.
4. Revisa que cada `Encargado` exista en `Personas` con la misma escritura.
5. Pasa lo que hoy vive en `Comentario` a su campo propio: si dice "esperando
   que Gerencia apruebe", eso es `Bloqueo de Gerencia = Si` más
   `Decision requerida`. Es el paso que hace que el consolidado sirva.

---

## Límites

Google Sheets aguanta 10 millones de celdas, pero Apps Script se pone lento
mucho antes. Con 16 columnas:

| Filas | Comportamiento |
|---|---|
| < 5 000 | Fluido |
| 5 000 – 20 000 | Aceptable; conviene archivar lo cerrado en otra hoja |
| > 20 000 | Toca cambiar de base |

Ese cambio afecta a **un solo archivo**: `Repo.gs`. Todo lo demás pide y recibe
objetos y no sabe que detrás hay una hoja de cálculo.
