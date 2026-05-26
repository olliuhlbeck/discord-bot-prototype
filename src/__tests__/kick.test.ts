import { describe, it, expect, beforeEach, vi } from "vitest";
import kickCommand from "../slash/kick.js";
import { logAction } from "../utils/logger.js";
import { MessageFlags, ChatInputCommandInteraction } from "discord.js";

// Mock the logger utility
vi.mock("../utils/logger.js", () => ({
  logAction: vi.fn(),
}));

describe("kickCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create a mock interaction
  const createMockInteraction = (overrides = {}) =>
    ({
      inGuild: vi.fn().mockReturnValue(true),
      member: {
        id: "mod-456",
        permissions: {
          has: vi.fn().mockReturnValue(true), // Has KickMembers by default
        },
        roles: {
          highest: { position: 100 },
        },
      },
      user: {
        id: "mod-456",
        tag: "Moderator#0001",
      },
      options: {
        getMember: vi.fn(),
        getString: vi.fn(),
      },
      reply: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    }) as unknown as ChatInputCommandInteraction;

  // Helper function to create a target user/member
  const createTargetMember = (overrides = {}) => ({
    id: "user-123",
    user: {
      id: "user-123",
      tag: "BadUser#0002",
    },
    kick: vi.fn().mockResolvedValue(undefined),
    kickable: true,
    roles: {
      highest: { position: 50 },
    },
    ...overrides,
  });

  describe("Happy Path - Successful Kicks", () => {
    it("should kick a user with a provided reason", async () => {
      // Arrange
      const targetMember = createTargetMember();
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn().mockReturnValue("Spam violations"),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(targetMember.kick).toHaveBeenCalledWith("Spam violations");
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("BadUser#0002"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(logAction).toHaveBeenCalled();
    });

    it("should kick a user with default reason when none provided", async () => {
      // Arrange
      const targetMember = createTargetMember();
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn().mockReturnValue(null),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(targetMember.kick).toHaveBeenCalledWith("No reason provided");
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("No reason provided"),
        }),
      );
    });
  });

  describe("Permission Checks", () => {
    it("should reject if user lacks KickMembers permission", async () => {
      // Arrange
      const mockInteraction = createMockInteraction({
        member: {
          id: "mod-456",
          permissions: {
            has: vi.fn().mockReturnValue(false), // No permission
          },
          roles: {
            highest: { position: 100 },
          },
        },
        options: {
          getMember: vi.fn(),
          getString: vi.fn(),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("permission"),
          flags: MessageFlags.Ephemeral,
        }),
      );
    });

    it("should not kick the member if it is not in guild", async () => {
      // Arrange
      const mockInteraction = createMockInteraction({
        inGuild: vi.fn().mockReturnValue(false),
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });
  });

  describe("Target User Validation", () => {
    it("should reject if target user is not found", async () => {
      // Arrange
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(null), // User not found
          getString: vi.fn(),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Cannot kick without mention"),
          flags: MessageFlags.Ephemeral,
        }),
      );
    });

    it("should prevent user from kicking themselves", async () => {
      // Arrange
      const selfKickMember = createTargetMember({
        id: "mod-456", // Same as interaction.user.id
      });
      const mockInteraction = createMockInteraction({
        user: {
          id: "mod-456",
          tag: "Moderator#0001",
        },
        options: {
          getMember: vi.fn().mockReturnValue(selfKickMember),
          getString: vi.fn(),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("cannot kick yourself"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(selfKickMember.kick).not.toHaveBeenCalled();
    });
  });

  describe("Bot Capability Checks", () => {
    it("should reject if bot does not have permission to kick the user", async () => {
      // Arrange
      const unkickableMember = createTargetMember({
        kickable: false,
      });
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(unkickableMember),
          getString: vi.fn(),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("don't have permission"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(unkickableMember.kick).not.toHaveBeenCalled();
    });
  });

  describe("Role Hierarchy Checks", () => {
    it("should reject if target user has equal role position", async () => {
      // Arrange
      const targetMember = createTargetMember({
        roles: {
          highest: { position: 100 }, // Equal to moderator
        },
      });
      const mockInteraction = createMockInteraction({
        member: {
          id: "mod-456",
          permissions: {
            has: vi.fn().mockReturnValue(true),
          },
          roles: {
            highest: { position: 100 }, // Same position
          },
        },
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn(),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("role hierarchy"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(targetMember.kick).not.toHaveBeenCalled();
    });

    it("should reject if target user has higher role position", async () => {
      // Arrange
      const targetMember = createTargetMember({
        roles: {
          highest: { position: 150 }, // Higher than moderator
        },
      });
      const mockInteraction = createMockInteraction({
        member: {
          id: "mod-456",
          permissions: {
            has: vi.fn().mockReturnValue(true),
          },
          roles: {
            highest: { position: 100 }, // Lower position
          },
        },
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn(),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("role hierarchy"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(targetMember.kick).not.toHaveBeenCalled();
    });

    it("should allow kicking user with lower role position", async () => {
      // Arrange
      const targetMember = createTargetMember({
        roles: {
          highest: { position: 50 }, // Lower than moderator
        },
      });
      const mockInteraction = createMockInteraction({
        member: {
          id: "mod-456",
          permissions: {
            has: vi.fn().mockReturnValue(true),
          },
          roles: {
            highest: { position: 100 },
          },
        },
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn().mockReturnValue("Bad behavior"),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(targetMember.kick).toHaveBeenCalledWith("Bad behavior");
    });
  });

  describe("Error Handling", () => {
    it("should handle kick operation failure gracefully", async () => {
      // Arrange
      const targetMember = createTargetMember({
        kick: vi.fn().mockRejectedValue(new Error("Failed to kick")),
      });
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn().mockReturnValue("Spam"),
        },
      });

      // Act
      await kickCommand.execute(mockInteraction);

      // Assert
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("could not kick"),
          flags: MessageFlags.Ephemeral,
        }),
      );
    });
  });

  describe("Independence & State Isolation", () => {
    it("should handle multiple independent kick scenarios", async () => {
      // Test 1: First user gets kicked
      const user1 = createTargetMember({
        id: "user-1",
        user: { id: "user-1", tag: "User1#0001" },
      });
      const interaction1 = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(user1),
          getString: vi.fn().mockReturnValue("Reason 1"),
        },
      });

      await kickCommand.execute(interaction1);
      expect(user1.kick).toHaveBeenCalledWith("Reason 1");

      // Test 2: Second user gets kicked independently
      const user2 = createTargetMember({
        id: "user-2",
        user: { id: "user-2", tag: "User2#0002" },
      });
      const interaction2 = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(user2),
          getString: vi.fn().mockReturnValue("Reason 2"),
        },
      });

      await kickCommand.execute(interaction2);
      expect(user2.kick).toHaveBeenCalledWith("Reason 2");

      // Verify they are independent - each mock tracked separately
      expect(user1.kick).toHaveBeenCalledTimes(1);
      expect(user2.kick).toHaveBeenCalledTimes(1);
    });
  });
});
