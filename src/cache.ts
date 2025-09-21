import MemoryStore from "./models/store";

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
  // I know this doesn't work for all store
  await store.set(`cache-${collegeId}`, value, {
    EX: 3 * 60 * 60,
  });
  return true;
}

