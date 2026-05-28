import { describe, expect, it, beforeEach, vi } from "vitest";
import warnCommand from "../slash/warn.js";
import {
  GuildMember,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import { addWarning, getWarnings } from "../utils/warnings.js";
import { logAction } from "../utils/logger.js";

vi.mock("../utils/warnings.js", () => ({
  addWarning: vi.fn().mockResolvedValue(undefined),
  getWarnings: vi.fn().mockResolvedValue([]),
}));

vi.mock("../utils/logger.js", () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}));

const mockedGetWarnings = getWarnings as unknown as ReturnType<typeof vi.fn>;

const createMockInteraction = (overrides = {}) =>
  ({
    inGuild: vi.fn().mockReturnValue(true),
    user: {
      id: "mod-123",
      tag: "Moderator#0001",
    },
    options: {
      getMember: vi.fn(),
      getString: vi.fn(),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as ChatInputCommandInteraction;

const createTargetMember = (overrides = {}) => {
  const targetMember = {
    id: "warned-user-1",
    user: {
      id: "warned-user-1",
      tag: "WarnedUser#0002",
    },
    ...overrides,
  };

  Object.setPrototypeOf(targetMember, GuildMember.prototype);

  return targetMember as unknown;
};

describe("warnCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do nothing when the interaction is not in a guild", async () => {
    const mockInteraction = createMockInteraction({
      inGuild: vi.fn().mockReturnValue(false),
    });

    await warnCommand.execute(mockInteraction);

    expect(mockInteraction.reply).not.toHaveBeenCalled();
    expect(addWarning).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reject if target user is not a guild member", async () => {
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue({ id: "not-a-member" }),
        getString: vi.fn(),
      },
    });

    await warnCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "User not found or not a member of this server.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(addWarning).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should warn a user with a provided reason and log the action", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getString: vi.fn().mockReturnValue("Breaking the rules"),
      },
    });

    mockedGetWarnings.mockResolvedValue([
      { moderatorID: "mod-000", reason: "First warning", timestamp: 1 },
      { moderatorID: "mod-001", reason: "Second warning", timestamp: 2 },
    ]);

    await warnCommand.execute(mockInteraction);

    expect(addWarning).toHaveBeenCalledWith("warned-user-1", {
      moderatorID: "mod-123",
      reason: "Breaking the rules",
      timestamp: expect.any(Number),
    });

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(
          "Warned WarnedUser#0002. Total warnings: 2",
        ),
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      mockInteraction,
      "User Warned",
      "WarnedUser#0002 was warned. Reason: Breaking the rules",
    );
  });

  it("should warn a user with the default reason when none is provided", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getString: vi.fn().mockReturnValue(null),
      },
    });

    mockedGetWarnings.mockResolvedValue([
      { moderatorID: "mod-123", reason: "No reason provided", timestamp: 3 },
    ]);

    await warnCommand.execute(mockInteraction);

    expect(addWarning).toHaveBeenCalledWith("warned-user-1", {
      moderatorID: "mod-123",
      reason: "No reason provided",
      timestamp: expect.any(Number),
    });

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Total warnings: 1"),
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it("should reply with an error message if addWarning throws", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getString: vi.fn().mockReturnValue("Some reason"),
      },
    });

    (addWarning as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Disk error"),
    );

    await warnCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Failed to save warning.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should show Total warnings: 1 on a user's first warning", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getString: vi.fn().mockReturnValue("First offence"),
      },
    });

    mockedGetWarnings.mockResolvedValueOnce([
      {
        moderatorID: "mod-123",
        reason: "First offence",
        timestamp: Date.now(),
      },
    ]);

    await warnCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Total warnings: 1"),
      }),
    );
  });
});
