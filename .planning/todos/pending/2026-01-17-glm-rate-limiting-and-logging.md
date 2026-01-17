---
created: 2026-01-17T09:11
title: Add GLM API logging and handle 429 rate limiting
area: general
files:
  - src/agents/GLMBaseAgent.ts
  - examples/real-example.ts
---

## Problem

When running examples, GLM API calls fail with error:
```
GLM Error: 429 Insufficient balance or no resource package. Please recharge.
```

This indicates rate limiting (429) - requests are being made too quickly. The Z.AI API docs (https://docs.z.ai/api-reference/api-code) should provide guidance on proper rate limit handling.

Currently:
1. No visibility into API request timing/logs
2. No retry logic for 429 responses
3. No rate limiting/throttling between requests

## Solution

Research Z.AI API documentation for:
1. Rate limit specifications (requests per second/minute)
2. Recommended retry strategies for 429 errors
3. Response headers indicating rate limit status

Implement:
1. Optional verbose logging mode to track API calls (timestamp, request, response)
2. Rate limiting/throttling between GLM requests (exponential backoff or delay)
3. Retry logic with backoff for 429 responses
4. Consider using a rate limiter library (e.g., `bottleneck`, `p-limit`) or manual delay
