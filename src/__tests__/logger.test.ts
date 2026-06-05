import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ChatInputCommandInteraction } from "discord.js";

const originalLogChannel = process.env.LOG_CHANNEL;

const loadLogger = async () => {
  vi.resetModules();
  return (await import("../utils/logger.js")).logAction;
};

describe("logAction", () => {
  beforeEach(() => {
    process.env.LOG_CHANNEL = "log-channel-123";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.LOG_CHANNEL = originalLogChannel;
    vi.restoreAllMocks();
  });

  it("does nothing when interaction.guild is missing", async () => {
    const logAction = await loadLogger();
    const mockInteraction = {
      guild: null,
      user: { id: "user-1", tag: "User#0001" },
      channel: "#general",
    } as unknown as ChatInputCommandInteraction;

    await expect(
      logAction(mockInteraction, "Test", "Description"),
    ).resolves.toBeUndefined();
  });

  it("does nothing when LOG_CHANNEL is not configured", async () => {
    process.env.LOG_CHANNEL = "";
    const logAction = await loadLogger();
    const mockFetch = vi.fn();
    const mockInteraction = {
      guild: { channels: { fetch: mockFetch } },
      user: { id: "user-2", tag: "User#0002" },
      channel: "#random",
    } as unknown as ChatInputCommandInteraction;

    await expect(
      logAction(mockInteraction, "Test", "Description"),
    ).resolves.toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does nothing when the log channel cannot be fetched", async () => {
    const logAction = await loadLogger();
    const mockFetch = vi.fn().mockResolvedValue(null);
    const mockInteraction = {
      guild: { channels: { fetch: mockFetch } },
      user: { id: "user-3", tag: "User#0003" },
      channel: "#help",
    } as unknown as ChatInputCommandInteraction;

    await expect(
      logAction(mockInteraction, "Test", "Description"),
    ).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith("log-channel-123");
  });

  it("does nothing when the fetched channel is not text-based", async () => {
    const logAction = await loadLogger();
    const mockSend = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      isTextBased: () => false,
      send: mockSend,
    });
    const mockInteraction = {
      guild: { channels: { fetch: mockFetch } },
      user: { id: "user-4", tag: "User#0004" },
      channel: "#voice",
    } as unknown as ChatInputCommandInteraction;

    await expect(
      logAction(mockInteraction, "Test", "Description"),
    ).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends an embed to the log channel when available", async () => {
    const logAction = await loadLogger();
    const mockSend = vi.fn().mockResolvedValue(undefined);
    const mockFetch = vi.fn().mockResolvedValue({
      isTextBased: () => true,
      send: mockSend,
    });
    const mockInteraction = {
      guild: { channels: { fetch: mockFetch } },
      user: { id: "user-5", tag: "LoggerMod#0005" },
      channel: "#general",
    } as unknown as ChatInputCommandInteraction;

    await logAction(mockInteraction, "Action Title", "Action description");

    expect(mockFetch).toHaveBeenCalledWith("log-channel-123");
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArgs = mockSend.mock.calls[0]![0];
    expect(sendArgs).toHaveProperty("embeds");
    expect(sendArgs.embeds[0].data).toMatchObject({
      title: "Action Title",
      description: "Action description",
    });
  });

  it("logs an error and returns when fetching the channel throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const logAction = await loadLogger();
    const mockFetch = vi.fn().mockRejectedValue(new Error("fetch failure"));
    const mockInteraction = {
      guild: { channels: { fetch: mockFetch } },
      user: { id: "user-6", tag: "LoggerMod#0006" },
      channel: "#general",
    } as unknown as ChatInputCommandInteraction;

    await expect(
      logAction(mockInteraction, "Action Title", "Action description"),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to fetch log channel:",
      expect.any(Error),
    );
  });
});
