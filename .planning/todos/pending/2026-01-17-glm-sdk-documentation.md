---
created: 2026-01-17T11:00
title: Document GLM integration with @anthropic-ai/sdk
area: docs
files:
  - docs/GLM-4.7_INTEGRATION_RESEARCH2.md
---

## Problem

The project can use GLM-4.7 via the @anthropic-ai/sdk by configuring custom `apiKey` and `baseURL` options. This integration pattern is not currently documented in the codebase, making it unclear for future developers how to swap the underlying model "brain" while keeping the Claude Code SDK "body".

## Solution

Update code documentation to explain GLM-4.7 integration pattern:

1. Document that @anthropic-ai/sdk supports custom `baseURL` parameter (TypeScript SDK uses camelCase)
2. Show configuration example:
   ```typescript
   import Anthropic from '@anthropic-ai/sdk';
   const client = new Anthropic({
     apiKey: process.env.GLM_API_KEY,
     baseURL: 'https://api.z.ai/api/coding/paas/v4'
   });
   ```
3. Add to existing documentation files (README.md or PATTERNS.md) explaining this "model-agnostic body" pattern
4. Document required environment variables: `GLM_API_KEY` and optionally `GLM_BASE_URL`

Reference: docs/GLM-4.7_INTEGRATION_RESEARCH2.md contains full research on this integration approach.
