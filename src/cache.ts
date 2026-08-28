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
  await store.set(`cache-${collegeId}`, value, {
    EX: 3 * 60 * 60,
  });

  return true;
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
