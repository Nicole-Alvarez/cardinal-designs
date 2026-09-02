import prisma from "../prisma";

export const USER_CONFIGURATION_DEFAULTS = { templateLimit: 5, canvasLimitPerTemplate: 2, canUseGenerateAI: false, metadataEnabled: true, canDownloadAssets: false } as const;

export class UserConfigurationError extends Error {
  constructor(message: string, public statusCode = 400, public code = "INVALID_CONFIGURATION") { super(message); }
}

export interface UserConfigurationUpdate {
  templateLimit?: number;
  canvasLimitPerTemplate?: number;
  canUseGenerateAI?: boolean;
  metadataEnabled?: boolean;
  canDownloadAssets?: boolean;
}

export async function getUserConfiguration(userId: string) {
  return prisma.userConfiguration.upsert({ where: { userId }, create: { userId, ...USER_CONFIGURATION_DEFAULTS }, update: {} });
}

function integer(value: unknown, name: string, maximum: number) {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > maximum) throw new UserConfigurationError(`${name} must be an integer from 0 to ${maximum}`);
  return value as number;
}

export async function updateUserConfiguration(userId: string, version: unknown, input: UserConfigurationUpdate) {
  if (!Number.isInteger(version) || (version as number) < 1) throw new UserConfigurationError("Configuration version is required");
  const data: Record<string, boolean | number> = {};
  if (input.templateLimit !== undefined) data.templateLimit = integer(input.templateLimit, "Template limit", 1000);
  if (input.canvasLimitPerTemplate !== undefined) data.canvasLimitPerTemplate = integer(input.canvasLimitPerTemplate, "Canvas limit", 100);
  for (const key of ["canUseGenerateAI", "metadataEnabled", "canDownloadAssets"] as const) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== "boolean") throw new UserConfigurationError(`${key} must be a boolean`);
      data[key] = input[key];
    }
  }
  if (!Object.keys(data).length) throw new UserConfigurationError("At least one configuration value is required");
  const result = await prisma.userConfiguration.updateMany({ where: { userId, version: version as number }, data: { ...data, version: { increment: 1 } } });
  if (result.count !== 1) throw new UserConfigurationError("Configuration changed before it could be saved. Refresh and try again.", 409, "STALE_CONFIGURATION");
  return getUserConfiguration(userId);
}

export async function requireUserFeature(userId: string, feature: "canUseGenerateAI" | "metadataEnabled" | "canDownloadAssets") {
  const configuration = await getUserConfiguration(userId);
  if (!configuration[feature]) throw new UserConfigurationError("This feature is disabled for your account", 403, "FEATURE_DISABLED");
  return configuration;
}
