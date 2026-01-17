# RCA: GLM Environment Variable Naming Convention

**Date:** 2026-01-17
**Author:** Claude (Phase 11-01 execution)
**Status:** Design Decision Retrospective

## Issue

During Phase 11 GLM Integration, environment variables were named `GLM_API_KEY` and `GLM_BASE_URL` rather than `ZAI_API_KEY` and `ZAI_API_URL` (provider-focused naming).

## Question

> Why use `GLM_API_KEY` instead of `ZAI_API_KEY`? Should we rename for consistency with common cloud provider conventions?

## Analysis

### Naming Convention Options

| Convention | Example | Pattern | Use Case |
|------------|---------|---------|----------|
| **Provider-focused** | `ZAI_API_KEY`, `AWS_ACCESS_KEY` | `{PROVIDER}_{VAR}` | Cloud services with multiple products |
| **Model-focused** | `GLM_API_KEY`, `OPENAI_API_KEY` | `{MODEL}_{VAR}` | Specific AI model/LLM services |
| **Service-focused** | `ANTHROPIC_API_KEY`, `STRIPE_KEY` | `{SERVICE}_{VAR}` | Named service brands |

### Context Considerations

**1. LLM Industry Convention**
Most LLM providers use model/service names, not provider company names:
- `OPENAI_API_KEY` (not `OAI_API_KEY`)
- `ANTHROPIC_API_KEY` (not `A16Z_API_KEY`)
- `COHERE_API_KEY` (not `COV_API_KEY`)

**2. GLM-4.7 Brand Recognition**
- "GLM" is the recognized model name (like "GPT", "Claude")
- "Z.ai" is the provider, but less known in this context
- Documentation refers to "GLM-4.7" as the primary identifier

**3. Technical Mapping**
Our implementation maps GLM vars to Anthropic-compatible vars:
```typescript
GLM_API_KEY + GLM_BASE_URL → ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL
```

The `GLM_` prefix clearly indicates what's being mapped.

### Arguments for ZAI_API_KEY

| Pro | Explanation |
|-----|-------------|
| Provider consistency | Matches AWS, GOOGLE, AZURE patterns |
| Future-proof | If Z.ai adds GLM-5, GPT-4, etc., one provider key |
| Clear ownership | Identifies the service provider explicitly |

### Arguments for GLM_API_KEY

| Pro | Explanation |
|-----|-------------|
| Industry convention | Matches OPENAI_API_KEY, ANTHROPIC_API_KEY patterns |
| Model clarity | Immediately indicates which LLM is being used |
| Migration clarity | GLM → Claude migration path is explicit |

## Decision

**Chosen: `GLM_API_KEY` / `GLM_BASE_URL`**

### Rationale

1. **LLM Convention Alignment**: Most AI/ML SDKs use model names in env vars, not company names
2. **Immediate Clarity**: Developers see "GLM" and know exactly which model is configured
3. **Documentation Alignment**: All research docs refer to "GLM-4.7 Integration"
4. **SDK Compatibility**: Maps clearly to `ANTHROPIC_API_KEY` for the compatible endpoint

### Trade-off Accepted

**Con:** If Z.ai adds multiple models (GLM-5, GPT-4, Claude), would need separate keys like `GLM5_API_KEY`.

**Mitigation:** This is acceptable because:
- Different LLMs have different API shapes
- Separate keys allow concurrent usage of multiple Z.ai models
- Provider-focused naming could be added later: `ZAI_DEFAULT_MODEL=glm-4.7`

## Recommendation: Keep Current Naming

**No change needed.** `GLM_API_KEY` / `GLM_BASE_URL` is the appropriate convention for LLM integrations.

### If Provider-Focused Naming Is Preferred Later

Future enhancement could support both patterns:

```typescript
// Option 1: Model-focused (current)
GLM_API_KEY=xxx
GLM_BASE_URL=xxx

// Option 2: Provider-focused (future)
ZAI_API_KEY=xxx
ZAI_API_URL=xxx
ZAI_MODEL=glm-4.7  // or glm-5, gpt-4, etc.
```

This would require:
1. Detecting which pattern is present
2. Defaulting model appropriately
3. Documentation migration

### When to Consider Renaming

Rename to `ZAI_*` only if:
- Planning to use multiple Z.ai models beyond GLM
- Z.ai becomes a multi-model platform like OpenAI
- Team strongly prefers provider-focused conventions

## Conclusion

The `GLM_API_KEY` naming follows established LLM conventions (like `OPENAI_API_KEY`) and provides immediate clarity about which model is being used. No action needed unless future requirements evolve.

**Status:** ✅ **ACCEPTED** - Current naming is appropriate for the use case.
