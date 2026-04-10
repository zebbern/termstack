---
name: error-monitoring
description: "Error monitoring and observability: tool comparison (Sentry, LogRocket, DataDog, New Relic), Sentry setup, structured logging, React error boundaries, alerting, and source maps. Use when setting up error tracking, observability, or debugging production issues."
tags:
  - development
  - error-monitoring
  - sentry
  - observability
  - logging
  - error-boundaries
triggers:
  - error monitoring
  - sentry setup
  - error tracking
  - observability
  - error boundary
---

# Error Monitoring Skill

Reference for setting up production error tracking, structured logging, and observability.

## WHEN_TO_USE

Apply this skill when setting up error tracking in a new project, configuring observability tooling, debugging production issues, implementing structured logging, or reviewing alerting strategy. Use the tools comparison to select the right platform for your needs.

## TOOLS_COMPARISON

| Tool | Best For | Key Features | Pricing Model | Complexity |
|------|----------|-------------|---------------|------------|
| Sentry | Error tracking, crash reporting | Stack traces, breadcrumbs, release tracking, performance monitoring | Free tier (5K errors/mo), then event-based | Low |
| LogRocket | Frontend session replay | Session replay, network inspection, Redux/Vuex logging | Free tier (1K sessions/mo), then session-based | Low |
| Datadog | Full-stack observability | APM, logs, metrics, dashboards, distributed tracing | Per-host + ingestion-based | High |
| New Relic | Full-stack APM | APM, logs, infrastructure, synthetics, AIOps | Free tier (100GB/mo), then data-based | Medium |
| Grafana + Loki | Self-hosted log aggregation | Open source, Prometheus integration, log queries | Free (self-hosted), Cloud has free tier | High |
| Better Stack | Uptime + logging | Uptime monitoring, structured logs, incident management | Free tier, then usage-based | Low |

### Decision Guide

- **Just error tracking for a web app** → Sentry (best DX, fast setup)
- **Need session replay to debug UX issues** → LogRocket or Sentry Session Replay
- **Enterprise full-stack observability** → Datadog or New Relic
- **Budget-conscious, self-hosted** → Grafana + Loki + Prometheus
- **Uptime + logs in one tool** → Better Stack

## SENTRY_SETUP

### Next.js Setup

```bash
npx @sentry/wizard@latest -i nextjs
```

This auto-configures `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `next.config.ts`.

### Manual Client Config

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
});
```

### Manual Server Config

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

### Capturing Errors Manually

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: "checkout", severity: "critical" },
    extra: { userId: user.id, orderId: order.id },
  });
  throw error; // Re-throw after reporting
}
```

### React Setup (non-Next.js)

```typescript
// src/instrument.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [Sentry.browserTracingIntegration()],
});
```

## STRUCTURED_LOGGING

### Log Levels

| Level | When to Use | Example |
|-------|------------|---------|
| `error` | Unexpected failures requiring attention | Failed payment processing, unhandled exceptions |
| `warn` | Degraded behavior, not a failure | Deprecated API usage, slow query, retry attempt |
| `info` | Normal operational events | User login, order placed, deployment started |
| `debug` | Detailed diagnostic info (dev/staging only) | Function inputs/outputs, cache hit/miss |

### Structured JSON Format

```typescript
// Prefer structured logs over string concatenation
// Bad
console.log(`User ${userId} failed to login from ${ip}`);

// Good
logger.warn("login_failed", {
  userId,
  ip,
  reason: "invalid_password",
  attemptCount: 3,
  correlationId: req.headers["x-correlation-id"],
});
```

### Output Format

```json
{
  "level": "warn",
  "message": "login_failed",
  "timestamp": "2026-02-23T14:30:00.000Z",
  "service": "auth-api",
  "correlationId": "abc-123-def",
  "userId": "usr_456",
  "ip": "192.168.1.1",
  "reason": "invalid_password",
  "attemptCount": 3
}
```

### Correlation IDs

- Generate a unique ID per request at the API gateway or first middleware.
- Pass it through all services via `x-correlation-id` header.
- Include it in every log entry and error report.
- Enables tracing a single user action across multiple services.

```typescript
// Middleware example
import { randomUUID } from "crypto";

function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = req.headers["x-correlation-id"] as string ?? randomUUID();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
}
```

### Recommended Libraries

| Library | Runtime | Notes |
|---------|---------|-------|
| pino | Node.js | Fast, structured JSON, low overhead |
| winston | Node.js | Flexible transports, widely adopted |
| structlog | Python | Structured logging for Python |

## ERROR_BOUNDARIES

### React Error Boundary with Reporting

```tsx
"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Placement Strategy

```tsx
// Wrap at route/page level for granular recovery
<ErrorBoundary fallback={<PageErrorFallback />}>
  <DashboardPage />
</ErrorBoundary>

// Wrap at feature level for isolated failures
<ErrorBoundary fallback={<WidgetErrorFallback />}>
  <AnalyticsWidget />
</ErrorBoundary>
```

- [P0-MUST] Place an error boundary at the app root to catch uncaught errors.
- [P1-SHOULD] Place error boundaries around independent feature areas so one failure doesn't bring down the whole page.
- [P1-SHOULD] Always report caught errors to your monitoring tool inside `componentDidCatch`.

## ALERTING

### Severity Levels

| Severity | Response Time | Example | Action |
|----------|--------------|---------|--------|
| P0 — Critical | Immediate (< 15 min) | Auth system down, data loss, payment failures | Page on-call, incident channel |
| P1 — High | Within 1 hour | Elevated error rate, degraded performance | Notify on-call via Slack/PagerDuty |
| P2 — Medium | Within 4 hours | Non-critical feature broken, increased latency | Slack alert, next business day |
| P3 — Low | Next sprint | Cosmetic issue, minor log noise | Ticket in backlog |

### Avoiding Alert Fatigue

- [P0-MUST] Set thresholds, not raw counts. Alert on "error rate > 5% of requests" not "any error occurred."
- [P1-SHOULD] Group related alerts. 100 instances of the same error = 1 alert, not 100.
- [P1-SHOULD] Use alert cooldowns — don't fire the same alert again within 15-30 minutes.
- [P1-SHOULD] Review and prune alerts quarterly. Remove alerts nobody acts on.
- [P2-MAY] Use anomaly detection (Datadog, New Relic) instead of static thresholds for traffic-dependent metrics.

### Recommended Alert Rules

| Metric | Threshold | Severity |
|--------|-----------|----------|
| Error rate (5xx) | > 5% of requests for 5 min | P0 |
| Response time (p95) | > 2s for 10 min | P1 |
| Unhandled exceptions | > 50/min | P1 |
| Failed health check | 3 consecutive failures | P0 |
| Memory usage | > 90% for 5 min | P1 |
| Queue depth | > 10K messages for 10 min | P2 |

## SOURCE_MAPS

### Why Source Maps Matter

Production JavaScript is minified and bundled. Without source maps, stack traces show obfuscated code with no useful file/line info.

### Uploading to Sentry

```bash
# In CI/CD pipeline after build
npx @sentry/cli sourcemaps upload \
  --org your-org \
  --project your-project \
  --release $(git rev-parse HEAD) \
  .next/static
```

### Next.js Configuration

```typescript
// next.config.ts
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // Source maps generated but not served to browser
  productionBrowserSourceMaps: false,
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true, // Remove source maps from production bundle
});
```

### Rules

- [P0-MUST] Generate source maps during build but do NOT serve them to the browser in production.
- [P0-MUST] Upload source maps to your error tracking tool as part of CI/CD.
- [P1-SHOULD] Tag source map uploads with release version or git SHA for accurate mapping.
- [P1-SHOULD] Delete source maps from the deployment artifact after uploading to the monitoring tool.
