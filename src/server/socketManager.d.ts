import { Server } from 'socket.io';
import { GameRoom } from './types';
export declare class SocketManager {
    private io;
    private fallbackRooms;
    private playerSessions;
    constructor(io: Server);
    private setupEventHandlers;
    private setupRoomHandlers;
    private setupGameHandlers;
    private setupChatHandlers;
    private sendSystemMessage;
    private setupDisconnectHandler;
    private checkRateLimit;
    private generateRoomId;
    getActiveRooms(): Map<string, GameRoom>;
    getRedisStats(): Promise<{
        roomsCreated: number;
        playersJoined: number;
        gamesStarted: number;
        gamesCompleted: number;
        rematchesRequested: number;
    } | null>;
}
