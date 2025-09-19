import { createClient, RedisClientType } from "redis";
import MemoryStore from "./store";

class Memory implements MemoryStore {

    public name: string = "memory";
    private map: Map<string, string>;

    constructor() {        
        this.map = new Map();
    };

    async get(key: string): Promise<string | null> {
        const result = this.map.get(key);
        if(!result) {
            return null;
        } 
        return result;
    }

    async set(key: string, value: string, options?: any): Promise<boolean> {
        this.map.set(key, value);
        return true;
    };

    async delete(key: string): Promise<boolean> {
        return true
    }

}

const memoryStore = new Memory();

export default memoryStore;