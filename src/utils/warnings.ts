import fs from "fs/promises";
import path from "path";
import type { WarningData, WarningEntry } from "../types/Warning.js";

const warningsPath = path.join(process.cwd(), "data", "warnings.json");

// Serialize all writes to prevent race conditions since using JSON database.
let writeQueue: Promise<void> = Promise.resolve();

async function readWarnings(): Promise<WarningData> {
  try {
    const data = await fs.readFile(warningsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading warnings file:", error);
    return {};
  }
}

async function saveWarnings(data: WarningData): Promise<void> {
  await fs.mkdir(path.dirname(warningsPath), { recursive: true });
  await fs.writeFile(warningsPath, JSON.stringify(data, null, 2));
}

function enqueueWrite(task: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(task).catch(console.error);
  return writeQueue;
}

export async function addWarning(
  userId: string,
  warning: WarningEntry,
): Promise<void> {
  return enqueueWrite(async () => {
    const warnings = await readWarnings();
    warnings[userId] ??= [];
    warnings[userId].push(warning);
    await saveWarnings(warnings);
  });
}

export async function getWarnings(userId: string): Promise<WarningEntry[]> {
  const warnings = await readWarnings();

  return warnings[userId] ?? [];
}

export async function clearWarnings(userId: string): Promise<void> {
  return enqueueWrite(async () => {
    const warnings = await readWarnings();
    delete warnings[userId];
    await saveWarnings(warnings);
  });
}
