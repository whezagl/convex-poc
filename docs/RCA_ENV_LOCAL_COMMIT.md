# RCA: Sensitive Credentials Committed via .env.local

**Date:** 2026-01-17
**Severity:** Security Issue (Medium)
**Status:** Resolved

---

## Issue Summary

Sensitive credentials (Convex admin key and Z.AI API key) were committed to the git repository in a file named `.env.local`, which was not properly excluded from version control.

**Affected Secrets:**
- `CONVEX_SELF_HOSTED_ADMIN_KEY` - Convex backend authentication
- `ZAI_API_KEY` - Z.AI API access (4671e4a1cc...)

---

## 5 Whys Analysis

```mermaid
flowchart TB
    WHY1[Why: Secrets committed in .env.local?]
    WHY2[Why: Created .env.local instead of using .env?]
    WHY3[Why: Assumed .env.local was the standard?]
    WHY4[Why: Didn't check .gitignore or project conventions?]
    WHY5[Why: Failed to follow established project patterns?]
    ROOT[Root Cause]
    ACTIONS[Corrective Actions]

    WHY1 --> WHY2
    WHY2 --> WHY3
    WHY3 --> WHY4
    WHY4 --> WHY5
    WHY5 --> ROOT
    ROOT --> ACTIONS

    style WHY1 fill:#E85D04,stroke:#000,stroke-width:3px,color:#fff
    style WHY2 fill:#DC2F02,stroke:#000,stroke-width:3px,color:#fff
    style WHY3 fill:#DC2F02,stroke:#000,stroke-width:3px,color:#fff
    style WHY4 fill:#DC2F02,stroke:#000,stroke-width:3px,color:#fff
    style WHY5 fill:#DC2F02,stroke:#000,stroke-width:3px,color:#fff
    style ROOT fill:#6A4C93,stroke:#000,stroke-width:3px,color:#fff
    style ACTIONS fill:#2A9D8F,stroke:#000,stroke-width:3px,color:#fff
```

### Why 1: Why were secrets committed in `.env.local`?

**Answer:** The file `.env.local` was created to store sensitive credentials and then committed to git.

---

### Why 2: Why was `.env.local` created instead of using `.env`?

**Answer:** Assumption was made that `.env.local` was the correct file based on common patterns in other projects, without checking the existing project structure.

---

### Why 3: Why was it assumed `.env.local` was the standard?

**Answer:** Following the test file pattern which explicitly loaded `.env.local`:
```typescript
dotenvConfig({ path: ".env.local" });
```
This pattern was copied without verifying it matched project conventions.

---

### Why 4: Why wasn't `.gitignore` or project conventions checked?

**Answer:** The existing `.env` file was already present in the project and properly ignored via `.gitignore`, but this was overlooked during implementation.

**Evidence:**
- `.gitignore` contains: `.env` (correctly ignored)
- `.env` file exists at project root with admin key
- `.env.local` was NOT in `.gitignore` (should have been added if used)

---

### Why 5: Why did the implementation fail to follow established project patterns?

**ROOT CAUSE:** Lack of due diligence in checking existing project configuration before introducing new files and patterns. The assumption that "new test code needs new config file" led to creating `.env.local` without:
1. Checking if `.env` already existed
2. Verifying `.gitignore` rules
3. Understanding project-specific conventions

---

## What Went Wrong (Timeline)

```mermaid
sequenceDiagram
    autonumber
    participant Conv as Conversation
    participant Dev as Developer Action
    participant Git as Git Repository
    participant Ign as .gitignore

    rect rgb(42, 157, 143)
        Note over Conv,Ign: Phase 1: Existing Setup (Correct)
        Ign->>Git: .env is ignored
        Dev->>Git: .env exists with admin key
        Git-->>Dev: Secrets safe (not committed)
    end

    rect rgb(220, 47, 2)
        Note over Conv,Ign: Phase 2: Test Implementation (Mistake)
        Conv->>Dev: "Need ZAI_API_KEY"
        Dev->>Dev: Created .env.local
        Dev->>Dev: Put secrets in .env.local
        Dev->>Git: git add .env.local
        Git-->>Dev: File added (not ignored!)
    end

    rect rgb(220, 47, 2)
        Note over Conv,Ign: Phase 3: Commit (Security Issue)
        Dev->>Git: git commit
        Git-->>Dev: Secrets committed to history
    end

    rect rgb(0, 119, 182)
        Note over Conv,Ign: Phase 4: Discovery
        Conv->>Dev: "Why not use .env?"
        Dev->>Ign: Check .gitignore
        Ign-->>Dev: .env is ignored, .env.local is NOT
    end
```

---

## Corrective Actions

### Immediate Actions (Taken)

| Action | Status |
|--------|--------|
| Move all secrets from `.env.local` to `.env` | ✓ Complete |
| Delete `.env.local` file | ✓ Complete |
| Add `.env.local` to `.gitignore` | ✓ Complete |
| Remove `.env.local` from git history | ✓ Complete |

### Prevention Actions

| Action | Status |
|--------|--------|
| Create `.env.example` template | ✓ Complete |
| Document environment setup in README | Pending |
| Add pre-commit hook for secrets detection | Pending |

---

## Project Environment File Standards

```mermaid
flowchart TB
    subgraph Files["Environment Files"]
        ENV_EXAMPLE[".env.example<br/>✓ Committed<br/>Template with placeholders"]
        ENV[".env<br/>✗ Ignored<br/>Actual secrets (NEVER commit)"]
        ENV_LOCAL[".env.local<br/>✗ Ignored<br/>Local overrides (NEVER commit)"]
    end

    subgraph Git["Git Repository"]
        COMMITTED["Committed Files"]
        IGNORED["Ignored Files (.gitignore)"]
    end

    ENV_EXAMPLE --> COMMITTED
    ENV --> IGNORED
    ENV_LOCAL --> IGNORED

    style ENV_EXAMPLE fill:#2A9D8F,stroke:#000,stroke-width:3px,color:#fff
    style ENV fill:#DC2F02,stroke:#000,stroke-width:3px,color:#fff
    style ENV_LOCAL fill:#DC2F02,stroke:#000,stroke-width:3px,color:#fff
    style COMMITTED fill:#0077B6,stroke:#000,stroke-width:3px,color:#fff
    style IGNORED fill:#6A4C93,stroke:#000,stroke-width:3px,color:#fff
```

### File Purpose

| File | Purpose | Git Status | Contents |
|------|---------|------------|----------|
| `.env.example` | Template for developers | **Committed** | Placeholder values only |
| `.env` | Actual secrets | **Ignored** | Real credentials |
| `.env.local` | Local overrides | **Ignored** | Local development overrides |

---

## Lessons Learned

1. **Always check existing patterns** - Before creating new files, verify what the project already uses
2. **Verify `.gitignore`** - Ensure sensitive files are properly excluded
3. **Don't assume conventions** - Every project may have different standards
4. **Review before committing** - Check `git status` to ensure only intended files are staged

---

## Security Note

**If you have access to the committed secrets, rotate them immediately:**

1. **Convex Admin Key:** Regenerate with:
   ```bash
   docker compose exec backend ./generate_admin_key.sh
   ```

2. **Z.AI API Key:** Revoke and create new key at:
   ```
   https://platform.z.ai/
   ```

---

## Related Files

- `.gitignore` - Updated to include `.env.local`
- `.env.example` - Created as template
- `.env` - Contains actual secrets (not committed)

---

**RCA Approved By:** Claude (AI Assistant)
**Review Date:** 2026-01-17
