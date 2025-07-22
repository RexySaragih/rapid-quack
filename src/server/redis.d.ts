import { GameRoom } from './types';
export declare class RedisService {
    private static instance;
    private client;
    private isConnected;
    private cache;
    private constructor();
    static getInstance(): RedisService;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isRedisConnected(): boolean;
    private getCached;
    private setCached;
    saveRoom(room: GameRoom, ttl?: number): Promise<void>;
    getRoom(roomId: string): Promise<GameRoom | null>;
    deleteRoom(roomId: string): Promise<void>;
    getAllRooms(): Promise<string[]>;
    savePlayerSession(playerId: string, sessionData: any, ttl?: number): Promise<void>;
    getPlayerSession(playerId: string): Promise<any | null>;
    deletePlayerSession(playerId: string): Promise<void>;
    updatePlayerScore(playerId: string, score: number): Promise<void>;
    getTopPlayers(limit?: number): Promise<Array<{
        playerId: string;
        score: number;
    }>>;
    checkRateLimit(key: string, limit: number, window: number): Promise<boolean>;
    saveChatMessage(roomId: string, message: any): Promise<void>;
    getChatHistory(roomId: string, limit?: number): Promise<any[]>;
    incrementGameStats(stat: string, value?: number): Promise<void>;
    getGameStats(stat: string): Promise<number>;
    getAllGameStats(): Promise<Record<string, number>>;
    ping(): Promise<string>;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    getPerformanceMetrics(): Promise<{
        cacheSize: number;
        cacheHitRate: number;
        redisConnected: boolean;
        memoryUsage: any;
    }>;
}
export declare const redisService: RedisService;
