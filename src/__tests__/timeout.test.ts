import { describe, expect, it, beforeEach, vi } from "vitest";
import timeoutCommand from "../slash/timeout.js";
import { logAction } from "../utils/logger.js";
import {
  GuildMember,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";

vi.mock("../utils/logger.js", () => ({
  logAction: vi.fn(),
}));

const createMockInteraction = (overrides = {}) =>
  ({
    inGuild: vi.fn().mockReturnValue(true),
    member: {
      id: "mod-123",
      roles: {
        highest: { position: 100 },
      },
    },
    guild: {
      ownerId: "owner-999",
    },
    client: {
      user: {
        id: "bot-999",
      },
    },
    options: {
      getMember: vi.fn(),
      getInteger: vi.fn(),
      getString: vi.fn(),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    replied: false,
    deferred: false,
    ...overrides,
  }) as unknown as ChatInputCommandInteraction;

const createTargetMember = (overrides = {}) => {
  const member = {
    id: "user-123",
    user: {
      id: "user-123",
      tag: "TargetUser#0001",
    },
    roles: {
      highest: { position: 50 },
    },
    moderatable: true,
    timeout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  Object.setPrototypeOf(member, GuildMember.prototype);
  return member as unknown as GuildMember;
};

describe("timeoutCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do nothing when the interaction is not in a guild", async () => {
    const mockInteraction = createMockInteraction({
      inGuild: vi.fn().mockReturnValue(false),
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reply when the target user is not found in the guild", async () => {
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(null),
        getInteger: vi.fn(),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "User not found in this guild.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(logAction).not.toHaveBeenCalled();
  });

  it("should reject a duration below 1 minute", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getInteger: vi.fn().mockReturnValue(0),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(
          "Please provide a duration between 1 and 40320 minutes",
        ),
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(targetMember.timeout).not.toHaveBeenCalled();
  });

  it("should reject a duration above 40320 minutes", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getInteger: vi.fn().mockReturnValue(40321),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(
          "Please provide a duration between 1 and 40320 minutes",
        ),
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(targetMember.timeout).not.toHaveBeenCalled();
  });

  it("should reject when trying to timeout yourself", async () => {
    const selfMember = createTargetMember({
      id: "mod-123",
      user: { id: "mod-123", tag: "Moderator#0001" },
    });
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(selfMember),
        getInteger: vi.fn().mockReturnValue(10),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "You cannot timeout yourself.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(selfMember.timeout).not.toHaveBeenCalled();
  });

  it("should reject when target is the server owner", async () => {
    const ownerMember = createTargetMember({
      id: "owner-999",
      user: { id: "owner-999", tag: "Owner#0001" },
    });
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(ownerMember),
        getInteger: vi.fn().mockReturnValue(10),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "You cannot timeout the server owner.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(ownerMember.timeout).not.toHaveBeenCalled();
  });

  it("should reject when target has equal or higher role position", async () => {
    const highRoleMember = createTargetMember({
      roles: { highest: { position: 100 } },
    });
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(highRoleMember),
        getInteger: vi.fn().mockReturnValue(10),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "You cannot timeout a user with an equal or higher role.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(highRoleMember.timeout).not.toHaveBeenCalled();
  });

  it("should reject when target is not moderatable", async () => {
    const targetMember = createTargetMember({ moderatable: false });
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getInteger: vi.fn().mockReturnValue(10),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "I do not have permission to timeout this user.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(targetMember.timeout).not.toHaveBeenCalled();
  });

  it("should reject when target is the bot itself", async () => {
    const botMember = createTargetMember({
      id: "bot-999",
      user: { id: "bot-999", tag: "Bot#0001" },
    });
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(botMember),
        getInteger: vi.fn().mockReturnValue(10),
        getString: vi.fn(),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "You cannot timeout the bot.",
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(botMember.timeout).not.toHaveBeenCalled();
  });

  it("should timeout a user with a provided reason and log the action", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getInteger: vi.fn().mockReturnValue(15),
        getString: vi.fn().mockReturnValue("Spamming links"),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(targetMember.timeout).toHaveBeenCalledWith(
      15 * 60 * 1000,
      "Spamming links",
    );
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(
          "TargetUser#0001 has been timed out for 15 minute(s). Reason: Spamming links",
        ),
        flags: MessageFlags.Ephemeral,
      }),
    );
    expect(logAction).toHaveBeenCalledWith(
      mockInteraction,
      "User Timed Out",
      "TargetUser#0001 was timed out for 15 minute(s). Reason: Spamming links",
    );
  });

  it("should timeout a user with default reason when no reason is provided", async () => {
    const targetMember = createTargetMember();
    const mockInteraction = createMockInteraction({
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getInteger: vi.fn().mockReturnValue(5),
        getString: vi.fn().mockReturnValue(null),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(targetMember.timeout).toHaveBeenCalledWith(
      5 * 60 * 1000,
      "No reason provided",
    );
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("No reason provided"),
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it("should follow up with an error when timeout fails after reply or defer", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const targetMember = createTargetMember({
      timeout: vi.fn().mockRejectedValue(new Error("Failed to timeout")),
    });
    const mockInteraction = createMockInteraction({
      replied: true,
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getInteger: vi.fn().mockReturnValue(20),
        getString: vi.fn().mockReturnValue("Bad behavior"),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.followUp).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "An error occurred while trying to timeout the user.",
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it("should reply with an error when timeout fails before any reply", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const targetMember = createTargetMember({
      timeout: vi.fn().mockRejectedValue(new Error("Failed to timeout")),
    });
    const mockInteraction = createMockInteraction({
      replied: false,
      deferred: false,
      options: {
        getMember: vi.fn().mockReturnValue(targetMember),
        getInteger: vi.fn().mockReturnValue(20),
        getString: vi.fn().mockReturnValue("Bad behavior"),
      },
    });

    await timeoutCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "An error occurred while trying to timeout the user.",
        flags: MessageFlags.Ephemeral,
      }),
    );
  });
});
