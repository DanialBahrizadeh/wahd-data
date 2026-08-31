import scrape from "./scrape";
import redisStore from "./db/redis";
import { env } from "./config/env";
import {
  acquireBuildLock,
  releaseBuildLock,
  setCache,
  markCacheFresh,
} from "./cache";
import faculties, { getFacultyCacheId } from "./utils/faculties.util";

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

    for (const facultyId of faculties) {
      const lessons = data[String(facultyId)] ?? [];

      await setCache(
        redisStore,
        getFacultyCacheId(facultyId, gender),
        JSON.stringify(lessons),
      );
    }

    await markCacheFresh(redisStore, gender);

    return "built";
  } finally {
    await releaseBuildLock(redisStore, gender);
  }
}
