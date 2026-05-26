---
name: vitest-feature-testing
description: "Write comprehensive Vitest test suites for Discord bot features. Use for testing utility functions, slash commands, handlers, and interactions. Covers setup/teardown, mocking, time-based testing, edge cases, and independent scenario tracking."
argument-hint: 'Describe the feature to test (e.g., "warn command", "permission checker")'
user-invocable: true
---

# Vitest Feature Testing for Discord Bot

## When to Use

- Testing utility functions (`utils/` folder): cooldowns, permissions, logger, warnings
- Testing slash command handlers (`slash/` folder): ban, kick, warn, timeout, etc.
- Testing loaders and registries (`loader/` folder)
- Need to verify state tracking, timing, edge cases, and isolation

## Key Principles

1. **Descriptive test names**: Clearly state what is being tested and expected result
2. **Arrange-Act-Assert (AAA)**: Organize each test into setup, action, and verification
3. **Setup/Teardown**: Use `beforeEach`/`afterEach` for common initialization and cleanup
4. **Isolation**: Each test should be independent; no shared state between tests
5. **Edge cases first**: Test boundaries, empty inputs, and error conditions
6. **Mock strategically**: Only mock external dependencies (Discord.js, fs, etc.)

## Procedure

### 1. Plan Your Test Suite

Create a `describe` block for the feature being tested. List the scenarios:

- Normal/happy path
- Edge cases (empty, null, undefined, out of range)
- Error conditions
- State isolation tests (if tracking multiple items)
- Boundary conditions (max values, timeouts)

### 2. Set Up Test File Structure

```
src/__tests__/
├── feature-name.test.ts
└── [other test files]
```

Create with this template (see [template](./references/test-template.ts)):

- Import testing utilities: `vitest`, `expect`, `vi`
- Import the feature being tested
- Define `describe` block
- Add `beforeEach` for setup (fakes, mocks, initial state)
- Add `afterEach` for cleanup (restore real implementations)

### 3. Write Test Cases

For each scenario, follow this pattern:

```typescript
it("should [expected behavior] when [condition]", () => {
  // Arrange: set up test data
  const input = ...;

  // Act: call the function
  const result = feature(input);

  // Assert: verify the result
  expect(result).toBe(...);
});
```

Key expectations to verify:

- Return value types and values
- Side effects (state changes, calls to mocks)
- Error handling and thrown exceptions
- Isolation between independent uses

### 4. Use Mocking for External Dependencies

For Discord.js interactions or system calls:

- Mock functions with `vi.fn()` and check with `toHaveBeenCalledWith()`
- Mock modules with `vi.mock()` for imports
- Use `vi.useFakeTimers()` / `vi.useRealTimers()` for time-based testing
- Advance time with `vi.advanceTimersByTime(ms)`

See [mocking guide](./references/mocking-patterns.md).

### 5. Test State Tracking & Isolation

When testing features that track state per user/command/context:

- Start with fresh state in each test
- Verify independence: `it("tracks X independently per Y", ...)`
- Check that modifications in one scenario don't affect others
- Use descriptive user/command IDs to trace test data

### 6. Run & Verify

```bash
npm test                    # Run all tests
npm test -- cooldowns       # Run specific test file
npm test -- --reporter=verbose  # See all test names
```

## Example Implementations

See [slash command test](./references/slash-command-example.ts) for testing Discord commands with mocks.

See [cooldowns test](../../../src/__tests__/cooldowns.test.ts) in the repo for a utility function example.

## Common Patterns

### Testing Time-Based Features

```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("returns remaining time after delay", () => {
  callFeature();
  vi.advanceTimersByTime(2000);
  const result = callFeatureAgain();
  expect(result).toBeLessThan(originalTimeout);
});
```

### Testing State per User/ID

```typescript
it("tracks state independently per user", () => {
  callWith("user-1");
  callWith("user-2");
  expect(getStateFor("user-1")).not.toEqual(getStateFor("user-2"));
});
```

### Testing Discord Command Handlers

```typescript
it("should ban user when command invoked", async () => {
  const mockInteraction = {
    options: { getUser: vi.fn().mockReturnValue(targetUser) },
    reply: vi.fn(),
  };

  await banCommand.execute(mockInteraction);

  expect(mockInteraction.reply).toHaveBeenCalledWith(
    expect.stringContaining("banned"),
  );
});
```

## Coverage Checklist

Before submitting a test:

- [ ] All normal paths tested
- [ ] Edge cases covered (null, empty, boundary values)
- [ ] Error conditions handled
- [ ] Mocks cleaned up in `afterEach`
- [ ] Test names describe expected behavior
- [ ] No shared state between tests
- [ ] AAA pattern followed consistently
