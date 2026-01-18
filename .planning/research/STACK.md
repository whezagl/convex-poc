# Technology Stack

**Project:** AI Agents POC v1.0 - Electron Kanban UI
**Researched:** 2026-01-18
**Overall confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Electron | ^33.0.0 | Desktop application framework | Industry standard for cross-platform desktop apps; mature ecosystem; excellent TypeScript support |
| React | ^19.0.0 | UI framework for Kanban board | Largest ecosystem; best tooling; component reusability for complex UI; superior TypeScript integration |
| TypeScript | ^5.9.0 | Type safety and developer experience | Catches bugs at compile time; excellent IDE support; industry standard for complex apps |
| Vite | ^6.0.0 | Build tool for renderer process | Faster dev server than Webpack; modern ESM-first approach; Electron Forge officially supports |
| Electron Forge | ^7.6.0 | Electron tooling and packaging | Official build tool; excellent TypeScript + Vite template; handles packaging/code signing |

### Backend & Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Convex | ^1.31.4 | Real-time backend for agent state | Already integrated; provides real-time sync; self-hosted via Docker; perfect for agent orchestration state |
| PostgreSQL | ^17.0 | School ERP database storage | Most advanced open-source RDBMS; excellent JSON support; ACID compliance; perfect for complex school data |
| pg (node-postgres) | ^8.13.0 | PostgreSQL driver for Node.js | Official PostgreSQL client; supports async/await; connection pooling; battle-tested |

### Mono-Repo Setup

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pnpm | ^9.15.0 | Package manager with workspace support | Fastest package manager; efficient disk usage; strict dependency management; native monorepo support |
| pnpm-workspace.yaml | - | Workspace configuration | Simple, declarative config; automatic linking; shared dependencies |

### UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | ^2.0.0 | Kanban board UI components | Modern, accessible components; fully customizable; excellent TypeScript support; copy-paste, not install |
| Tailwind CSS | ^4.0.0 | Utility-first CSS framework | Perfect for custom UIs; small bundle size; excellent dark mode support; rapid development |
| @dnd-kit | ^7.0.0 | Drag-and-drop for Kanban | Modern drag-and-drop library; excellent accessibility; performant; TypeScript-first |

### Code Generation Templates

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Handlebars | ^4.7.8 | Template engine for code generation | Simple syntax; logicless templates; excellent for code generation; wide adoption; TypeScript support |
| fs-extra | ^11.2.0 | Enhanced file system operations | Promise-based API; better error handling; atomic operations for safe code generation |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker Compose | ^2.32.0 | Multi-container orchestration | Already in use; simple YAML config; perfect for local dev; easy PostgreSQL + Convex setup |
| PostgreSQL Docker | postgres:17-alpine | PostgreSQL in container | Official image; small footprint (alpine); persistent volumes; easy configuration |

## Mono-Repo Structure

### Workspace Configuration

**`.pnpm-workspace.yaml`:**
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Directory Structure:**
```
convex-poc/
├── apps/
│   ├── electron-ui/          # Electron + React Kanban board
│   └── cli/                  # Existing CLI tool
├── packages/
│   ├── shared/               # Shared TypeScript types
│   ├── templates/            # Code generation templates
│   └── convex-client/        # Convex client utilities
├── .templates/               # User-customizable code templates
├── docker-compose.yml        # Convex + PostgreSQL
├── pnpm-workspace.yaml
└── package.json
```

**Package.json Workspace Dependencies:**
```json
{
  "name": "convex-poc",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter './apps/**' dev",
    "build": "pnpm --filter './apps/**' build",
    "electron": "pnpm --filter electron-ui dev",
    "cli": "pnpm --filter cli dev"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "prettier": "^3.8.0"
  }
}
```

## Installation

### Root Dependencies
```bash
# Core Electron + React setup
pnpm add -D -w electron@^33.0.0
pnpm add -D -w @electron-forge/cli@^7.6.0
pnpm add -D -w @electron-forge/plugin-vite@^7.6.0
pnpm add -D -w vite@^6.0.0
pnpm add -D -w typescript@^5.9.0

# UI dependencies (installed in apps/electron-ui)
pnpm add react@^19.0.0 react-dom@^19.0.0
pnpm add -D @types/react@^19.0.0 @types/react-dom@^19.0.0
pnpm add -D tailwindcss@^4.0.0 autoprefixer@^10.4.0 postcss@^8.4.0

# Kanban UI components
pnpm add @dnd-kit/core@^7.0.0 @dnd-kit/sortable@^9.0.0 @dnd-kit/utilities@^3.2.0

# Convex (already installed)
pnpm add convex@^1.31.4

# Database
pnpm add pg@^8.13.0
```

### Electron App Setup
```bash
# Create Electron app with Vite + TypeScript
pnpm create electron-app@latest apps/electron-ui -- --template=vite-typescript

# Add React to Vite
cd apps/electron-ui
pnpm add react react-dom
pnpm add -D @vitejs/plugin-react
```

### Docker Services
```bash
# PostgreSQL service added to existing docker-compose.yml
# See Docker Compose configuration below
```

## Docker Compose Configuration

**`docker-compose.yml` (updated):**
```yaml
services:
  convex-backend:
    image: ghcr.io/get-convex/convex-backend:latest
    ports:
      - "3210:3210"  # CONVEX_CLOUD_ORIGIN (backend API)
      - "3211:3211"  # CONVEX_SITE_ORIGIN (http action endpoints)
    environment:
      - CONVEX_CLOUD_ORIGIN=http://localhost:3210
      - CONVEX_SITE_ORIGIN=http://localhost:3211
      - CONVEX_SELF_HOSTED_ADMIN_KEY=${CONVEX_SELF_HOSTED_ADMIN_KEY}
    volumes:
      - convex_data:/convex/data
    restart: unless-stopped

  convex-dashboard:
    image: ghcr.io/get-convex/convex-dashboard:latest
    ports:
      - "6791:6791"
    environment:
      - NEXT_PUBLIC_DEPLOYMENT_URL=http://localhost:3210
    depends_on:
      - convex-backend
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    container_name: convex-poc-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=convex_user
      - POSTGRES_PASSWORD=convex_password
      - POSTGRES_DB=school_erp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres-init:/docker-entrypoint-initdb.d  # Init scripts
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U convex_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  convex_data:
  postgres_data:
```

**Database Initialization (`.docker/postgres-init/01-init.sql`):**
```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema (DDL generated by agents)
-- This will be populated by npm run seed
```

## Electron + React + Vite Setup

**`apps/electron-ui/vite.config.ts`:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { builtinModules } from 'module';

export default defineConfig({
  plugins: [react()],
  root: './src',
  build: {
    outDir: '../out',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': './src'
    }
  },
  // Node.js polyfills for Electron renderer
  optimizeDeps: {
    exclude: ['electron']
  }
});
```

**`apps/electron-ui/package.json` scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "package": "electron-forge package",
    "make": "electron-forge make"
  }
}
```

## Convex Integration

**`apps/electron-ui/src/convex/client.ts`:**
```typescript
import { ConvexClient } from 'convex/browser';

// Convex client for Electron renderer process
export const convex = new ConvexClient({
  address: 'http://localhost:3210',  // CONVEX_CLOUD_ORIGIN
});

// Real-time subscriptions for Kanban board
export const subscribeToTasks = () => {
  return convex.onQuery(
    'tasks:list',
    {},
    (tasks) => {
      // Update Kanban board state
      console.log('Tasks updated:', tasks);
    }
  );
};
```

## PostgreSQL Integration

**`packages/shared/db/client.ts`:**
```typescript
import { Pool, PoolConfig } from 'pg';

// PostgreSQL connection pool
const poolConfig: PoolConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'school_erp',
  user: process.env.PGUSER || 'convex_user',
  password: process.env.PGPASSWORD || 'convex_password',
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Query helper with automatic connection release
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Initialize database connection
export async function initDB() {
  await pool.query('SELECT NOW()'); // Test connection
  console.log('PostgreSQL connected successfully');
}
```

## Template System Setup

**`.templates/handlebars/helpers.ts`:**
```typescript
import Handlebars from 'handlebars';

// Custom helpers for code generation
Handlebars.registerHelper('camelCase', (str: string) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
});

Handlebars.registerHelper('pascalCase', (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

Handlebars.registerHelper('json', (obj: any) => {
  return JSON.stringify(obj, null, 2);
});

export default Handlebars;
```

**`packages/shared/templates/engine.ts`:**
```typescript
import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';

interface TemplateContext {
  tableName: string;
  columns: Column[];
  // ... other context
}

export async function generateFromTemplate(
  templatePath: string,
  outputPath: string,
  context: TemplateContext
): Promise<void> {
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
  const generated = template(context);

  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, generated, 'utf-8');
}

// Example: Generate API route from template
export async function generateAPIRoute(
  tableName: string,
  columns: Column[]
): Promise<void> {
  await generateFromTemplate(
    '.templates/api-route.hbs',
    `apps/api/src/routes/${tableName}.ts`,
    { tableName, columns }
  );
}
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **UI Framework** | React | Vue | Slightly simpler for small apps, but React's ecosystem is larger; better TypeScript tooling; more component libraries for Kanban boards |
| **Build Tool** | Vite | Webpack | Webpack is slower; more complex configuration; Vite is faster and simpler |
| **Electron Tool** | Electron Forge | Electron Builder | Forge has official Vite template; better TypeScript support; simpler setup |
| **UI Library** | shadcn/ui | Material-UI | MUI is heavier; more opinionated; harder to customize for custom Kanban layout |
| **Drag-and-Drop** | @dnd-kit | react-beautiful-dnd | react-beautiful-dnd is deprecated; less maintained; @dnd-kit is modern and active |
| **Template Engine** | Handlebars | EJS | EJS allows logic in templates (anti-pattern for code gen); Handlebars forces separation of concerns; simpler syntax |
| **Package Manager** | pnpm | npm/yarn | Slower; less efficient disk usage; pnpm's strict dependency management prevents phantom bugs |
| **PostgreSQL Version** | PostgreSQL 17 | PostgreSQL 16 | PostgreSQL 17 is latest stable; better performance; improved JSON support; current LTS |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Webpack** | Slower builds; complex configuration; harder to debug | Vite (faster, simpler, modern) |
| **react-beautiful-dnd** | Deprecated; last update 2021; not maintained | @dnd-kit (actively maintained, modern) |
| **Material-UI (MUI)** | Heavy bundle size; opinionated design system; harder to customize for custom layouts | shadcn/ui + Tailwind (lightweight, fully customizable) |
| **EJS templates** | Allows JavaScript logic in templates (anti-pattern); harder to maintain; less type-safe | Handlebars (logicless, cleaner separation) |
| **npm or yarn** | Slower; less efficient; phantom dependencies | pnpm (faster, strict dependencies) |
| **PostgreSQL < 16** | Older versions have less features; worse JSON performance; missing optimizations | PostgreSQL 17 (latest stable, best performance) |
| **Class-based React components** | Legacy pattern; hooks are standard; harder to test | Functional components with hooks (modern, simpler) |
| **Electron remote module** | Deprecated; security risk; removed in Electron 14+ | IPC (ipcRenderer/ipcMain) with preload scripts (secure, current) |
| **SQLite for School ERP** | Limited concurrency; no JSON support; scaling issues | PostgreSQL (production-ready, excellent for complex relational data) |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Electron 33 | Node.js 20+ | Electron 33 requires Node.js 20.10.0 or higher |
| React 19 | TypeScript 5.0+ | React 19 has improved TypeScript types |
| Vite 6 | Electron 33+ | Vite 6 works with latest Electron Forge |
| Tailwind 4 | Vite 6+ | Tailwind 4 has new engine, requires Vite 6 |
| @dnd-kit 7 | React 18+ | Compatible with React 19 |
| pg 8.13 | PostgreSQL 10+ | Supports PostgreSQL 17 features |
| Convex 1.31.4 | Node.js 18+ | Current Convex SDK requires Node.js 18 or higher |

## School ERP Domain - Common Modules

Based on Indonesian education standards, typical School ERP includes these modules:

### Core Tables (20+)

**Student Management:**
- `students` - Student records (nama, nisn, tanggal_lahir, alamat)
- `student_guardians` - Parent/guardian information
- `student_enrollments` - Class enrollment history

**Academic:**
- `classes` - Class/grade levels (Kelas 1-12)
- `subjects` - Subjects (Matematika, Bahasa Indonesia, etc.)
- `teachers` - Teacher records
- `schedules` - Class schedules
- `attendance` - Daily attendance tracking
- `grades` - Student grades/scores
- `exams` - Exam schedules and results

**Administrative:**
- `academic_years` - Academic year periods
- `semesters` - Semester data
- `departments` - School departments/streams

**Financial:**
- `fees` - Tuition and other fees
- `fee_payments` - Payment records
- `scholarships` - Scholarship information

**Facilities:**
- `classrooms` - Physical classroom data
- `facilities` - School facilities (laboratories, library, etc.)

**Communication:**
- `announcements` - School announcements
- `messages` - Internal messaging system

### Indonesian-Specific Fields

**Student Table Example:**
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nisn VARCHAR(20) UNIQUE NOT NULL,  -- Nomor Induk Siswa Nasional
  nama VARCHAR(255) NOT NULL,
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  jenis_kelamin VARCHAR(10),  -- L/P
  agama VARCHAR(50),
  alamat TEXT,
  nama_ayah VARCHAR(255),
  nama_ibu VARCHAR(255),
  no_hp VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Stack Patterns by Variant

**If building simple CRUD app (no complex workflows):**
- Use shadcn/ui components directly
- Skip custom drag-and-drop library
- Because: Simpler, faster to build, fewer dependencies

**If building complex Kanban with custom workflows:**
- Use @dnd-kit for drag-and-drop
- Build custom board component
- Because: Full control over behavior, better performance for complex interactions

**If self-hosting Convex (current setup):**
- Use Docker Compose with official Convex images
- Configure CONVEX_CLOUD_ORIGIN and CONVEX_SITE_ORIGIN
- Because: Already proven in v0.3; consistent dev environment; no external dependencies

**If needing production-ready School ERP:**
- Use PostgreSQL 17 with proper indexing
- Implement Row Level Security (RLS) for multi-tenant
- Add proper audit logging
- Because: Production requires data security, auditability, proper access control

**If generating code from DDL:**
- Use Handlebars templates in `.templates/` directory
- Separate templates by type (api, fe, ui)
- Use TypeScript types from schema introspection
- Because: Clean separation; user-customizable; type-safe generation

## Sources

- [Electron Forge - React with TypeScript](https://www.electronforge.io/guides/framework-integration/react-with-typescript) - Official Electron Forge guide (HIGH confidence)
- [Electron Forge - Vite + TypeScript](https://www.electronforge.io/templates/vite-+-typescript) - Official Vite template (HIGH confidence)
- [Vite + React + TypeScript + Electron App Build](https://python.plainenglish.io/clean-battle-tested-vite-react-typescript-electron-app-build-3e6d4815bd4b) - Modern setup guide (June 2025, MEDIUM confidence)
- [Electron IPC Documentation](https://electronjs.org/docs/latest/tutorial/ipc) - Official IPC patterns (HIGH confidence)
- [Convex TypeScript Client](https://www.convex.dev/typescript/references-resources/installation-setup/typescript-npm) - Official Convex docs (HIGH confidence)
- [node-postgres Documentation](https://node-postgres.com/) - Official pg driver docs (HIGH confidence)
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces) - Official pnpm workspace guide (HIGH confidence)
- [Self-Hosting with Convex](https://stack.convex.dev/self-hosted-develop-and-deploy) - Official self-hosting guide (HIGH confidence)
- [How to Self-Host Convex with Docker Compose](https://www.bitdoze.com/convex-self-host/) - Docker Compose setup (MEDIUM confidence)
- [PostgreSQL in Docker: Setup Guide](https://utho.com/blog/postgresql-docker-setup/) - PostgreSQL Docker setup (November 2025, MEDIUM confidence)
- [Build a Kanban Board With Drag-and-Drop in React](https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html) - Latest Kanban tutorial (January 2026, HIGH confidence)
- [Shadcn Kanban Component](https://www.shadcn.io/components/data/kanban) - Official shadcn Kanban (July 2025, HIGH confidence)
- [react-kanban-kit GitHub](https://github.com/braiekhazem/react-kanban-kit) - Open source Kanban library (August 2025, MEDIUM confidence)
- [Handlebars Documentation](https://handlebarsjs.com/guide/) - Official Handlebars docs (HIGH confidence)
- [Clay Code Generator](https://github.com/morkeleb/clay) - Template-based codegen reference (MEDIUM confidence)
- [School ERP Database Design](https://www.databasesample.com/database/high-school-database) - School database schema reference (MEDIUM confidence)
- [How to Build a School Management System](https://dev.to/code_2/how-to-build-a-school-management-system-a-complete-guide-with-code-snippets-1ln6) - Complete MERN stack guide (June 2025, MEDIUM confidence)
- [Database Design for School Management](https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-school-management-software) - Schema design tutorial (MEDIUM confidence)

---
*Stack research for: AI Agents POC v1.0 - Electron Kanban UI with Convex backend*
*Researched: 2026-01-18*
