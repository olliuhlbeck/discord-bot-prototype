import { describe, it, expect, beforeEach, vi } from "vitest";
// TODO: Replace with actual import path, e.g. import { isOnCoolDown } from "../../utils/cooldowns.js";
import banCommand from "../../slash/ban";

describe("banCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should ban a user when invoked with valid target", async () => {
    // Arrange
    const targetUser = { id: "user-123", username: "offender" };
    const mockInteraction = {
      options: {
        getUser: vi.fn().mockReturnValue(targetUser),
        getString: vi.fn().mockReturnValue("Spam violations"),
      },
      user: { id: "mod-456", username: "moderator" },
      guild: {
        members: {
          ban: vi.fn().mockResolvedValue(undefined),
        },
      },
      reply: vi.fn().mockResolvedValue(undefined),
      ephemeral: false,
    };

    // Act
    await banCommand.execute(mockInteraction);

    // Assert
    expect(mockInteraction.guild.members.ban).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ reason: "Spam violations" }),
    );
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("user-123"),
    );
  });

  it("should reject if user lacks permissions", async () => {
    const mockInteraction = {
      options: {
        getUser: vi.fn().mockReturnValue({ id: "user-1" }),
        getString: vi.fn().mockReturnValue("reason"),
      },
      user: { id: "mod-1", username: "normaluser" },
      member: {
        permissions: {
          has: vi.fn().mockReturnValue(false), // No BAN_MEMBERS permission
        },
      },
      guild: {
        members: {
          ban: vi.fn(),
        },
      },
      reply: vi.fn(),
    };

    await banCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("permission"),
    );
    expect(mockInteraction.guild?.members?.ban).not.toHaveBeenCalled();
  });

  it("should handle ban errors gracefully", async () => {
    const mockInteraction = {
      options: {
        getUser: vi.fn().mockReturnValue({ id: "user-1" }),
        getString: vi.fn().mockReturnValue("reason"),
      },
      user: { id: "mod-1" },
      guild: {
        members: {
          ban: vi.fn().mockRejectedValue(new Error("Cannot ban moderator")),
        },
      },
      reply: vi.fn(),
    };

    await banCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("error"),
    );
  });
});
