import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOnCoolDown } from "../utils/cooldowns.js";

describe("isOnCooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null on first use since there is no cooldown", () => {
    const result = isOnCoolDown("ping", "user-1", 5);
    expect(result).toBeNull();
  });

  it("returns remaining cooldown time if the command is used again within the cooldown period", () => {
    isOnCoolDown("ping", "user-2", 5);
    vi.advanceTimersByTime(2000);
    const result = isOnCoolDown("ping", "user-2", 5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(3000);
  });

  it("returns null after the cooldown period has fully expired", () => {
    isOnCoolDown("ping", "user-3", 5);
    vi.advanceTimersByTime(5000);
    const result = isOnCoolDown("ping", "user-3", 5);
    expect(result).toBeNull();
  });

  it("tracks cooldowns independently per user", () => {
    isOnCoolDown("ping", "user-a", 10);
    vi.advanceTimersByTime(3000);
    // user-a is on cooldown, user-b is not
    expect(isOnCoolDown("ping", "user-a", 10)).toBeGreaterThan(0);
    expect(isOnCoolDown("ping", "user-b", 10)).toBeNull();
  });

  it("tracks cooldowns independently per command", () => {
    isOnCoolDown("ping", "user-x", 10);
    // same user, different command — should not be on cooldown
    expect(isOnCoolDown("kick", "user-x", 10)).toBeNull();
  });

  it("returns the correct remaining time (within 1 second tolerance)", () => {
    isOnCoolDown("warn", "user-5", 30);
    vi.advanceTimersByTime(10000); // 10s later
    const result = isOnCoolDown("warn", "user-5", 30);
    // 20 seconds remaining
    expect(result).toBeGreaterThanOrEqual(19);
    expect(result).toBeLessThanOrEqual(20);
  });
});
