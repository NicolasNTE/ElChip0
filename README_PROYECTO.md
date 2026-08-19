# Sistema de Asistencias y Justificaciones 📊

Solución integral para gestionar asistencias, registros biométricos, justificaciones y reportes de nómina.

## 📋 Descripción

Este sistema soluciona el problema de atrasos en pagos de nómina causados por:
- Extracción manual de registros biométricos vía USB sin almacenamiento
- Falta de histórico de asistencias
- Ausencia de registro de justificaciones
- Necesidad de revisar justificaciones última hora

## 🏗️ Estructura del Proyecto

```
elchip0/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── entities/          # Modelos de base de datos
│   │   ├── database/          # Configuración TypeORM
│   │   ├── modules/           # Módulos funcionales (auth, employees, etc)
│   │   └── common/            # Guards, decoradores, filtros
│   ├── .env                   # Variables de entorno (desarrollo)
│   ├── .env.example           # Template de variables
│   └── package.json
├── frontend/                   # App React (próximos pasos)
├── docker-compose.yml         # PostgreSQL + pgAdmin
└── README_PROYECTO.md         # Este archivo
```

## 🛠️ Tech Stack

- **Backend:** Node.js + NestJS
- **Frontend:** React (próximos pasos)
- **Database:** PostgreSQL
- **Auth:** JWT + bcryptjs
- **Excel:** xlsx (para importar registros biométricos)

## 🚀 Cómo Iniciar

### Requisitos
- Node.js 18+
- npm o yarn
- Docker y Docker Compose (opcional, para PostgreSQL)

### 1. Setup PostgreSQL (Docker)
```bash
docker-compose up -d
```

Esto levanta:
- **PostgreSQL** en localhost:5432
- **pgAdmin** en localhost:5050

### 2. Instalar dependencias backend
```bash
cd backend
npm install
```

### 3. Ejecutar migraciones y servidor
```bash
npm run start:dev
```

La API estará disponible en `http://localhost:3000`

## 📊 Base de Datos

### Tablas principales
- `companies` - 2 empresas
- `employees` - Empleados con horarios distintos
- `users` - Admin para autenticación
- `attendance_records` - Entrada/Salida (importadas de Excel)
- `justifications` - Justificaciones de faltas
- `justification_photos` - Fotos anexadas a justificaciones

## 🔒 Roles y Acceso

- **Admin:** Acceso completo
  - Importar archivos Excel
  - Ver todas las asistencias
  - Registrar justificaciones
  - Generar reportes

- **Empleado:** Acceso limitado (futuro)
  - Ver su propia asistencia
  - Ver estado de sus justificaciones

## 📝 Próximos Pasos (Fases)

- [ ] **Fase 2:** Módulo de Auth (JWT, login)
- [ ] **Fase 3:** Módulo de Asistencias (CRUD, importación Excel)
- [ ] **Fase 4:** Módulo de Justificaciones (fotos, aprobación)
- [ ] **Fase 5:** Módulo de Reportes (nómina, asistencias)
- [ ] **Fase 6:** Frontend React (UI, dashboards)

## 🔐 Configuración

Ver `.env.example` para variables de entorno disponibles.

En desarrollo, usa `.env` con valores locales.

En producción, ajusta:
- `DB_PASSWORD`
- `JWT_SECRET`
- `NODE_ENV=production`
- `DB_HOST` (servidor remoto si aplica)

## 📚 Documentación de API

Una vez implementada, la documentación Swagger estará en `/api/docs`

## ✅ Estado Actual

**Fase 1 completada:**
- ✅ Estructura NestJS creada
- ✅ Entidades y modelos definidos
- ✅ Configuración TypeORM
- ✅ Docker Compose para desarrollo
- ✅ Proyecto compilable

**Próximo:** Implementar módulo de Auth (Fase 2)
