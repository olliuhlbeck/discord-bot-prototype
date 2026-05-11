import fs from "fs";
import path from "path";
import type { WarningData, WarningEntry } from "../types/Warning.js";

const warningsPath = path.join(process.cwd(), "warnings.json");

function readWarnings(): WarningData {
  if (!fs.existsSync(warningsPath)) {
    fs.writeFileSync(warningsPath, "{}");
  }

  try {
    const data = fs.readFileSync(warningsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading warnings file:", error);
    return {};
  }
}

function saveWarnings(data: WarningData) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

export function addWarning(userId: string, warning: WarningEntry) {
  const warnings = readWarnings();

  if (!warnings[userId]) {
    warnings[userId] = [];
  }

  warnings[userId].push(warning);

  saveWarnings(warnings);
}

export function getWarnings(userId: string): WarningEntry[] {
  const warnings = readWarnings();

  return warnings[userId] || [];
}

export function clearWarnings(userId: string) {
  const warnings = readWarnings();

  delete warnings[userId];

  saveWarnings(warnings);
}
