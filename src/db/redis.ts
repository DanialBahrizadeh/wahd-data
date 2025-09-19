import { createClient, RedisClientType } from "redis";
import MemoryStore from "./store";

class Redis implements MemoryStore {

    public name: string = "redis";
    private client: RedisClientType;

    constructor(url: string) {
        
        this.client = createClient({
            url
        });

        this.client.on('error', error => {
            console.error("Redis client error", error);
        })

        this.client.on('connection', (stream) => {
            console.log("a connection was made");
        })

    };

    async connect() {
        await this.client.connect();
    }

    async get(key: string): Promise<string | null> {
        const result = await this.client.get(key);
        return result;
    }

    async set(key: string, value: string, options?: any): Promise<boolean> {
        await this.client.set(key, value , options);
        return true;
    };

    async delete(key: string): Promise<boolean> {
        return true
    }

}

const redisStore = new Redis(process.env.REDIS_URL!);

(async () => {
    await redisStore.connect();
})();

export default redisStore;