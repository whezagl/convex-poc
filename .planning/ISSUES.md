# Project Issues

> Last updated: 2026-01-17

## Open Enhancements

*None - all issues resolved in Phase 10.*

---

## Closed Enhancements

### ISS-001: Self-hosted Convex backend deployment ✅
**Discovered:** Phase 02-01 (2026-01-16)
**Resolved:** Phase 10-01 (2026-01-16)
**Type:** Infrastructure/Integration
**Effort:** Medium

**Description:**
Self-hosted Convex backend deployment required admin key authentication fix. Backend was returning 401 Unauthorized when deploying via `npx convex deploy`.

**Resolution:**
- Generated new admin key with proper `convex-self-hosted|` prefix using `docker compose exec backend ./generate_admin_key.sh`
- Deployed 6 functions (3 mutations, 3 queries) to self-hosted Convex backend
- Replaced placeholder client with real ConvexClient from `convex/server` package
- Enabled Convex mutations in BaseAgent hooks (SessionStart creates sessions, SessionEnd updates with completion)
- Verified deployment via Convex CLI (`npx convex function-spec`)

**Files Modified:**
- `.env.local` - Admin key configuration
- `src/convex/client.ts` - Real ConvexClient integration
- `src/agents/BaseAgent.ts` - Hooks enabled

---

### ISS-002: SDK response output extraction ✅
**Discovered:** 2026-01-17 (TODO audit)
**Resolved:** Phase 10-01 (2026-01-16)
**Type:** Code Quality/Functionality
**Effort:** Low

**Description:**
The `BaseAgent.execute()` method was returning `messages.join("\n")` as a placeholder. The actual output needed to be extracted from SDK response structure.

**Resolution:**
- Updated `execute()` to store `currentInput` and `currentOutput` in instance variables
- Improved message processing to extract text content from SDK response messages
- Updated SessionEnd hook to use stored `currentOutput` for Convex tracking
- Fixed HookInput type usage (SessionStart uses session_id/source, SessionEnd uses reason)

**Files Modified:**
- `src/agents/BaseAgent.ts` - Input/output tracking, message extraction, hook fixes

---

## Issue Legend

- 🔴 **Active** - Currently being worked on
- 🟡 **New** - Recently added, not yet started
- 🟢 **Ready** - Planned, clear path forward
- 🔵 **Waiting** - Blocked or deferred
- ✅ **Resolved** - Completed and verified
