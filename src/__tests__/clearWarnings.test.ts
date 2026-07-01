import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GuildMember,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";

import clearWarningsCommand from "../slash/clearWarnings.js";
import { clearWarnings, getWarnings } from "../utils/warnings.js";
import { logAction } from "../utils/logger.js";

vi.mock("../utils/warnings.js", () => ({
  clearWarnings: vi.fn().mockResolvedValue(undefined),
  getWarnings: vi.fn().mockResolvedValue([]),
}));

vi.mock("../utils/logger.js", () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}));

const mockedGetWarnings = getWarnings as unknown as ReturnType<typeof vi.fn>;
const mockedClearWarnings = clearWarnings as unknown as ReturnType<
  typeof vi.fn
>;

const createMockInteraction = (overrides = {}) =>
  ({
    inGuild: vi.fn().mockReturnValue(true),
    user: {
      id: "mod-123",
      tag: "Moderator#0001",
    },
    options: {
      getMember: vi.fn(),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as ChatInputCommandInteraction;

const createTargetMember = (overrides = {}) => {
  const targetMember = {
    id: "target-user-1",
    user: {
      id: "target-user-1",
      tag: "TargetUser#0002",
    },
    ...overrides,
  };

  Object.setPrototypeOf(targetMember, GuildMember.prototype);

  return targetMember as unknown;
};

describe("clearWarningsCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reply with a generic error message when getWarnings fails", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
      },
    });

    mockedGetWarnings.mockRejectedValueOnce(new Error("Read error"));

    await clearWarningsCommand.execute(mockInteraction);

    expect(mockedClearWarnings).not.toHaveBeenCalled();
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Something went wrong while clearing warnings.",
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it("should do nothing when the interaction is not in a guild", async () => {
    const mockInteraction = createMockInteraction({
      inGuild: vi.fn().mockReturnValue(false),
    });

    await clearWarningsCommand.execute(mockInteraction);

    expect(mockInteraction.reply).not.toHaveBeenCalled();
    expect(mockedGetWarnings).not.toHaveBeenCalled();
    expect(mockedClearWarnings).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reply with a user-not-found message when the target is invalid", async () => {
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue({ id: "not-a-member" }),
      },
    });

    await clearWarningsCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "User not found.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(mockedGetWarnings).not.toHaveBeenCalled();
    expect(mockedClearWarnings).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reply that the user has no warnings when none are present", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
      },
    });

    mockedGetWarnings.mockResolvedValueOnce([]);

    await clearWarningsCommand.execute(mockInteraction);

    expect(mockedGetWarnings).toHaveBeenCalledWith("target-user-1");
    expect(mockedClearWarnings).not.toHaveBeenCalled();
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "TargetUser#0002 has no warnings.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should clear existing warnings and log the action", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
      },
    });

    mockedGetWarnings.mockResolvedValueOnce([
      { moderatorID: "mod-123", reason: "First warning", timestamp: 1 },
      { moderatorID: "mod-123", reason: "Second warning", timestamp: 2 },
    ]);

    await clearWarningsCommand.execute(mockInteraction);

    expect(mockedClearWarnings).toHaveBeenCalledWith("target-user-1");
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Cleared 2 warning(s) from TargetUser#0002.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      mockInteraction,
      "Warnings Cleared",
      "Moderator#0001 cleared warnings for TargetUser#0002.",
    );
  });

  it("should reply with a generic error message when clearing warnings fails", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
      },
    });

    mockedGetWarnings.mockResolvedValueOnce([
      { moderatorID: "mod-123", reason: "First warning", timestamp: 1 },
    ]);
    mockedClearWarnings.mockRejectedValueOnce(new Error("Disk error"));

    await clearWarningsCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Something went wrong while clearing warnings.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(logAction).not.toHaveBeenCalled();
  });
});
