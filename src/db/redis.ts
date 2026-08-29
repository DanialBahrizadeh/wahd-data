import { createClient, RedisClientType } from "redis";

import MemoryStore from "../types/store";
import { env } from "../config/env";

class Redis implements MemoryStore {
  public name = "redis";

  private client: RedisClientType;
  private connecting: Promise<void> | null = null;

  constructor(url: string) {
    this.client = createClient({
      url,
    });

    this.client.on("error", (error) => {
      console.error("Redis client error", error);
    });
  }

  private async ensureConnected() {
    if (this.client.isOpen) {
      return;
    }

    if (!this.connecting) {
      this.connecting = this.client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connecting = null;
        });
    }

    await this.connecting;
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnected();

    return await this.client.get(key);
  }

  async set(key: string, value: string, options?: any): Promise<boolean> {
    await this.ensureConnected();

    const result = await this.client.set(key, value, options);

    return result === "OK";
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureConnected();

    await this.client.del(key);

    return true;
  }
}

const redisStore = new Redis(env.REDIS_URL);

export default redisStore;
