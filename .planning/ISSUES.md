# Project Issues

> Last updated: 2026-01-17

## Open Enhancements

### ISS-001: Self-hosted Convex backend deployment
**Discovered:** Phase 02-01 (2026-01-16)
**Type:** Infrastructure/Integration
**Status:** 🔴 Active - Re-opening from incorrect "resolved" status
**Effort:** Medium

**Description:**
Self-hosted Convex backend deployment requires admin key authentication fix. Backend returns 401 Unauthorized when deploying via `npx convex dev --once` or `npx convex deploy`. Schema is defined and types are generated locally, but tables are not yet created in the backend.

**Current State:**
- Convex schema fully defined (`convex/schema.ts` with agentSessions, workflows tables)
- Helper functions implemented (`convex/functions.ts`)
- Placeholder client in `src/convex/client.ts` with documented API surface
- All code ready for deployment once authentication is fixed

**Error:**
```
BadAdminKey: The provided admin key was invalid for this instance
401 Unauthorized
```

**Attempts to resolve:**
1. Verified CONVEX_SELF_HOSTED_ADMIN_KEY environment variable was set correctly
2. Restarted Docker services to ensure backend picked up the admin key
3. Reset the convex_data Docker volume to start with fresh backend data
4. Tried deployment without admin key (self-hosted mode shouldn't require it)

**Setup Guide Available:**
`/Users/wharsojo/dev/convex-pocx/SELF_HOSTED_SETUP_GUIDE.md` (external reference)

**Required Changes:**
1. Deploy self-hosted Convex backend via Docker Compose (already configured from Phase 01-02)
2. Generate and configure admin key properly
3. Replace placeholder client in `src/convex/client.ts` with actual Convex client
4. Uncomment and enable Convex mutations in `src/agents/BaseAgent.ts` (lines 96-101, 121-125)
5. Deploy schema and functions to backend
6. Verify end-to-end integration

**Related TODOs:**
- `src/agents/BaseAgent.ts:72` - Integrate with actual Convex client
- `src/agents/BaseAgent.ts:96-101` - Uncomment createAgentSession mutation
- `src/agents/BaseAgent.ts:121-125` - Uncomment updateAgentSession mutation

---

### ISS-002: SDK response output extraction
**Discovered:** 2026-01-17 (TODO audit)
**Type:** Code Quality/Functionality
**Status:** 🟡 New
**Effort:** Low

**Description:**
The `BaseAgent.execute()` method returns `messages.join("\n")` as a placeholder. The actual output should be extracted from SDK response structure based on the Claude Agent SDK's message format.

**Location:**
`src/agents/BaseAgent.ts:173`

**Current Implementation:**
```typescript
// TODO: Extract actual output from messages based on SDK response structure
return messages.join("\n");
```

**Required Changes:**
1. Research Claude Agent SDK message structure
2. Extract the actual text response from the message iterator
3. Handle multi-turn conversations if applicable
4. Add proper error handling for malformed responses

---

## Closed Enhancements

*None yet.*

---

## Issue Legend

- 🔴 **Active** - Currently being worked on
- 🟡 **New** - Recently added, not yet started
- 🟢 **Ready** - Planned, clear path forward
- 🔵 **Waiting** - Blocked or deferred
- ✅ **Resolved** - Completed and verified
