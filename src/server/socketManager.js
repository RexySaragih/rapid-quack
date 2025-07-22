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
import { redisService } from './redis';
var SocketManager = /** @class */ (function () {
    function SocketManager(io) {
        this.fallbackRooms = new Map();
        this.playerSessions = new Map();
        this.io = io;
        this.setupEventHandlers();
    }
    SocketManager.prototype.setupEventHandlers = function () {
        var _this = this;
        this.io.on('connection', function (socket) {
            console.log('Client connected:', socket.id);
            // Setup individual socket event handlers
            _this.setupRoomHandlers(socket);
            _this.setupGameHandlers(socket);
            _this.setupChatHandlers(socket);
            _this.setupDisconnectHandler(socket);
        });
    };
    SocketManager.prototype.setupRoomHandlers = function (socket) {
        var _this = this;
        // Room creation with Redis optimization
        socket.on('room:create', function (playerData) { return __awaiter(_this, void 0, void 0, function () {
            var roomId, newPlayer, room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkRateLimit(socket, 'create_room')];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        roomId = this.generateRoomId();
                        newPlayer = {
                            id: socket.id,
                            name: {
                                playerName: playerData.playerName,
                                difficulty: playerData.difficulty,
                                gameDuration: playerData.gameDuration,
                            },
                            isReady: false,
                            score: 0,
                        };
                        room = {
                            id: roomId,
                            players: [newPlayer],
                            difficulty: playerData.difficulty,
                            isStarted: false,
                            gameDuration: playerData.gameDuration,
                        };
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 5];
                        return [4 /*yield*/, redisService.saveRoom(room, 7200)]; // 2 hours for active rooms
                    case 2:
                        _a.sent(); // 2 hours for active rooms
                        return [4 /*yield*/, redisService.savePlayerSession(socket.id, {
                                roomId: roomId,
                                playerName: playerData.playerName,
                                joinedAt: Date.now(),
                                difficulty: playerData.difficulty,
                                gameDuration: playerData.gameDuration,
                            })
                            // Track analytics
                        ];
                    case 3:
                        _a.sent();
                        // Track analytics
                        return [4 /*yield*/, redisService.incrementGameStats('rooms_created')];
                    case 4:
                        // Track analytics
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 6;
                    case 6:
                        socket.join(roomId);
                        socket.emit('room:created', room);
                        console.log("Room created: ".concat(roomId, " by ").concat(playerData.playerName));
                        return [2 /*return*/];
                }
            });
        }); });
        // Room joining with session recovery
        socket.on('room:join', function (roomId, playerName) { return __awaiter(_this, void 0, void 0, function () {
            var room, existingPlayer, newPlayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkRateLimit(socket, 'join_room')];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 3];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 2:
                        room = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 4;
                    case 4:
                        if (!room) {
                            socket.emit('error', { message: 'Room not found' });
                            return [2 /*return*/];
                        }
                        existingPlayer = room.players.find(function (p) { return p.id === socket.id; });
                        if (existingPlayer) {
                            socket.emit('room:joined', room);
                            return [2 /*return*/];
                        }
                        newPlayer = {
                            id: socket.id,
                            name: {
                                playerName: playerName,
                                difficulty: room.difficulty,
                                gameDuration: room.gameDuration || 120,
                            },
                            isReady: false,
                            score: 0,
                        };
                        room.players.push(newPlayer);
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 8];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, redisService.savePlayerSession(socket.id, {
                                roomId: roomId,
                                playerName: playerName,
                                joinedAt: Date.now(),
                            })];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, redisService.incrementGameStats('players_joined')];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 9;
                    case 9:
                        socket.join(roomId);
                        this.io.to(roomId).emit('room:joined', room);
                        this.io.to(roomId).emit('room:updated', room);
                        // Send system message about player joining
                        this.sendSystemMessage(roomId, "".concat(playerName, " joined the room"));
                        console.log("".concat(playerName, " joined room: ").concat(roomId));
                        return [2 /*return*/];
                }
            });
        }); });
        // Room data request with caching
        socket.on('room:request', function (roomId) { return __awaiter(_this, void 0, void 0, function () {
            var room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room) {
                            socket.emit('error', { message: 'Room not found' });
                            return [2 /*return*/];
                        }
                        socket.emit('room:updated', room);
                        return [2 /*return*/];
                }
            });
        }); });
        // Player ready with game start optimization
        socket.on('player:ready', function (roomId) { return __awaiter(_this, void 0, void 0, function () {
            var room, player, allReady;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room)
                            return [2 /*return*/];
                        player = room.players.find(function (p) { return p.id === socket.id; });
                        if (!player)
                            return [2 /*return*/];
                        player.isReady = true;
                        player.isGameOver = false;
                        player.isRematchReady = false;
                        allReady = room.players.every(function (p) { return p.isReady; });
                        if (!(allReady && room.players.length >= 2)) return [3 /*break*/, 8];
                        room.isStarted = true;
                        room.players.forEach(function (p) {
                            p.isGameOver = false;
                            p.isRematchReady = false;
                        });
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 6];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, redisService.incrementGameStats('games_started')];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 7;
                    case 7:
                        this.io.to(roomId).emit('game:start', room);
                        console.log("Game started in room: ".concat(roomId));
                        return [3 /*break*/, 12];
                    case 8:
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 10];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 11;
                    case 11:
                        this.io.to(roomId).emit('room:updated', room);
                        _a.label = 12;
                    case 12: return [2 /*return*/];
                }
            });
        }); });
    };
    SocketManager.prototype.setupGameHandlers = function (socket) {
        var _this = this;
        // Score updates with leaderboard integration
        socket.on('player:score', function (roomId, score) { return __awaiter(_this, void 0, void 0, function () {
            var room, player;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room)
                            return [2 /*return*/];
                        player = room.players.find(function (p) { return p.id === socket.id; });
                        if (!player)
                            return [2 /*return*/];
                        player.score = score;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 5];
                        return [4 /*yield*/, redisService.updatePlayerScore(socket.id, score)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 7];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 8;
                    case 8:
                        this.io.to(roomId).emit('player:score', socket.id, score);
                        return [2 /*return*/];
                }
            });
        }); });
        // Game over with statistics tracking
        socket.on('player:gameover', function (roomId) { return __awaiter(_this, void 0, void 0, function () {
            var room, player, allGameOver;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room)
                            return [2 /*return*/];
                        player = room.players.find(function (p) { return p.id === socket.id; });
                        if (!player)
                            return [2 /*return*/];
                        player.isGameOver = true;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 5];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 6;
                    case 6:
                        allGameOver = room.players.every(function (p) { return p.isGameOver; });
                        if (!allGameOver) return [3 /*break*/, 8];
                        this.io.to(roomId).emit('room:gameover', room);
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 8];
                        return [4 /*yield*/, redisService.incrementGameStats('games_completed')];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        }); });
        // Rematch with state management
        socket.on('rematch:request', function (roomId) { return __awaiter(_this, void 0, void 0, function () {
            var room, player, allRematchReady;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room)
                            return [2 /*return*/];
                        player = room.players.find(function (p) { return p.id === socket.id; });
                        if (!player)
                            return [2 /*return*/];
                        player.isRematchReady = true;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 5];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 6;
                    case 6:
                        this.io.to(roomId).emit('rematch:status', room);
                        allRematchReady = room.players.length > 1 && room.players.every(function (p) { return p.isRematchReady; });
                        if (!allRematchReady) return [3 /*break*/, 11];
                        // Reset game state for rematch
                        room.players.forEach(function (p) {
                            p.isReady = false;
                            p.isGameOver = false;
                            p.isRematchReady = false;
                            p.score = 0;
                        });
                        room.isStarted = false;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 9];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, redisService.incrementGameStats('rematches_requested')];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        this.fallbackRooms.set(roomId, room);
                        _a.label = 10;
                    case 10:
                        this.io.to(roomId).emit('rematch:start');
                        this.io.to(roomId).emit('room:updated', room);
                        _a.label = 11;
                    case 11: return [2 /*return*/];
                }
            });
        }); });
        // Game synchronization with Redis caching
        socket.on('duck:spawn', function (roomId, duckData) { return __awaiter(_this, void 0, void 0, function () {
            var room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room || !room.isStarted)
                            return [2 /*return*/];
                        // Broadcast duck spawn to other players in the room
                        socket.to(roomId).emit('duck:spawn', duckData);
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on('duck:hit', function (roomId, duckId) { return __awaiter(_this, void 0, void 0, function () {
            var room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room || !room.isStarted)
                            return [2 /*return*/];
                        // Broadcast duck hit to other players in the room
                        socket.to(roomId).emit('duck:hit', duckId);
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on('effect:trigger', function (roomId, effectData) { return __awaiter(_this, void 0, void 0, function () {
            var room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 1:
                        room = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 3;
                    case 3:
                        if (!room || !room.isStarted)
                            return [2 /*return*/];
                        // Broadcast effect to other players in the room
                        socket.to(roomId).emit('effect:trigger', effectData);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    SocketManager.prototype.setupChatHandlers = function (socket) {
        var _this = this;
        // Chat with Redis persistence and history
        socket.on('chat:message', function (roomId, messageData) { return __awaiter(_this, void 0, void 0, function () {
            var room, enhancedMessageData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 3];
                        return [4 /*yield*/, redisService.getRoom(roomId)
                            // Save chat message to Redis for history
                        ];
                    case 1:
                        room = _a.sent();
                        // Save chat message to Redis for history
                        return [4 /*yield*/, redisService.saveChatMessage(roomId, messageData)];
                    case 2:
                        // Save chat message to Redis for history
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        room = this.fallbackRooms.get(roomId) || null;
                        _a.label = 4;
                    case 4:
                        if (!room) {
                            console.log('Room not found for chat message:', roomId);
                            return [2 /*return*/];
                        }
                        enhancedMessageData = __assign(__assign({}, messageData), { timestamp: messageData.timestamp || Date.now() });
                        // Broadcast chat message to all players in the room
                        this.io.to(roomId).emit('chat:message', enhancedMessageData);
                        return [2 /*return*/];
                }
            });
        }); });
        // Chat history request
        socket.on('chat:history', function (roomId) { return __awaiter(_this, void 0, void 0, function () {
            var history_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.getChatHistory(roomId, 50)];
                    case 1:
                        history_1 = _a.sent();
                        socket.emit('chat:history', history_1);
                        return [3 /*break*/, 3];
                    case 2:
                        socket.emit('chat:history', []);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    // Helper method to send system messages
    SocketManager.prototype.sendSystemMessage = function (roomId, message) {
        var systemMessage = {
            playerName: 'System',
            message: message,
            timestamp: Date.now(),
        };
        // Save system message to Redis if available
        if (redisService.isRedisConnected()) {
            redisService.saveChatMessage(roomId, systemMessage).catch(console.error);
        }
        // Broadcast to all players in the room
        this.io.to(roomId).emit('chat:message', systemMessage);
    };
    SocketManager.prototype.setupDisconnectHandler = function (socket) {
        var _this = this;
        // Handle disconnection with cleanup
        socket.on('disconnect', function () { return __awaiter(_this, void 0, void 0, function () {
            var roomsToUpdate, allRoomIds, _i, allRoomIds_1, roomId, room, _a, roomsToUpdate_1, roomId, room, leavingPlayer, playerName;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log('Client disconnected:', socket.id);
                        roomsToUpdate = [];
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 6];
                        return [4 /*yield*/, redisService.getAllRooms()];
                    case 1:
                        allRoomIds = _c.sent();
                        _i = 0, allRoomIds_1 = allRoomIds;
                        _c.label = 2;
                    case 2:
                        if (!(_i < allRoomIds_1.length)) return [3 /*break*/, 5];
                        roomId = allRoomIds_1[_i];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 3:
                        room = _c.sent();
                        if (room && room.players.some(function (p) { return p.id === socket.id; })) {
                            roomsToUpdate.push(roomId);
                        }
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        this.fallbackRooms.forEach(function (room, roomId) {
                            if (room.players.some(function (p) { return p.id === socket.id; })) {
                                roomsToUpdate.push(roomId);
                            }
                        });
                        _c.label = 7;
                    case 7:
                        _a = 0, roomsToUpdate_1 = roomsToUpdate;
                        _c.label = 8;
                    case 8:
                        if (!(_a < roomsToUpdate_1.length)) return [3 /*break*/, 20];
                        roomId = roomsToUpdate_1[_a];
                        room = null;
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 10];
                        return [4 /*yield*/, redisService.getRoom(roomId)];
                    case 9:
                        room = _c.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        room = this.fallbackRooms.get(roomId) || null;
                        _c.label = 11;
                    case 11:
                        if (!room)
                            return [3 /*break*/, 19];
                        leavingPlayer = room.players.find(function (p) { return p.id === socket.id; });
                        playerName = ((_b = leavingPlayer === null || leavingPlayer === void 0 ? void 0 : leavingPlayer.name) === null || _b === void 0 ? void 0 : _b.playerName) || 'Unknown Player';
                        room.players = room.players.filter(function (p) { return p.id !== socket.id; });
                        if (!(room.players.length === 0)) return [3 /*break*/, 15];
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 13];
                        return [4 /*yield*/, redisService.deleteRoom(roomId)];
                    case 12:
                        _c.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        this.fallbackRooms.delete(roomId);
                        _c.label = 14;
                    case 14: return [3 /*break*/, 19];
                    case 15:
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 17];
                        return [4 /*yield*/, redisService.saveRoom(room)];
                    case 16:
                        _c.sent();
                        return [3 /*break*/, 18];
                    case 17:
                        this.fallbackRooms.set(roomId, room);
                        _c.label = 18;
                    case 18:
                        // Send system message about player leaving
                        this.sendSystemMessage(roomId, "".concat(playerName, " left the room"));
                        this.io.to(roomId).emit('rematch:status', room);
                        this.io.to(roomId).emit('room:updated', room);
                        _c.label = 19;
                    case 19:
                        _a++;
                        return [3 /*break*/, 8];
                    case 20:
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 22];
                        return [4 /*yield*/, redisService.deletePlayerSession(socket.id)];
                    case 21:
                        _c.sent();
                        _c.label = 22;
                    case 22: return [2 /*return*/];
                }
            });
        }); });
    };
    SocketManager.prototype.checkRateLimit = function (socket, action) {
        return __awaiter(this, void 0, void 0, function () {
            var isAllowed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 2];
                        return [4 /*yield*/, redisService.checkRateLimit("".concat(socket.id, ":").concat(action), 100, 60)];
                    case 1:
                        isAllowed = _a.sent();
                        if (!isAllowed) {
                            socket.emit('error', { message: 'Rate limit exceeded' });
                            return [2 /*return*/, false];
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/, true];
                }
            });
        });
    };
    SocketManager.prototype.generateRoomId = function () {
        return Math.random().toString(36).substring(7);
    };
    // Public methods for external access
    SocketManager.prototype.getActiveRooms = function () {
        return this.fallbackRooms;
    };
    SocketManager.prototype.getRedisStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!redisService.isRedisConnected()) return [3 /*break*/, 6];
                        _a = {};
                        return [4 /*yield*/, redisService.getGameStats('rooms_created')];
                    case 1:
                        _a.roomsCreated = _b.sent();
                        return [4 /*yield*/, redisService.getGameStats('players_joined')];
                    case 2:
                        _a.playersJoined = _b.sent();
                        return [4 /*yield*/, redisService.getGameStats('games_started')];
                    case 3:
                        _a.gamesStarted = _b.sent();
                        return [4 /*yield*/, redisService.getGameStats('games_completed')];
                    case 4:
                        _a.gamesCompleted = _b.sent();
                        return [4 /*yield*/, redisService.getGameStats('rematches_requested')];
                    case 5: return [2 /*return*/, (_a.rematchesRequested = _b.sent(),
                            _a)];
                    case 6: return [2 /*return*/, null];
                }
            });
        });
    };
    return SocketManager;
}());
export { SocketManager };
