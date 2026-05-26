# Mocking Patterns for Discord Bot Tests

## Basic Function Mocking

```typescript
import { vi } from "vitest";

const mockFn = vi.fn();
mockFn("arg1");
expect(mockFn).toHaveBeenCalledWith("arg1");
expect(mockFn).toHaveBeenCalledTimes(1);
```

## Mock Return Values

```typescript
const mockFn = vi
  .fn()
  .mockReturnValue("value")
  .mockReturnValueOnce("first-call")
  .mockReturnValueOnce("second-call");

mockFn(); // returns "first-call"
mockFn(); // returns "second-call"
mockFn(); // returns "value"
```

## Mock Async Functions

```typescript
const mockAsync = vi.fn().mockResolvedValue({ success: true });
const mockAsyncError = vi.fn().mockRejectedValue(new Error("failed"));

await mockAsync(); // resolves to { success: true }
```

## Mocking Discord.js Interaction

```typescript
const mockInteraction = {
  options: {
    getUser: vi.fn().mockReturnValue({ id: "user-123", username: "testuser" }),
    getString: vi.fn().mockReturnValue("test reason"),
  },
  user: { id: "mod-id", username: "moderator" },
  reply: vi.fn(),
  deferReply: vi.fn(),
  followUp: vi.fn(),
  guild: { members: { ban: vi.fn() } },
};

// Pass to command handler
await commandHandler(mockInteraction);

// Verify it was called correctly
expect(mockInteraction.reply).toHaveBeenCalledWith(
  expect.stringContaining("banned user-123"),
);
```

## Mocking Modules

```typescript
vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Now logger calls in the code won't output, they'll be tracked
import { logger } from "../../utils/logger";
expect(logger.error).toHaveBeenCalled();
```

## Fake Timers for Time-Based Tests

```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("should reset after timeout", () => {
  startCooldown();
  vi.advanceTimersByTime(5000); // Advance 5 seconds
  expect(isOnCooldown()).toBe(false);
});
```

## Partial Mocking (Real + Mock)

```typescript
// Keep most of the module real, mock specific functions
vi.mock("../../utils/db", async () => {
  const actual = await vi.importActual("../../utils/db");
  return {
    ...actual,
    saveUser: vi.fn(), // Mock this one
  };
});
```

## Verify Mock Calls

```typescript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(3);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenNthCalledWith(2, arg1, arg2); // 2nd call
expect(mockFn).toHaveBeenLastCalledWith(arg1, arg2);

// Check call order
expect(mock1).toHaveBeenCalledBefore(mock2);
```

## Clear & Reset

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Clear call history but keep implementation
  vi.resetAllMocks(); // Clear everything
});
```
