import dotenv from "dotenv";

dotenv.config({ override: true });
export const env = {
  DEBUG_MODE: process.env.DEBUG_MODE ?? 0,
  USERNAME: process.env.USERNAME ?? "faild",
  PASSWORD: process.env.PASSWORD ?? "faild",
  REDIS_URL: process.env.REDIS_URL ?? "",
  ADMIN_SECRET: process.env.ADMIN_SECRET ?? ""
};
