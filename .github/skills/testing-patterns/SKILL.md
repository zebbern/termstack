---
name: testing-patterns
description: "Vitest + Playwright testing patterns: unit tests, mocking, fixtures, E2E, coverage, and anti-patterns. Use when writing tests, setting up test infrastructure, or following TDD workflows."
tags:
  - development
  - testing
  - vitest
  - playwright
  - unit-test
  - e2e
  - tdd
triggers:
  - write tests
  - vitest
  - unit testing
  - test patterns
  - testing strategy
  - tdd
---

# Testing Patterns

## WHEN_TO_USE

Reference this skill when:
- Writing unit tests with Vitest
- Writing E2E tests with Playwright
- Setting up test infrastructure (fixtures, factories, mocks)
- Following TDD (red-green-refactor) workflow
- Reviewing test quality or debugging flaky tests
- Configuring coverage thresholds

## UNIT_TESTING

### Structure

Use `describe` for grouping, `it` for individual cases. Keep tests focused on one behavior.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDiscount } from './pricing';

describe('calculateDiscount', () => {
  it('returns 0 for orders below minimum', () => {
    expect(calculateDiscount(49.99)).toBe(0);
  });

  it('applies 10% discount for orders over $50', () => {
    expect(calculateDiscount(100)).toBe(10);
  });

  it('caps discount at maximum allowed', () => {
    expect(calculateDiscount(10_000)).toBe(500);
  });

  it('throws for negative amounts', () => {
    expect(() => calculateDiscount(-1)).toThrow('Amount must be positive');
  });
});
```

### Async Testing

```typescript
import { describe, it, expect } from 'vitest';
import { fetchUser } from './api';

describe('fetchUser', () => {
  it('resolves with user data', async () => {
    const user = await fetchUser('user-123');
    expect(user).toMatchObject({ id: 'user-123', name: expect.any(String) });
  });

  it('rejects for unknown user', async () => {
    await expect(fetchUser('unknown')).rejects.toThrow('User not found');
  });
});
```

### Parameterized Tests

```typescript
import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validation';

describe('isValidEmail', () => {
  it.each([
    { input: 'user@example.com', expected: true },
    { input: 'user+tag@example.com', expected: true },
    { input: 'missing-at.com', expected: false },
    { input: '@no-local.com', expected: false },
    { input: '', expected: false },
  ])('returns $expected for "$input"', ({ input, expected }) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});
```

## MOCKING

### Module Mocking

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendWelcomeEmail } from './onboarding';

// Mock the entire email module
vi.mock('./email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'mock-id' }),
}));

import { sendEmail } from './email';

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends email with correct template', async () => {
    await sendWelcomeEmail('user@test.com', 'Alice');

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@test.com',
      template: 'welcome',
      data: { name: 'Alice' },
    });
  });
});
```

### Spy on Methods

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Logger', () => {
  it('calls console.warn for deprecation notices', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logDeprecation('oldMethod', 'newMethod');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('oldMethod is deprecated'),
    );
    warnSpy.mockRestore();
  });
});
```

### Timer Mocking

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './utils';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays execution by specified ms', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

## FIXTURES

### Test Data Factories

Create reusable factory functions instead of duplicating test data.

```typescript
// test/factories.ts
import { faker } from '@faker-js/faker';
import type { User, Order } from '../src/types';

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'user',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    items: [],
    total: 0,
    status: 'pending',
    ...overrides,
  };
}
```

### Shared Setup

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '../test/factories';
import { UserService } from './user-service';

describe('UserService', () => {
  let service: UserService;
  let testUser: User;

  beforeEach(() => {
    service = new UserService();
    testUser = createUser({ role: 'admin' });
  });

  it('grants admin access', () => {
    expect(service.canAccessAdmin(testUser)).toBe(true);
  });
});
```

## E2E_TESTING

### Page Object Pattern

```typescript
// e2e/pages/login-page.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getError(): Promise<string | null> {
    return this.errorMessage.textContent();
  }
}
```

### E2E Test Structure

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await loginPage.login('user@example.com', 'validpassword');
    await expect(page).toHaveURL('/dashboard');
  });

  test('invalid credentials show error', async () => {
    await loginPage.login('user@example.com', 'wrongpassword');
    const error = await loginPage.getError();
    expect(error).toContain('Invalid credentials');
  });

  test('empty form shows validation errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
  });
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## COVERAGE

### Vitest Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/**/index.ts', // barrel files
        'src/types/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### What to Cover

- **Always cover**: Business logic, utility functions, data transformations, validation rules
- **Cover selectively**: API route handlers (integration-level), component behavior (user interactions)
- **Skip coverage for**: Type definitions, barrel exports, config files, generated code

## ANTI_PATTERNS

### Testing Implementation Details

```typescript
// BAD: Testing internal state
it('sets isLoading to true', () => {
  const { result } = renderHook(() => useAuth());
  act(() => result.current.login('user', 'pass'));
  expect(result.current.isLoading).toBe(true); // fragile
});

// GOOD: Testing observable behavior
it('shows loading indicator during login', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
});
```

### Snapshot Abuse

- Snapshots are acceptable for serializable config objects or small component output
- Never snapshot entire page HTML or large component trees
- If a snapshot updates frequently, replace it with targeted assertions

### Flaky Test Causes

| Cause | Fix |
|-------|-----|
| Timing / race conditions | Use `waitFor`, Playwright auto-waiting, `vi.useFakeTimers()` |
| Shared mutable state | Reset state in `beforeEach`, use factories |
| Network dependency | Mock HTTP calls with `vi.mock` or MSW |
| Random test order | Ensure tests are isolated — no cross-test dependencies |
| Date/time sensitivity | Mock `Date.now()` with `vi.setSystemTime()` |

### Testing Framework Internals

Don't test that Vitest or Playwright work. Test your code's behavior through public APIs.

```typescript
// BAD: Testing that vi.mock works
it('mocks the module', () => {
  expect(vi.isMockFunction(myFn)).toBe(true);
});

// GOOD: Testing behavior that depends on the mock
it('retries on network failure', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
  mockFetch.mockResolvedValueOnce({ ok: true });

  const result = await fetchWithRetry('/api/data');
  expect(result.ok).toBe(true);
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
```
