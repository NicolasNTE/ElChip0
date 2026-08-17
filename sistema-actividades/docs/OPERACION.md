# Operación

Un sistema de información no funciona porque esté bien construido, sino porque
la gente lo usa de una forma acordada. Esto es ese acuerdo.

---

## La regla única

> **El dato se ingresa una vez, donde ocurre, por quien lo sabe.**

De ahí salen las tres reglas prácticas:

1. Si cambió el estado de tu actividad, lo cambias **tú**, en el sistema.
2. Si algo se va a caer, lo marcas como **riesgo** — no lo cuentas en un chat.
3. Si necesitas que Gerencia decida, marcas **bloqueo** y escribes **qué** se
   decide — no "consultar con gerencia".

Todo lo que se reporta por WhatsApp es un dato que el sistema no tiene, y por
lo tanto un dato que no aparece en el consolidado.

---

## Rutina del Responsable — 2 minutos al día

Abre tu enlace. Tu lista ya viene ordenada: lo que arde primero.

1. **Mueve los estados** de lo que avanzó. Es un desplegable en la misma fila.
2. Si algo se trabó por causa ajena → *Abrir* → `Riesgo/Interferencia = Si` y
   explica cuál es. Aparecerá en el tablero de Administración ese mismo día.
3. Si algo depende de una definición de Gerencia → `Bloqueo de Gerencia = Si` y
   escribe la decisión que hace falta. Entra a la cola gerencial con contador de
   días.
4. Si te surge trabajo nuevo, **agrégalo tú mismo**. Queda a tu nombre.

Lo que no debes hacer: pedirle a Administración que actualice tu estado. Ese
mensaje cuesta más que el desplegable.

### Qué significan las señales

| Señal | Qué te está diciendo |
|---|---|
| **Vencida** | Pasó la fecha límite y sigue abierta |
| **Por vencer** | Vence en 3 días o menos |
| **Riesgo/Interferencia** | Tú marcaste que algo la puede tumbar |
| **Espera Gerencia** | Está detenida por una decisión pendiente |
| **Sin actualizar** | Más de 7 días sin que nadie la toque. **Esta es la que hay que evitar** |
| **Sin fecha límite** | Sin fecha nadie te la puede exigir — y tampoco cuenta como compromiso |

---

## Rutina de Administración — 15 minutos al día

Abre la pestaña **Administración**. El bloque de *Excepciones* es tu agenda del
día, en este orden:

### 1. Vencidas
Cada una necesita una de tres cosas: fecha nueva, ayuda, o `Anulado`. Lo que no
puede es seguir ahí una semana más.

### 2. Esperando a Gerencia
Revisa que la `Decision requerida` esté escrita y sea entendible sin contexto.
Si dice "consultar", devuélvela: Gerencia no puede decidir sobre eso. Si lleva
más de 5 días, empújala directo.

### 3. En riesgo
Es un aviso anticipado, no un reporte de daño. Aquí es donde Administración
agrega valor: conseguir el dato, el permiso o la persona que destraba.

### 4. Sin actualizar
Este es el indicador de disciplina, no de trabajo. Una actividad de 7 días sin
tocar significa que alguien dejó de usar el sistema — y si eso se extiende, el
consolidado deja de valer. Usa el botón **Escalar** en *Cumplimiento por
responsable*: envía a esa persona su lista con un mensaje tuyo, y queda
registrado en la bitácora.

### 5. Sin fecha límite
Una actividad sin fecha no es un compromiso. Ponle fecha o acepta que es una
idea, no una tarea.

### Semanal

- Revisa **Cumplimiento por responsable**. Los porcentajes bajos consistentes
  son una conversación, no un correo automático.
- Cierra lo que ya no aplica con `Anulado` en vez de borrarlo.
- Revisa que cada proyecto activo tenga actividades vivas. Un proyecto sin
  actividades abiertas o terminó, o nadie lo está registrando.

---

## Rutina de Gerencia — 5 minutos, dos veces por semana

Abre la pestaña **Gerencial**.

1. **Esperando decisión de Gerencia** — es lo único que requiere tu acción.
   Está ordenado por antigüedad; lo rojo lleva más de 5 días. Pulsa *Registrar
   decisión*, escríbela, y el bloqueo se levanta solo. Tu respuesta queda en la
   actividad con fecha y autor: quien la lea dentro de tres meses va a saber qué
   se decidió y cuándo.
2. **Avance por proyecto** — ordenado de menor a mayor avance. El primero de la
   lista es el que necesita tu atención.
3. **Cumplimiento por responsable** — para la conversación de equipo, no para
   perseguir gente. Un 0% casi siempre significa que esa persona no está usando
   el sistema, no que no esté trabajando.

Gerencia también puede entrar a **Administración** y operarla igual que
Administración: crear actividades, reasignarlas, mover fechas, escalar. La
única pestaña fuera de su alcance es **Accesos**. Que se pueda no significa
que convenga hacerlo seguido — si dos personas reasignan sin avisarse, el
tablero deja de ser confiable. En la práctica, que Gerencia edite directamente
es la excepción (una urgencia, alguien de licencia), no la rutina.

---

## Los correos automáticos

Cada mañana a las 7:00:

| Quién recibe | Qué recibe |
|---|---|
| Cada responsable | Solo sus pendientes críticos. Si no tiene ninguno, no recibe nada |
| Administración | El tablero de excepciones completo |
| Gerencia | La cola de decisiones pendientes |

Si nadie los abre, no es un problema de los correos: es que el sistema todavía
no es el lugar donde vive el trabajo. Se corrige con las rutinas de arriba, no
con más correos.

### Además, en caliente (no esperan a las 7:00)

| Cuándo | Quién recibe |
|---|---|
| Se crea una actividad | El encargado (queda a cargo de algo nuevo) y Gerencia |
| Cambia el `Estado` de una actividad | Gerencia |

Solo el `Estado` dispara este aviso instantáneo; el resto de cambios (fecha,
comentario, riesgo…) se ven en el resumen diario o al abrir la vista
Administración — de lo contrario cada edición mandaría un correo.

Con un equipo pequeño esto no pesa, pero si el volumen de actividades crece
mucho vale la pena revisar la cuota diaria de `MailApp` (100 correos/día en
una cuenta Gmail suelta, 1 500/día en Google Workspace).

---

## Poner el sistema en marcha

Los sistemas de información no fallan por técnica; fallan porque conviven con el
método anterior hasta que el anterior gana.

**Semana 1 — cargar.** Administración vacía el Excel actual en la Tabla Madre y
completa lo que faltaba: encargado, fecha límite, y sobre todo pasar los
"esperando que X apruebe" del comentario a `Bloqueo de Gerencia`.

**Semana 2 — en paralelo.** El equipo usa el sistema; el Excel sigue como red de
seguridad pero **ya no se actualiza**. Administración revisa a diario y ayuda a
quien no entra.

**Semana 3 — corte.** El Excel se archiva en solo lectura. La regla se hace
explícita:

> *Si no está en el sistema, no existe. Un pendiente reportado por WhatsApp no
> cuenta como reportado.*

Sostener esa frase durante dos semanas es todo el trabajo de implementación.

**Semana 4 — medir.** Ya hay historia suficiente para que "sin actualizar" y
"cumplimiento" signifiquen algo. Esa es la primera reunión donde el consolidado
manda y nadie prepara un reporte para tenerla.

---

## Mantenimiento

| Cada cuánto | Qué |
|---|---|
| Mensual | Revisar `Personas`: quien salió va a `Activo = No` y se le revoca el enlace |
| Trimestral | Archivar en otra hoja lo finalizado con más de 6 meses, si la Tabla Madre pasa de ~5 000 filas |
| Cuando cambie el código | `clasp push` y publicar **versión nueva** de la web app |
| Ante cualquier duda de "quién cambió esto" | Hoja `Bitacora`, o el historial dentro de cada actividad |
