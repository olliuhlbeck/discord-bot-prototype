import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkPermissions } from "../utils/permissions.js";
import type { Command } from "../types/Command.ts";
import type { GuildMember } from "discord.js";

const originalBotOwnerId = process.env.BOT_OWNER_ID;

describe("checkPermissions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.BOT_OWNER_ID = originalBotOwnerId;
  });

  afterEach(() => {
    process.env.BOT_OWNER_ID = originalBotOwnerId;
  });

  function createMockInteraction(
    overrides: Partial<Record<string, unknown>> = {},
  ) {
    const mockMember = {
      permissions: {
        has: vi.fn().mockReturnValue(true),
      },
      roles: {
        cache: {
          some: vi.fn().mockReturnValue(true),
        },
      },
    } as unknown as GuildMember;

    return {
      inGuild: vi.fn().mockReturnValue(true),
      user: { id: "user-123" },
      member: mockMember,
      ...overrides,
    } as unknown as Parameters<typeof checkPermissions>[0];
  }

  function createCommand(overrides: Partial<Command> = {}): Command {
    return {
      data: {},
      execute: async () => undefined,
      ...overrides,
    } as Command;
  }

  it("returns an error when the command is used outside a server", () => {
    const interaction = createMockInteraction({
      inGuild: vi.fn().mockReturnValue(false),
    });
    const command = createCommand();

    const result = checkPermissions(interaction, command);

    expect(result).toBe("This command can only be used in a server.");
  });

  it("returns an error when owner-only command is used without BOT_OWNER_ID", () => {
    delete process.env.BOT_OWNER_ID;
    const interaction = createMockInteraction();
    const command = createCommand({ ownerOnly: true });

    const result = checkPermissions(interaction, command);

    expect(result).toBe(
      "Owner-only commands are disabled (missing BOT_OWNER_ID).",
    );
  });

  it("returns an error when a non-owner tries to use an owner-only command", () => {
    process.env.BOT_OWNER_ID = "owner-1";
    const interaction = createMockInteraction({ user: { id: "not-owner" } });
    const command = createCommand({ ownerOnly: true });

    const result = checkPermissions(interaction, command);

    expect(result).toBe("You do not have permission to use this command.");
  });

  it("returns null when the owner uses an owner-only command", () => {
    process.env.BOT_OWNER_ID = "owner-1";
    const interaction = createMockInteraction({ user: { id: "owner-1" } });
    const command = createCommand({ ownerOnly: true });

    const result = checkPermissions(interaction, command);

    expect(result).toBeNull();
  });

  it("returns an error when the member lacks a required Discord permission", () => {
    const mockMember = {
      permissions: {
        has: vi.fn().mockReturnValue(false),
      },
      roles: {
        cache: {
          some: vi.fn().mockReturnValue(true),
        },
      },
    } as unknown as GuildMember;

    const interaction = createMockInteraction({ member: mockMember });
    const command = createCommand({ permissions: ["BanMembers"] });

    const result = checkPermissions(interaction, command);

    expect(result).toBe(
      "You do not have the required permissions to use this command.",
    );
  });

  it("returns null when the member has all required Discord permissions", () => {
    const interaction = createMockInteraction();
    const command = createCommand({ permissions: ["BanMembers"] });

    const result = checkPermissions(interaction, command);

    expect(result).toBeNull();
  });

  it("returns an error when the member does not have a required role", () => {
    const mockMember = {
      permissions: {
        has: vi.fn().mockReturnValue(true),
      },
      roles: {
        cache: {
          some: vi.fn().mockReturnValue(false),
        },
      },
    } as unknown as GuildMember;

    const interaction = createMockInteraction({ member: mockMember });
    const command = createCommand({ rolesThatCanUseCommand: ["Admin"] });

    const result = checkPermissions(interaction, command);

    expect(result).toBe(
      "You do not have the required role to use this command.",
    );
  });

  it("returns null when the member has the required role", () => {
    const interaction = createMockInteraction();
    const command = createCommand({ rolesThatCanUseCommand: ["Admin"] });

    const result = checkPermissions(interaction, command);

    expect(result).toBeNull();
  });

  it("checks permissions before role requirements and returns the first applicable error", () => {
    const mockMember = {
      permissions: {
        has: vi.fn().mockReturnValue(false),
      },
      roles: {
        cache: {
          some: vi.fn().mockReturnValue(false),
        },
      },
    } as unknown as GuildMember;

    const interaction = createMockInteraction({ member: mockMember });
    const command = createCommand({
      permissions: ["BanMembers"],
      rolesThatCanUseCommand: ["Admin"],
    });

    const result = checkPermissions(interaction, command);

    expect(result).toBe(
      "You do not have the required permissions to use this command.",
    );
    expect(mockMember.roles.cache.some).not.toHaveBeenCalled();
  });
});
