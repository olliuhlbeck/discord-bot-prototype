import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/cooldowns.ts", () => ({
  isOnCoolDown: vi.fn(),
}));

import { registerInteractionHandler } from "../loader/handleInteractions.js";
import { slashCommands } from "../loader/commandRegistry.js";
import { isOnCoolDown } from "../utils/cooldowns.ts";
import {
  ChatInputCommandInteraction,
  MessageFlags,
  type Client,
} from "discord.js";

const createMockClient = () => {
  const on = vi.fn();
  return { on } as unknown as Client;
};

const createMockInteraction = (overrides: Record<string, unknown> = {}) =>
  ({
    isChatInputCommand: vi.fn().mockReturnValue(true),
    commandName: "test",
    user: { id: "user-123" },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as ChatInputCommandInteraction;

const getRegisteredInteractionHandler = (client: Client) => {
  registerInteractionHandler(client);
  const calls = (client as unknown as { on: ReturnType<typeof vi.fn> }).on.mock
    .calls;
  return calls.find(([event]) => event === "interactionCreate")?.[1] as (
    interaction: ChatInputCommandInteraction,
  ) => Promise<void>;
};

describe("registerInteractionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    slashCommands.clear();
  });

  it("should not check cooldown when command has no cooldown defined", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const interaction = createMockInteraction({ commandName: "no-cooldown" });

    slashCommands.set("no-cooldown", {
      data: { name: "no-cooldown" },
      execute,
    } as const);

    const handler = getRegisteredInteractionHandler(createMockClient());
    await handler(interaction);

    expect(isOnCoolDown).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalled();
  });

  it("should ignore interactions that are not chat input commands", async () => {
    const client = createMockClient();
    const interaction = createMockInteraction({
      isChatInputCommand: vi.fn().mockReturnValue(false),
    });

    const handler = getRegisteredInteractionHandler(client);
    await handler(interaction);

    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("should reply with unknown command when the command is not registered", async () => {
    const client = createMockClient();
    const interaction = createMockInteraction();

    const handler = getRegisteredInteractionHandler(client);
    await handler(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Unknown command.",
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it("should reply with cooldown notice when the command is on cooldown", async () => {
    const client = createMockClient();
    const interaction = createMockInteraction({
      commandName: "cooldown-test",
    });

    slashCommands.set("cooldown-test", {
      data: { name: "cooldown-test" },
      cooldown: 10,
      execute: vi.fn().mockResolvedValue(undefined),
    } as const);

    (isOnCoolDown as unknown as ReturnType<typeof vi.fn>).mockReturnValue(5);

    const handler = getRegisteredInteractionHandler(client);
    await handler(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(
          "Please wait 5 more second(s) before reusing the `cooldown-test` command.",
        ),
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  it("should execute registered command when not on cooldown", async () => {
    const client = createMockClient();
    const execute = vi.fn().mockResolvedValue(undefined);
    const interaction = createMockInteraction({
      commandName: "execute-test",
    });

    slashCommands.set("execute-test", {
      data: { name: "execute-test" },
      cooldown: 5,
      execute,
    } as const);

    (isOnCoolDown as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const handler = getRegisteredInteractionHandler(client);
    await handler(interaction);

    expect(execute).toHaveBeenCalledWith(interaction);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("should reply with an execution error when command.execute throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const client = createMockClient();
    const execute = vi.fn().mockRejectedValue(new Error("boom"));
    const interaction = createMockInteraction({
      commandName: "error-test",
    });

    slashCommands.set("error-test", {
      data: { name: "error-test" },
      execute,
    } as const);

    (isOnCoolDown as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const handler = getRegisteredInteractionHandler(client);
    await handler(interaction);

    expect(consoleSpy).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "There was an error executing that command.",
        flags: MessageFlags.Ephemeral,
      }),
    );

    consoleSpy.mockRestore();
  });
});
