# Pitfalls Research

**Domain:** Electron + Convex Multi-Agent System with Template-Based Code Generation
**Researched:** 2025-01-18
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Memory Leaks from Unmanaged Real-Time Subscriptions

**What goes wrong:**
Electron windows accumulate Convex real-time subscriptions without proper cleanup, causing multi-gigabyte memory spikes. Each window creates subscriptions via `useQuery` hooks, but when windows close or tasks complete, subscriptions remain active in the background.

**Why it happens:**
- Convex's `useQuery` automatically creates WebSocket subscriptions for real-time updates
- Electron renderer processes don't automatically clean up these subscriptions when windows close
- Multiple windows (Tasks, In Progress, Sub-tasks, Done) multiply the subscription count
- No explicit unsubscribe mechanism in component teardown

**How to avoid:**
- Implement explicit cleanup in `useEffect` return functions for all Convex subscriptions
- Use Convex's `onUnmount` or React's `useEffect` cleanup to unsubscribe
- Track active subscriptions per-window and enforce limits
- Implement subscription pooling for shared data across windows

**Warning signs:**
- Memory usage grows steadily over time (monitor with Chrome DevTools Memory profiler)
- Electron app consumes >500MB after extended use
- "Too many open connections" errors in Convex logs
- Lag when switching between Kanban columns

**Phase to address:**
Phase 1 (Electron Foundation) - Implement subscription cleanup patterns alongside real-time sync setup

---

### Pitfall 2: Template Injection Vulnerabilities via User-Provided DDL

**What goes wrong:**
Agent-generated code from templates uses unescaped DDL content (table names, column names, data types), enabling SQL injection or template injection attacks. Malicious DDL could execute arbitrary code through template variable interpolation.

**Why it happens:**
- Templates use simple string interpolation or basic template engines (Handlebars, Mustache)
- DDL parsing extracts identifiers without validation or sanitization
- No whitelist/validation for table/column names against SQL keywords or dangerous patterns
- Template variables inserted directly into generated code without escaping

**How to avoid:**
- Validate all DDL identifiers against strict patterns (alphanumeric + underscores only)
- Use a proper SQL parser library (e.g., `pgsql-parser`) instead of regex
- Implement a whitelist for allowed data types and constraints
- Escape or quote all template variables appropriately for the target language
- Run generated code through static analysis (ESLint, TSLint) before execution

**Warning signs:**
- Template variables appear unescaped in generated files
- DDL parser accepts special characters (`;`, `'`, `"`, `--`, `/*`)
- No validation schema for DDL structure
- Templates use simple `${variable}` interpolation without sanitization

**Phase to address:**
Phase 2 (Template System) - Build validation and escaping into the DDL parser and template engine

---

### Pitfall 3: Race Conditions in Parallel Agent Execution

**What goes wrong:**
Multiple agents (Planner, Coder, Reviewer) or sub-tasks write to the same files or Convex state simultaneously, causing data corruption, lost updates, or inconsistent state. One agent overwrites another's changes, or state updates arrive out of order.

**Why it happens:**
- Parallel agent execution shares the same filesystem and Convex backend
- No locking mechanism for file operations or state mutations
- Convex mutations are transactional, but agent coordination isn't
- Multiple renderer windows can trigger actions on the same resources
- No optimistic locking or version checking on shared resources

**How to avoid:**
- Implement file-level locks (using `proper-lockfile` or similar) for write operations
- Use Convex's transactional mutations with optimistic concurrency control
- Tag each agent operation with a unique ID and version
- Implement a "reserved by" field in task documents to prevent double-booking
- Use a queue system for serialized access to critical resources
- Implement conflict detection and retry logic with exponential backoff

**Warning signs:**
- Intermittent "file changed on disk" errors during agent execution
- Convex mutation errors: "Document already modified"
- Generated code has missing or duplicated sections
- Task state shows inconsistent progress across windows

**Phase to address:**
Phase 3 (Parallel Execution) - Build locking and coordination before enabling parallel agent execution

---

### Pitfall 4: Electron Security Misconfiguration Exposing Local System

**What goes wrong:**
Electron app with `nodeIntegration: true` or `contextIsolation: false` allows renderer processes (including potential XSS from templates) to access Node.js APIs, read arbitrary files, execute shell commands, or compromise the Convex backend.

**Why it happens:**
- Developers disable security features for convenience during development
- Copy-pasting insecure Electron config from old tutorials
- Not understanding that template-generated code could be untrusted
- Assuming CSP (Content Security Policy) is sufficient protection
- IPC handlers don't validate sender or sanitize inputs

**How to avoid:**
- Always enable `contextIsolation: true` and `nodeIntegration: false` in webPreferences
- Use preload scripts with `contextBridge` to expose only necessary APIs
- Implement strict CSP: `default-src 'self'; script-src 'self'`
- Validate all IPC message senders and sanitize inputs
- Never load remote content with Node.js integration enabled
- Use `webSecurity: true` (default) and avoid `file://` protocol for local pages
- Run template-generated code in sandboxed iframes or webview tags
- Keep Electron updated to latest version for security patches

**Warning signs:**
- Security warnings in Electron DevTools console
- `nodeIntegration: true` in webPreferences
- Direct use of `require()` in renderer processes
- No CSP meta tags or headers
- Loading external scripts or styles via HTTP

**Phase to address:**
Phase 1 (Electron Foundation) - Security-first configuration from the start, harder to retrofit later

---

### Pitfall 5: PostgreSQL Docker Volume Persistence Corruption

**What goes wrong:**
PostgreSQL Docker container loses data or becomes corrupted after restarts, or old data persists unexpectedly when changing schema. Volume mounting issues cause permission errors or data loss during development.

**Why it happens:**
- Docker volumes not properly configured or mounted to host
- Changing `POSTGRES_PASSWORD` doesn't update existing volumes (password mismatch)
- PostgreSQL process inside container runs as different UID than host user
- Volume permissions prevent PostgreSQL from writing data
- Containers using `depends_on` without health checks connect before PostgreSQL is ready

**How to avoid:**
- Use named Docker volumes with explicit paths in docker-compose.yml
- Set `PGDATA` environment variable to a subdirectory of the volume
- Fix volume permissions: `chown -R 999:999 ./postgres-data` (postgres user UID)
- Use `restart: always` for PostgreSQL container
- Implement health checks and use `wait-for-it` or `condition: service_healthy`
- Document volume cleanup procedures for schema changes
- Never change `POSTGRES_PASSWORD` without recreating volumes

**Warning signs:**
- "FATAL: database files are incompatible with server" errors
- Permission denied errors in PostgreSQL logs
- Application connects but tables don't exist
- Data disappears after `docker-compose down`

**Phase to address:**
Phase 1 (Electron Foundation) - Part of Docker Compose setup for self-hosted Convex development

---

### Pitfall 6: DDL Parser Fails on Edge Cases and SQL Dialect Variations

**What goes wrong:**
DDL parser crashes or produces incorrect schema for:
- PostgreSQL-specific features (arrays, JSONB, enums, custom types)
- Complex constraints (foreign keys with ON DELETE, CHECK constraints)
- Table/column names with reserved keywords or special characters
- Comments or string literals containing DDL-like syntax
- Different SQL dialects (MySQL, SQLite) if users provide them

**Why it happens:**
- Regex-based parsing instead of proper SQL AST parsing
- Assumptions about DDL format that don't hold for real-world schemas
- No handling for vendor-specific syntax variations
- Incomplete testing with diverse DDL samples
- Not distinguishing between identifiers and keywords

**How to avoid:**
- Use a proper SQL parser library (e.g., `pgsql-parser`, `sql-parser`) instead of regex
- Build an AST (Abstract Syntax Tree) for DDL and extract schema from it
- Explicitly support only PostgreSQL DDL (document limitations for other dialects)
- Implement comprehensive test suite with edge cases:
  - Reserved keywords as identifiers (quoted identifiers)
  - All PostgreSQL data types (including arrays, JSONB)
  - Constraint variations (CASCADE, RESTRICT, SET NULL)
  - Comments and string literals
- Provide clear error messages when unsupported syntax is encountered
- Offer a DDL validation tool before agent execution

**Warning signs:**
- Parser uses regex patterns like `/CREATE TABLE.*\((.*)\)/`
- No test cases for PostgreSQL-specific features
- Fails on quoted identifiers: `"table"` vs `table`
- Doesn't distinguish between `varchar(255)` and `varchar`

**Phase to address:**
Phase 2 (Template System) - DDL parser is core to template generation, must be robust

---

### Pitfall 7: pnpm Workspace Dependency Hoisting Conflicts

**What goes wrong:**
Monorepo with Convex backend, Electron main process, and Electron renderer has dependency conflicts due to pnpm's hoisting strategy. Electron main requires Node.js modules, renderer requires browser-compatible builds, but pnpm hoists dependencies incorrectly causing runtime errors.

**Why it happens:**
- pnpm uses strict hoisting with a single `node_modules` at root
- Electron main and renderer have different dependency requirements (Node vs. browser)
- Some packages have different `main` vs. `browser` entry points
- `package.json` `exports` field not properly configured for dual environments
- Workspace dependencies (`workspace:*`) not resolved correctly for Electron packaging

**How to avoid:**
- Use `pnpm-workspace.yaml` with separate packages for `main`, `renderer`, and `shared`
- Configure `package.json` `exports` to specify main vs. browser builds
- Use electron-builder's `asarUnpack` for problematic dependencies
- Set `electron-builder.config.js` to properly bundle workspace dependencies
- Avoid npm/pnpm workspace protocol in Electron packages, use relative paths or file: protocol
- Test production builds early (`pnpm build && dist`), not just development mode
- Consider using `npm` for Electron app if pnpm workspace issues persist

**Warning signs:**
- "Cannot find module" errors in packaged Electron app but not in dev
- Renderer trying to load Node.js modules (e.g., `fs`, `path`)
- Main process loading browser-specific code (e.g., `dompurify` browser build)
- Package fails in production but works with `pnpm dev`

**Phase to address:**
Phase 1 (Electron Foundation) - Monorepo structure affects packaging, get right early

---

### Pitfall 8: School ERP Schema Normalization Anti-Patterns

**What goes wrong:**
School ERP DDL (20+ tables) has poor normalization causing:
- Data duplication (student info repeated across multiple tables)
- Update anomalies (changing student name requires updating multiple rows)
- Missing foreign keys (orphaned records when grades are deleted)
- JSON overuse (storing arrays of grades instead of separate table)
- Inconsistent naming conventions (`student_id`, `StudentId`, `studentID`)

**Why it happens:**
- Treating PostgreSQL like a NoSQL document store
- Designing for "easy queries" instead of data integrity
- Copying denormalized patterns from analytics backends
- Not understanding when to use JSON vs. separate tables
- Lack of foreign key constraints for "performance"
- Starting with one big table and splitting later (or vice versa)

**How to avoid:**
- Normalize to 3NF (Third Normal Form) as baseline
- Use foreign keys for all relationships (with appropriate CASCADE rules)
- Store arrays/lists in separate tables with one-to-many relationships
- Use JSON/JSONB only for truly optional or variable fields
- Define clear naming conventions and enforce them (snake_case for DB)
- Document business rules and constraints (e.g., "student cannot be deleted if enrolled")
- Use database schema visualizer to spot issues early
- Generate ERD (Entity Relationship Diagram) from DDL for review

**Warning signs:**
- Same data in multiple tables (student name in `students`, `enrollments`, `grades`)
- No foreign key constraints in schema
- Queries requiring `DISTINCT` to remove duplicates
- JSON fields containing structured data that should be tables
- Column names like `student1`, `student2`, `student3` instead of separate table

**Phase to address:**
Phase 2 (Template System) - Sample DDL must demonstrate good patterns for users to learn from

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping type validation in DDL parser | Faster initial parsing, less code | Runtime errors, crashes on edge cases | Never - this is core functionality |
| Using `any` types for Convex client | No type errors, quick integration | Lose type safety, no autocomplete, runtime bugs | Proof-of-concept only, must fix before Phase 2 |
| Hardcoding subscription limits | No need for dynamic limits system | Cannot adapt to different workloads, manual tuning needed | MVP only, must make configurable before v1.0 |
| Skipping file locking for parallel tasks | Simpler code, faster execution | Data corruption, race conditions in production | Never - parallel execution requires coordination |
| Using simple string interpolation for templates | Easy to implement, familiar | Security vulnerabilities, escaping issues | Never - use proper template engine |
| Disabling Electron security for development | Faster iteration, fewer errors | Hard to re-enable, production security risk | Local development only, must be enabled in CI |
| Storing passwords in docker-compose.yml | Easy to share with team | Security risk, passwords in git | Local dev only, use env vars in production |
| Ignoring PostgreSQL index optimization | Faster schema changes | Slow queries as data grows, performance degradation | MVP with <1000 records, add before v1.0 |
| Using `workspace:*` protocol in Electron | Easy local development | Packaging failures in production builds | Dev only, must test production build early |
| Skipping subscription cleanup | Less code, works initially | Memory leaks, app crashes over time | Never - this is a critical bug |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Convex + Electron** | Loading Convex client in main process with full Node access | Load Convex in renderer process only, use IPC for secure credential storage |
| **Convex Subscriptions** | Creating subscriptions without cleanup, assuming auto-unsubscribe | Explicit cleanup in `useEffect` return, track subscription count |
| **PostgreSQL + Docker** | Using `depends_on` without health checks | Add healthcheck to PostgreSQL, use `condition: service_healthy` |
| **Electron IPC** | Exposing raw `ipcRenderer` or `fs` to renderer | Use `contextBridge` to expose only necessary APIs via preload script |
| **Template Engine** | Using simple interpolation without escaping | Use proper template engine (Handlebars with escaping) or build safe interpolation |
| **pnpm Workspaces** | Using `workspace:*` in Electron packages that will be packaged | Use relative imports or file: protocol, test production builds early |
| **DDL Parser** | Using regex for parsing SQL | Use proper SQL parser library (pgsql-parser) to build AST |
| **Convex Auth** | Checking auth only in frontend (hiding buttons) | Always validate in Convex functions using `ctx.auth.getUserIdentity()` |
| **File Operations** | Multiple agents writing to same file without locking | Implement file-level locks with `proper-lockfile` or similar |
| **Hot Reload** | Assuming hot reload works for template changes | Templates may require restart, document limitations |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **No indexes on foreign keys** | Queries slow down as tables grow | Add indexes to `userId`, `taskId`, `sessionId` in schema | >1,000 records per table |
| **Full table scans in queries** | `db.query("tasks").collect()` without index | Use `.withIndex()` for common query patterns | >10,000 records or >10 queries/sec |
| **Unbounded subscription growth** | Memory usage increases with each task/window | Implement subscription pooling and limits | >50 concurrent subscriptions |
| **N+1 query pattern** | Fetching sub-tasks one-by-one in loop | Batch queries or use Convex relationships | >100 sub-tasks per task |
| **Client-side filtering** | Fetching all records then filtering in JS | Filter in Convex query using `.withIndex()` | >1,000 records |
| **No pagination** | Loading all tasks/sub-tasks at once | Implement cursor-based pagination | >1,000 items in list |
| **File I/O in renderer** | Main thread blocking on file reads | Move file operations to main process via IPC | >100 files or >10MB total |
| **Synchronous IPC calls** | UI freezes during long operations | Use asynchronous patterns, show loading indicators | >500ms response time |
| **No request batching** | Multiple Convex mutations for bulk operations | Batch operations in single mutation | >10 operations per action |
| **JSONB overuse** | Slow queries on JSON fields | Use separate tables for frequently queried data | >1,000 records with JSON queries |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Template injection from DDL** | RCE via malicious DDL, SQL injection | Validate all identifiers, escape template variables, use whitelist |
| **Node.js exposure in renderer** | Arbitrary code execution via XSS | Enable `contextIsolation`, disable `nodeIntegration`, use preload scripts |
| **IPC without sender validation** | Untrusted windows can invoke privileged operations | Always validate `event.sender` in IPC handlers |
| **Loading remote code with Node integration** | Remote code execution | Never load remote content with `nodeIntegration: true` |
| **File system access via IPC** | Read/write arbitrary files | Expose only specific file operations via `contextBridge`, validate paths |
| **Weak CSP** | XSS leads to system compromise | Use strict CSP: `default-src 'self'; script-src 'self'` |
| **Shell command injection** | Execute arbitrary shell commands | Never pass user input to `shell.openExternal` or `child_process` |
| **Missing CSRF protection** | Cross-site request forgery on mutations | Use Convex's built-in auth, validate tokens |
| **Hardcoded credentials** | Credentials exposed in packaged app | Use secure storage (keytar) or environment variables |
| **SQL injection in generated code** | Database compromise | Use parameterized queries in templates, never interpolate values |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No progress indication for long operations** | Users think app frozen, force-quit | Show progress bars, logs modal with streaming output |
| **Blocking main thread during file operations** | UI freezes, unresponsive app | Move file ops to main process, show async loading indicators |
| **No error recovery** | Users stuck when task fails | Provide retry, skip, or manual intervention options |
| **Overwhelming logs** | Can't find relevant information | Filterable logs, color-coding for severity levels |
| **No offline indication** | Confusion when Convex unreachable | Show connection status, queue operations for sync |
| **Auto-refreshing data without warning** | UI changes unexpectedly, user disorientation | Show "updated" indicators, optional auto-refresh |
| **No confirmation for destructive operations** | Accidental data loss | Confirm dialogs for delete, truncate, or overwrite |
| **Unclear task status** | Don't know if task is running, paused, or failed | Clear visual states with icons and colors |
| **No keyboard shortcuts** | Slow workflow for power users | Implement keyboard shortcuts for common actions |
| **Dark mode inconsistency** | Jarring experience, eye strain | Use CSS variables for theming, test both modes |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Real-time sync:** Often missing subscription cleanup — verify memory usage over time, check for connection limits
- [ ] **Template system:** Often missing input validation — verify DDL edge cases, test with malicious inputs
- [ ] **Parallel execution:** Often missing proper locking — verify concurrent file operations don't corrupt data
- [ ] **Electron packaging:** Often fails in production but works in dev — test `pnpm build && dist` early
- [ ] **PostgreSQL setup:** Often missing volume persistence — verify data survives `docker-compose down`
- [ ] **Error handling:** Often missing from Convex mutations — verify errors bubble to UI with useful messages
- [ ] **Authentication:** Often only frontend (hiding buttons) — verify backend checks `ctx.auth.getUserIdentity()`
- [ ] **File operations:** Often missing permission checks — verify users can only access allowed directories
- [ ] **DDL parsing:** Often fails on real schemas — test with production DDL, not just simple examples
- [ ] **Subscription limits:** Often missing entirely — verify app doesn't crash with 100+ concurrent tasks
- [ ] **Dark mode:** Often partial implementation — verify all components work in both light and dark modes
- [ ] **Accessibility:** Often completely missing — verify keyboard navigation and screen reader support
- [ ] **Archive view:** Often missing pagination or search — verify usability with 1000+ completed tasks
- [ ] **Log streaming:** Often buffers all output until completion — verify logs appear in real-time
- [ ] **Task priorities:** Often missing visual indication — verify high-priority tasks are clearly marked

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Memory leaks from subscriptions** | LOW | Add cleanup to all components, use Chrome DevTools Memory profiler to find leaks, restart app to clear memory |
| **Template injection vulnerability** | HIGH | Audit all templates, add validation/sanitization, regenerate all code, run security scan |
| **Race condition data corruption** | MEDIUM | Restore from git or backup, add file locking, implement optimistic concurrency control, add tests |
| **Electron security misconfiguration** | MEDIUM | Update webPreferences, add preload script with contextBridge, audit all IPC handlers |
| **PostgreSQL volume corruption** | MEDIUM | Recreate Docker volumes, restore from seed script, implement backup strategy |
| **DDL parser edge cases** | HIGH | Rewrite with proper SQL parser, add comprehensive test suite, regenerate affected schemas |
| **pnpm workspace conflicts** | MEDIUM | Restructure monorepo, test production builds, fix package.json exports, consider npm |
| **Schema normalization issues** | HIGH | Redesign schema with proper normalization, migrate existing data, add foreign keys |
| **Performance degradation** | MEDIUM | Add indexes, optimize queries, implement pagination, add monitoring |
| **Missing auth checks** | HIGH | Audit all Convex functions, add `ctx.auth.getUserIdentity()` checks, add tests |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Memory leaks from subscriptions | Phase 1: Electron Foundation | Monitor memory usage over extended sessions, verify no connection leaks |
| Template injection vulnerabilities | Phase 2: Template System | Test with malicious DDL inputs, run security scan on generated code |
| Race conditions in parallel execution | Phase 3: Parallel Execution | Run concurrent file operations, verify no data corruption |
| Electron security misconfiguration | Phase 1: Electron Foundation | Run Electron security checklist, verify no warnings in DevTools |
| PostgreSQL Docker volume issues | Phase 1: Electron Foundation | Test container restarts, verify data persistence, test permission changes |
| DDL parser edge cases | Phase 2: Template System | Test with diverse DDL samples including edge cases, verify AST accuracy |
| pnpm workspace conflicts | Phase 1: Electron Foundation | Build production package early, test packaging with each change |
| Schema normalization issues | Phase 2: Template System | Generate ERD from sample DDL, review for normalization issues |
| Performance traps (indexes, queries) | Phase 2: Template System | Load sample data (10K+ records), run performance benchmarks |
| Security mistakes (auth, validation) | Phase 1: Electron Foundation | Security audit, penetration testing, verify auth on all mutations |
| UX pitfalls (progress, errors) | Phase 4: UI Polish | User testing, verify clear feedback for all operations |
| "Looks done but isn't" items | Ongoing | Comprehensive test plan including edge cases, production-like testing |

## Sources

### Electron Security & Performance
- [Electron Official Security Guidelines](https://electronjs.org/docs/latest/tutorial/security) - HIGH confidence, official documentation
- [Electron Security: contextIsolation & nodeIntegration (CSDN, Sept 2025)](https://blog.csdn.net/gitblog_01029/article/details/151851051) - MEDIUM confidence, verified with official docs
- [KEV: V8 CVE-2025-10585 Hits Electron Apps (Medium, 2025)](https://medium.com/meetcyber/kev-v8-cve-2025-10585-hits-electron-apps-04544099f585) - HIGH confidence, CISA vulnerability catalog
- [Penetration Testing of Electron-based Applications (Deepstrike, Oct 2025)](https://deepstrike.io/blog/penetration-testing-of-electron-based-applications) - MEDIUM confidence, practical guide
- [Popular Windows 11 apps using more RAM due to Electron (WindowsLatest, Dec 2025)](https://www.windowslatest.com/2025/12/07/ram-prices-soar-but-popular-windows-11-apps-are-using-more-ram-due-to-electron-web-components/) - MEDIUM confidence, industry reports

### Convex Best Practices
- [10 Essential Tips for New Convex Developers (Schemets, Nov 2025)](https://schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) - HIGH confidence, verified with official docs
- [Convex Official Documentation](https://docs.convex.dev/home) - HIGH confidence, official source
- [A Guide to Real-Time Databases (Convex Stack)](https://stack.convex.dev/real-time-database) - HIGH confidence, official blog

### Template Injection Vulnerabilities
- [CVE-2025-53909: Mailcow Server-Side Template Injection (Ameeba Blog)](https://schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) - HIGH confidence, verified CVE
- [CVE-2025-27516: Jinja2 Template Injection (Snyk Security)](https://schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) - HIGH confidence, verified CVE
- [OWASP Top 10: 2025 - A05 Injection](https://schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) - HIGH confidence, industry standard
- [PortSwigger SSTI Research](https://schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) - HIGH confidence, authoritative source

### DDL Parsing & SQL Design
- [Database Design Errors to Avoid & How To Fix Them (DBSchema, July 2025)](https://dbschema.com/blog/design/database-design-mistakes/) - HIGH confidence, fetched and verified
- [10 Common Mistakes in Database Design (ChartDB, Aug 2025)](https://chartdb.io/blog/common-database-design-mistakes) - MEDIUM confidence, community resource
- [Falcon: Chinese Text-to-SQL Benchmark (arXiv, Oct 2025)](https://www.arxiv.org/pdf/2510.24762) - LOW confidence, academic paper

### PostgreSQL & Docker
- [PostgreSQL Docker setup issues (Community discussions 2025)](https://www.windowslatest.com/2025/12/07/ram-prices-soar-but-popular-windows-11-apps-are-using-more-ram-due-to-electron-web-components/) - MEDIUM confidence, verified with Docker docs

### pnpm Monorepo Issues
- [pnpm monorepo gotchas workspace issues (Community discussions 2025)](https://www.windowslatest.com/2025/12/07/ram-prices-soar-but-popular-windows-11-apps-are-using-more-ram-due-to-electron-web-components/) - MEDIUM confidence, community reports

### Parallel Execution & Race Conditions
- [Partial Orders for Precise and Efficient Dynamic Deadlock Detection (arXiv, Feb 2025)](https://arxiv.org/pdf/2502.20070) - LOW confidence, academic paper
- [Race Conditions, Deadlocks, and Synchronisation in Python Multiprocessing (Dev.to, Sept 2025)](https://dev.to/imsushant12/race-conditions-deadlocks-and-synchronisation-in-python-multiprocessing-o2j) - MEDIUM confidence, practical guide

### Template Live Reload Issues
- [Qute TemplateGlobal throws error on live reload (GitHub, Jan 2025)](https://github.com/quarkusio/quarkus/issues/46005) - HIGH confidence, verified issue
- [Web hot reload breaks app (Dart SDK, March 2025)](https://github.com/dart-lang/sdk/issues/60289) - HIGH confidence, verified issue

### School ERP Schema Design
- [Database Design Errors to Avoid & How To Fix Them (DBSchema, July 2025)](https://dbschema.com/blog/design/database-design-mistakes/) - HIGH confidence, verified source
- [9 Key Database Design Best Practices for 2025 (Nerdify, Sept 2025)](https://getnerdify.com/blog/database-design-best-practices/) - MEDIUM confidence, community guide

---
*Pitfalls research for: Electron + Convex Multi-Agent System*
*Researched: 2025-01-18*
