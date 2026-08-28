import scrape from "./scrape";
import redisStore from "./db/redis";
import { env } from "./config/env";
import { acquireBuildLock, releaseBuildLock, setCache } from "./cache";
import faculties from "./utils/faculties.util";

export async function buildCache(gender: number): Promise<"built" | "busy"> {
  const acquired = await acquireBuildLock(redisStore, gender);

  if (!acquired) {
    return "busy";
  }

  try {
    const isMan = gender === 1;

    const data = isMan
      ? await scrape(env.USERNAME, env.PASSWORD)
      : await scrape(env.USERNAME_GIRL, env.PASSWORD_GIRL);

    const prefix = isMan ? "man" : "woman";

    for (const facultyId of faculties) {
      const lessons = data[String(facultyId)] ?? [];

      await setCache(
        redisStore,
        `${prefix}-${facultyId}`,
        JSON.stringify(lessons),
      );
    }

    return "built";
  } finally {
    await releaseBuildLock(redisStore, gender);
  }
}
