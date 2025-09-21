import MemoryStore from "../models/store";

class Memory implements MemoryStore {
  public name: string = "memory";
  private map: Map<string, string>;

  constructor() {
    this.map = new Map();
  }

  async get(key: string): Promise<string | null> {
    return this.map.get(key) || null;
  }

  async set(key: string, value: string, _options?: any): Promise<boolean> {
    this.map.set(key, value);
    return true;
  }

  async delete(key: string): Promise<boolean> {
    this.map.delete(key);
    return true;
  }
}

const memoryStore = new Memory();

export default memoryStore;
