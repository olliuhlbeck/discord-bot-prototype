const cooldowns = new Map<string, Map<string, number>>();

export function isOnCoolDown(
  commandName: string,
  userId: string,
  cooldownSeconds: number,
): number | null {
  const now = Date.now();

  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }

  const userCooldowns = cooldowns.get(commandName)!;

  const expiration = userCooldowns.get(userId);

  if (expiration && now < expiration) {
    return Math.ceil((expiration - now) / 1000);
  }

  userCooldowns.set(userId, now + cooldownSeconds * 1000);

  return null;
}
