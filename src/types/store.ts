export default interface MemoryStore {
    // select(index: number): 
    name: string;
    get(key: string): Promise<string| null>;
    set(key: string, value: string, options? : any): Promise<boolean>;
    delete(key: string): Promise<boolean>;
}