var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { redisService } from './redis';
import { SocketManager } from './socketManager';
var app = express();
var httpServer = createServer(app);
var io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    path: '/socket.io',
});
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
var PORT = process.env.PORT || 3001;
// Initialize Redis connection
function initializeRedis() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, redisService.connect()];
                case 1:
                    _a.sent();
                    console.log('✅ Redis connected successfully');
                    console.log('🚀 Performance features enabled:');
                    console.log('   - Data persistence across server restarts');
                    console.log('   - Real-time leaderboards');
                    console.log('   - Rate limiting and abuse prevention');
                    console.log('   - Chat message history');
                    console.log('   - Game statistics and analytics');
                    console.log('   - Optimized room management');
                    console.log('   - Session recovery and caching');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.log('⚠️  Redis connection failed, using in-memory storage');
                    console.log('   - Rooms will be lost on server restart');
                    console.log('   - No leaderboards or analytics');
                    console.log('   - No rate limiting');
                    console.log('   - No chat history');
                    console.log('');
                    console.log('💡 To enable Redis features:');
                    console.log('   - Install Redis: brew install redis');
                    console.log('   - Start Redis: brew services start redis');
                    console.log('   - Or download from: https://redis.io/download');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Initialize socket manager
var socketManager;
// Health check endpoint with enhanced monitoring
app.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var redisStatus, redisPing, _a, _b, _c, _d;
    var _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                redisStatus = redisService.isRedisConnected();
                if (!redisStatus) return [3 /*break*/, 2];
                return [4 /*yield*/, redisService.ping()];
            case 1:
                _a = _f.sent();
                return [3 /*break*/, 3];
            case 2:
                _a = 'disconnected';
                _f.label = 3;
            case 3:
                redisPing = _a;
                _c = (_b = res).json;
                _e = {
                    status: 'ok',
                    redis: {
                        connected: redisStatus,
                        ping: redisPing,
                    },
                    activeConnections: io.engine.clientsCount
                };
                if (!redisStatus) return [3 /*break*/, 5];
                return [4 /*yield*/, redisService.getAllRooms()];
            case 4:
                _d = (_f.sent()).length;
                return [3 /*break*/, 6];
            case 5:
                _d = (socketManager === null || socketManager === void 0 ? void 0 : socketManager.getActiveRooms().size) || 0;
                _f.label = 6;
            case 6:
                _c.apply(_b, [(_e.activeRooms = _d,
                        _e.uptime = process.uptime(),
                        _e.memory = process.memoryUsage(),
                        _e)]);
                return [2 /*return*/];
        }
    });
}); });
// Enhanced leaderboard endpoint
app.get('/leaderboard', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var topPlayers, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                return [4 /*yield*/, redisService.getTopPlayers(10)];
            case 1:
                topPlayers = _a.sent();
                res.json({
                    leaderboard: topPlayers,
                    timestamp: Date.now(),
                });
                return [3 /*break*/, 3];
            case 2:
                res.json({
                    leaderboard: [],
                    message: 'Redis not available',
                    timestamp: Date.now(),
                });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch leaderboard' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Enhanced game statistics endpoint
app.get('/stats', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stats, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                return [4 /*yield*/, (socketManager === null || socketManager === void 0 ? void 0 : socketManager.getRedisStats())];
            case 1:
                stats = _a.sent();
                res.json(__assign(__assign({}, stats), { timestamp: Date.now(), serverUptime: process.uptime() }));
                return [3 /*break*/, 3];
            case 2:
                res.json({
                    message: 'Redis not available',
                    timestamp: Date.now(),
                    serverUptime: process.uptime(),
                });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch statistics' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// New endpoint: Room information
app.get('/rooms', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var roomIds, rooms, _i, roomIds_1, roomId, room, fallbackRooms, rooms, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                if (!redisService.isRedisConnected()) return [3 /*break*/, 6];
                return [4 /*yield*/, redisService.getAllRooms()];
            case 1:
                roomIds = _a.sent();
                rooms = [];
                _i = 0, roomIds_1 = roomIds;
                _a.label = 2;
            case 2:
                if (!(_i < roomIds_1.length)) return [3 /*break*/, 5];
                roomId = roomIds_1[_i];
                return [4 /*yield*/, redisService.getRoom(roomId)];
            case 3:
                room = _a.sent();
                if (room) {
                    rooms.push({
                        id: room.id,
                        playerCount: room.players.length,
                        isStarted: room.isStarted,
                        difficulty: room.difficulty,
                        gameDuration: room.gameDuration,
                    });
                }
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                res.json({ rooms: rooms, count: rooms.length });
                return [3 /*break*/, 7];
            case 6:
                fallbackRooms = socketManager === null || socketManager === void 0 ? void 0 : socketManager.getActiveRooms();
                rooms = Array.from((fallbackRooms === null || fallbackRooms === void 0 ? void 0 : fallbackRooms.values()) || []).map(function (room) { return ({
                    id: room.id,
                    playerCount: room.players.length,
                    isStarted: room.isStarted,
                    difficulty: room.difficulty,
                    gameDuration: room.gameDuration,
                }); });
                res.json({ rooms: rooms, count: rooms.length });
                _a.label = 7;
            case 7: return [3 /*break*/, 9];
            case 8:
                error_4 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch rooms' });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// New endpoint: Player session recovery
app.get('/session/:playerId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var playerId, session, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                playerId = req.params.playerId;
                if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                return [4 /*yield*/, redisService.getPlayerSession(playerId)];
            case 1:
                session = _a.sent();
                if (session) {
                    res.json({ session: session, found: true });
                }
                else {
                    res.json({ session: null, found: false });
                }
                return [3 /*break*/, 3];
            case 2:
                res.json({ session: null, found: false, message: 'Redis not available' });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch session' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// New endpoint: Chat history for a room
app.get('/chat/:roomId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var roomId, limit, history_1, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                roomId = req.params.roomId;
                limit = parseInt(req.query.limit) || 50;
                if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                return [4 /*yield*/, redisService.getChatHistory(roomId, limit)];
            case 1:
                history_1 = _a.sent();
                res.json({ history: history_1, count: history_1.length });
                return [3 /*break*/, 3];
            case 2:
                res.json({ history: [], count: 0, message: 'Redis not available' });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch chat history' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Performance monitoring endpoint
app.get('/performance', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var memoryUsage, cpuUsage;
    return __generator(this, function (_a) {
        try {
            memoryUsage = process.memoryUsage();
            cpuUsage = process.cpuUsage();
            res.json({
                memory: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external,
                },
                cpu: cpuUsage,
                uptime: process.uptime(),
                activeConnections: io.engine.clientsCount,
                redisConnected: redisService.isRedisConnected(),
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch performance data' });
        }
        return [2 /*return*/];
    });
}); });
// Initialize Redis and start server
initializeRedis()
    .then(function () {
    // Initialize socket manager after Redis
    socketManager = new SocketManager(io);
    httpServer.listen(PORT, function () {
        console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
        console.log("\uD83D\uDCCA Health check: http://localhost:".concat(PORT, "/health"));
        console.log("\uD83C\uDFC6 Leaderboard: http://localhost:".concat(PORT, "/leaderboard"));
        console.log("\uD83D\uDCC8 Statistics: http://localhost:".concat(PORT, "/stats"));
        console.log("\uD83C\uDFE0 Rooms: http://localhost:".concat(PORT, "/rooms"));
        console.log("\uD83D\uDCAC Chat History: http://localhost:".concat(PORT, "/chat/:roomId"));
        console.log("\u26A1 Performance: http://localhost:".concat(PORT, "/performance"));
    });
})
    .catch(function (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Shutting down gracefully...');
                return [4 /*yield*/, redisService.disconnect()];
            case 1:
                _a.sent();
                httpServer.close(function () {
                    console.log('Server closed');
                    process.exit(0);
                });
                return [2 /*return*/];
        }
    });
}); });
// Handle uncaught exceptions
process.on('uncaughtException', function (error) {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', function (reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
