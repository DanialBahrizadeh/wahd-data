import { env } from "./config/env";
import MemoryStore from "./types/store";

export async function getCache(
  store: MemoryStore,
  collegeId: string,
): Promise<string | null> {
  return await store.get(`cache-${collegeId}`);
}

export async function setCache(
  store: MemoryStore,
  collegeId: string,
  value: string,
): Promise<boolean> {
  return await store.set(`cache-${collegeId}`, value, {
    EX: env.DATA_CACHE_TTL,
  });
}

export async function isCacheFresh(
  store: MemoryStore,
  gender: number,
): Promise<boolean> {
  const value = await store.get(`cache-fresh-${gender}`);

  return value !== null;
}

export async function markCacheFresh(
  store: MemoryStore,
  gender: number,
): Promise<void> {
  await store.set(`cache-fresh-${gender}`, "1", {
    EX: env.FRESH_CACHE_TTL,
  });
}

export async function acquireBuildLock(
  store: MemoryStore,
  gender: number,
): Promise<boolean> {
  return await store.set(`build-lock-${gender}`, "1", {
    NX: true,
    EX: 15 * 60,
  });
}

export async function releaseBuildLock(
  store: MemoryStore,
  gender: number,
): Promise<void> {
  await store.delete(`build-lock-${gender}`);
}
