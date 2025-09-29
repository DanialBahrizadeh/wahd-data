import dotenv from "dotenv";

dotenv.config({ override: true });
export const env = {
  DEBUG_MODE: Boolean(process.env.DEBUG_MODE) ?? 0,
  USERNAME: process.env.USERNAME ?? "faild",
  PASSWORD: process.env.PASSWORD ?? "faild",
  USERNAME_GIRL: process.env.USERNAME_GIRL ?? "",
  PASSWORD_GIRL: process.env.PASSWORD_GIRL ?? "",
  REDIS_URL: process.env.REDIS_URL ?? "",
  ADMIN_SECRET: process.env.ADMIN_SECRET ?? ""
};
