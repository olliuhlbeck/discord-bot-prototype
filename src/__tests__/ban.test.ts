import { describe, it, expect, beforeEach, vi } from "vitest";
import banCommand from "../slash/ban.js";
import { logAction } from "../utils/logger.js";
import { MessageFlags, ChatInputCommandInteraction } from "discord.js";

// Mock the logger utility
vi.mock("../utils/logger.js", () => ({
  logAction: vi.fn(),
}));

describe("banCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockInteraction = (overrides = {}) =>
    ({
      inGuild: vi.fn().mockReturnValue(true),
      member: {
        id: "mod-456",
        permissions: {
          has: vi.fn().mockReturnValue(true), // Has BanMembers by default
        },
        roles: {
          highest: { position: 100 },
        },
      },
      user: {
        id: "mod-456",
        tag: "Moderator#0001",
      },
      client: { user: { id: "bot-999" } },
      options: {
        getMember: vi.fn(),
        getString: vi.fn(),
      },
      reply: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    }) as unknown as ChatInputCommandInteraction;

  const createTargetMember = (overrides = {}) => ({
    id: "user-123",
    user: {
      id: "user-123",
      tag: "BadUser#0002",
    },
    ban: vi.fn().mockResolvedValue(undefined),
    bannable: true,
    roles: {
      highest: { position: 50 },
    },
    ...overrides,
  });

  describe("Happy Path - Successful Bans", () => {
    it("should ban a user with a provided reason", async () => {
      const targetMember = createTargetMember();
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn().mockReturnValue("Violating rules"),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(targetMember.ban).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "Violating rules" }),
      );
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("BadUser#0002"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(logAction).toHaveBeenCalled();
    });

    it("should ban a user with default reason when none provided", async () => {
      const targetMember = createTargetMember();
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn().mockReturnValue(null),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(targetMember.ban).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "No reason provided" }),
      );
      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("No reason provided"),
        }),
      );
    });
  });

  describe("Permission Checks", () => {
    it("should reject if user lacks BanMembers permission", async () => {
      const mockInteraction = createMockInteraction({
        member: {
          id: "mod-456",
          permissions: {
            has: vi.fn().mockReturnValue(false),
          },
          roles: { highest: { position: 100 } },
        },
        options: { getMember: vi.fn(), getString: vi.fn() },
      });

      await banCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("permission"),
          flags: MessageFlags.Ephemeral,
        }),
      );
    });

    it("should not act if not in a guild", async () => {
      const mockInteraction = createMockInteraction({
        inGuild: vi.fn().mockReturnValue(false),
      });

      await banCommand.execute(mockInteraction);
      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });
  });

  describe("Target Validation", () => {
    it("should reject if target user is not found", async () => {
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(null),
          getString: vi.fn(),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("User not found"),
          flags: MessageFlags.Ephemeral,
        }),
      );
    });

    it("should prevent user from banning themselves", async () => {
      const selfBan = createTargetMember({ id: "mod-456" });
      const mockInteraction = createMockInteraction({
        user: { id: "mod-456", tag: "Moderator#0001" },
        options: {
          getMember: vi.fn().mockReturnValue(selfBan),
          getString: vi.fn(),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("cannot ban yourself"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(selfBan.ban).not.toHaveBeenCalled();
    });

    it("should prevent banning the bot itself", async () => {
      const botMember = createTargetMember({ id: "bot-999" });
      const mockInteraction = createMockInteraction({
        client: { user: { id: "bot-999" } },
        options: {
          getMember: vi.fn().mockReturnValue(botMember),
          getString: vi.fn(),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("No one can ban"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(botMember.ban).not.toHaveBeenCalled();
    });
  });

  describe("Bot Capability & Hierarchy", () => {
    it("should reject if bot does not have permission to ban the user", async () => {
      const unbannable = createTargetMember({ bannable: false });
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(unbannable),
          getString: vi.fn(),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("don't have permission"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(unbannable.ban).not.toHaveBeenCalled();
    });

    it("should reject if target has equal or higher role position", async () => {
      const targetEqual = createTargetMember({
        roles: { highest: { position: 100 } },
      });
      const mockInteraction = createMockInteraction({
        member: {
          id: "mod-456",
          permissions: { has: vi.fn().mockReturnValue(true) },
          roles: { highest: { position: 100 } },
        },
        options: {
          getMember: vi.fn().mockReturnValue(targetEqual),
          getString: vi.fn(),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("role hierarchy"),
          flags: MessageFlags.Ephemeral,
        }),
      );
      expect(targetEqual.ban).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle ban operation failure gracefully", async () => {
      const targetMember = createTargetMember({
        ban: vi.fn().mockRejectedValue(new Error("Fail")),
      });
      const mockInteraction = createMockInteraction({
        options: {
          getMember: vi.fn().mockReturnValue(targetMember),
          getString: vi.fn().mockReturnValue("Spam"),
        },
      });

      await banCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.stringContaining("Failed to ban"),
      );
    });
  });

  describe("Independence & State Isolation", () => {
    it("should handle multiple independent ban scenarios", async () => {
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

      await banCommand.execute(interaction1);
      expect(user1.ban).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "Reason 1" }),
      );

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

      await banCommand.execute(interaction2);
      expect(user2.ban).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "Reason 2" }),
      );

      expect(user1.ban).toHaveBeenCalledTimes(1);
      expect(user2.ban).toHaveBeenCalledTimes(1);
    });
  });
});
