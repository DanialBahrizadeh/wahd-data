import dotenv from "dotenv";

dotenv.config({ override: true });

const readNumber = (value: string | undefined, fallback: number) => {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  DEBUG_MODE: Boolean(process.env.DEBUG_MODE) ?? 0,
  USERNAME: process.env.USERNAME ?? "faild",
  PASSWORD: process.env.PASSWORD ?? "faild",
  USERNAME_GIRL: process.env.USERNAME_GIRL ?? "",
  PASSWORD_GIRL: process.env.PASSWORD_GIRL ?? "",
  REDIS_URL: process.env.REDIS_URL ?? "",
  ADMIN_SECRET: process.env.ADMIN_SECRET ?? "",
  CHROME_EXECUTABLE_PATH: process.env.CHROME_EXECUTABLE_PATH ?? "",
  DATA_CACHE_TTL: readNumber(process.env.DATA_CACHE_TTL, 24 * 60 * 60),
  FRESH_CACHE_TTL: readNumber(process.env.FRESH_CACHE_TTL, 60 * 60),
};
