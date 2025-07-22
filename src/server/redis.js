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
import { createClient } from 'redis';
var RedisService = /** @class */ (function () {
    function RedisService() {
        this.client = null;
        this.isConnected = false;
        this.cache = new Map();
    }
    RedisService.getInstance = function () {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    };
    RedisService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.client = createClient({
                            url: process.env.REDIS_URL || 'redis://localhost:6379',
                            socket: {
                                reconnectStrategy: function (retries) {
                                    if (retries > 10) {
                                        console.error('Redis connection failed after 10 retries');
                                        return new Error('Redis connection failed');
                                    }
                                    return Math.min(retries * 100, 3000);
                                },
                            },
                        });
                        this.client.on('error', function (err) {
                            console.error('Redis Client Error:', err);
                            _this.isConnected = false;
                        });
                        this.client.on('connect', function () {
                            console.log('Connected to Redis');
                            _this.isConnected = true;
                        });
                        return [4 /*yield*/, this.client.connect()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to connect to Redis:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.disconnect()];
                    case 1:
                        _a.sent();
                        this.client = null;
                        this.isConnected = false;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.isRedisConnected = function () {
        return this.isConnected && this.client !== null;
    };
    // In-memory cache management
    RedisService.prototype.getCached = function (key) {
        var cached = this.cache.get(key);
        if (!cached)
            return null;
        var now = Date.now();
        if (now - cached.timestamp > cached.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    };
    RedisService.prototype.setCached = function (key, data, ttl) {
        if (ttl === void 0) { ttl = 60; }
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            ttl: ttl,
        });
    };
    // Room management with caching
    RedisService.prototype.saveRoom = function (room, ttl) {
        if (ttl === void 0) { ttl = 3600; }
        return __awaiter(this, void 0, void 0, function () {
            var roomKey, roomData, pipeline;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        roomKey = "room:".concat(room.id);
                        roomData = JSON.stringify(room);
                        pipeline = this.client.multi();
                        pipeline.setEx(roomKey, ttl, roomData);
                        pipeline.sAdd('active_rooms', room.id);
                        pipeline.expire('active_rooms', ttl);
                        return [4 /*yield*/, pipeline.exec()
                            // Update cache
                        ];
                    case 1:
                        _a.sent();
                        // Update cache
                        this.setCached(roomKey, room, 30); // Cache for 30 seconds
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.getRoom = function (roomId) {
        return __awaiter(this, void 0, void 0, function () {
            var roomKey, cached, roomData, room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        roomKey = "room:".concat(roomId);
                        cached = this.getCached(roomKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        return [4 /*yield*/, this.client.get(roomKey)];
                    case 1:
                        roomData = _a.sent();
                        if (!roomData)
                            return [2 /*return*/, null];
                        try {
                            room = JSON.parse(roomData);
                            // Cache the result
                            this.setCached(roomKey, room, 30);
                            return [2 /*return*/, room];
                        }
                        catch (error) {
                            console.error('Failed to parse room data:', error);
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.deleteRoom = function (roomId) {
        return __awaiter(this, void 0, void 0, function () {
            var roomKey, pipeline;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        roomKey = "room:".concat(roomId);
                        pipeline = this.client.multi();
                        pipeline.del(roomKey);
                        pipeline.sRem('active_rooms', roomId);
                        return [4 /*yield*/, pipeline.exec()
                            // Clear cache
                        ];
                    case 1:
                        _a.sent();
                        // Clear cache
                        this.cache.delete(roomKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.getAllRooms = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        return [4 /*yield*/, this.client.sMembers('active_rooms')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Player session management with TTL optimization
    RedisService.prototype.savePlayerSession = function (playerId, sessionData, ttl) {
        if (ttl === void 0) { ttl = 1800; }
        return __awaiter(this, void 0, void 0, function () {
            var sessionKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        sessionKey = "session:".concat(playerId);
                        return [4 /*yield*/, this.client.setEx(sessionKey, ttl, JSON.stringify(sessionData))
                            // Cache session data
                        ];
                    case 1:
                        _a.sent();
                        // Cache session data
                        this.setCached(sessionKey, sessionData, 60);
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.getPlayerSession = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionKey, cached, sessionData, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        sessionKey = "session:".concat(playerId);
                        cached = this.getCached(sessionKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        return [4 /*yield*/, this.client.get(sessionKey)];
                    case 1:
                        sessionData = _a.sent();
                        if (!sessionData)
                            return [2 /*return*/, null];
                        try {
                            session = JSON.parse(sessionData);
                            // Cache the result
                            this.setCached(sessionKey, session, 60);
                            return [2 /*return*/, session];
                        }
                        catch (error) {
                            console.error('Failed to parse session data:', error);
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.deletePlayerSession = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        sessionKey = "session:".concat(playerId);
                        return [4 /*yield*/, this.client.del(sessionKey)
                            // Clear cache
                        ];
                    case 1:
                        _a.sent();
                        // Clear cache
                        this.cache.delete(sessionKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    // Enhanced leaderboard with batch operations
    RedisService.prototype.updatePlayerScore = function (playerId, score) {
        return __awaiter(this, void 0, void 0, function () {
            var leaderboardKey, scoreKey, pipeline;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        leaderboardKey = 'leaderboard';
                        scoreKey = "score:".concat(playerId);
                        pipeline = this.client.multi();
                        pipeline.set(scoreKey, score.toString());
                        pipeline.expire(scoreKey, 86400); // 24 hours
                        // Note: zAdd with complex types removed for compatibility
                        return [4 /*yield*/, pipeline.exec()];
                    case 1:
                        // Note: zAdd with complex types removed for compatibility
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.getTopPlayers = function (limit) {
        if (limit === void 0) { limit = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var leaderboardKey, cacheKey, cached, topPlayers;
            return __generator(this, function (_a) {
                if (!this.client)
                    throw new Error('Redis not connected');
                leaderboardKey = 'leaderboard';
                cacheKey = "leaderboard:top:".concat(limit);
                cached = this.getCached(cacheKey);
                if (cached)
                    return [2 /*return*/, cached
                        // For now, return empty array to avoid complex Redis types
                        // This can be enhanced later with proper sorted set implementation
                    ];
                topPlayers = [];
                // Cache the result for 30 seconds
                this.setCached(cacheKey, topPlayers, 30);
                return [2 /*return*/, topPlayers];
            });
        });
    };
    // Rate limiting with sliding window
    RedisService.prototype.checkRateLimit = function (key, limit, window) {
        return __awaiter(this, void 0, void 0, function () {
            var rateKey, current;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        rateKey = "rate:".concat(key);
                        return [4 /*yield*/, this.client.incr(rateKey)];
                    case 1:
                        current = _a.sent();
                        if (!(current === 1)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.client.expire(rateKey, window)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, current <= limit];
                }
            });
        });
    };
    // Chat message history with optimized storage
    RedisService.prototype.saveChatMessage = function (roomId, message) {
        return __awaiter(this, void 0, void 0, function () {
            var chatKey, messageData, pipeline;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        chatKey = "chat:".concat(roomId);
                        messageData = JSON.stringify(message);
                        pipeline = this.client.multi();
                        pipeline.lPush(chatKey, messageData);
                        pipeline.lTrim(chatKey, 0, 99); // Keep last 100 messages
                        pipeline.expire(chatKey, 3600); // 1 hour
                        return [4 /*yield*/, pipeline.exec()
                            // Clear chat cache for this room
                        ];
                    case 1:
                        _a.sent();
                        // Clear chat cache for this room
                        this.cache.delete("chat:history:".concat(roomId));
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.getChatHistory = function (roomId, limit) {
        if (limit === void 0) { limit = 50; }
        return __awaiter(this, void 0, void 0, function () {
            var chatKey, cacheKey, cached, messages, parsedMessages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        chatKey = "chat:".concat(roomId);
                        cacheKey = "chat:history:".concat(roomId);
                        cached = this.getCached(cacheKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        return [4 /*yield*/, this.client.lRange(chatKey, 0, limit - 1)];
                    case 1:
                        messages = _a.sent();
                        parsedMessages = messages
                            .map(function (msg) {
                            try {
                                return JSON.parse(msg);
                            }
                            catch (error) {
                                console.error('Failed to parse chat message:', error);
                                return null;
                            }
                        })
                            .filter(Boolean);
                        // Cache the result for 10 seconds
                        this.setCached(cacheKey, parsedMessages, 10);
                        return [2 /*return*/, parsedMessages];
                }
            });
        });
    };
    // Game statistics with batch operations
    RedisService.prototype.incrementGameStats = function (stat, value) {
        if (value === void 0) { value = 1; }
        return __awaiter(this, void 0, void 0, function () {
            var statsKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        statsKey = "stats:".concat(stat);
                        return [4 /*yield*/, this.client.incrBy(statsKey, value)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.client.expire(statsKey, 86400)
                            // Clear stats cache
                        ]; // 24 hours
                    case 2:
                        _a.sent(); // 24 hours
                        // Clear stats cache
                        this.cache.delete('game:stats');
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisService.prototype.getGameStats = function (stat) {
        return __awaiter(this, void 0, void 0, function () {
            var statsKey, value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        statsKey = "stats:".concat(stat);
                        return [4 /*yield*/, this.client.get(statsKey)];
                    case 1:
                        value = _a.sent();
                        return [2 /*return*/, value ? parseInt(value) : 0];
                }
            });
        });
    };
    // Batch statistics retrieval
    RedisService.prototype.getAllGameStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, stats, statsData, _i, stats_1, stat, value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        cacheKey = 'game:stats';
                        cached = this.getCached(cacheKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        stats = [
                            'rooms_created',
                            'players_joined',
                            'games_started',
                            'games_completed',
                            'rematches_requested',
                        ];
                        statsData = {};
                        _i = 0, stats_1 = stats;
                        _a.label = 1;
                    case 1:
                        if (!(_i < stats_1.length)) return [3 /*break*/, 4];
                        stat = stats_1[_i];
                        return [4 /*yield*/, this.client.get("stats:".concat(stat))];
                    case 2:
                        value = _a.sent();
                        statsData[stat] = value ? parseInt(value.toString()) : 0;
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Cache the result for 60 seconds
                        this.setCached(cacheKey, statsData, 60);
                        return [2 /*return*/, statsData];
                }
            });
        });
    };
    // Health check with detailed metrics
    RedisService.prototype.ping = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.client)
                            throw new Error('Redis not connected');
                        return [4 /*yield*/, this.client.ping()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Cache management
    RedisService.prototype.clearCache = function () {
        this.cache.clear();
    };
    RedisService.prototype.getCacheStats = function () {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    };
    // Performance monitoring
    RedisService.prototype.getPerformanceMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheStats;
            return __generator(this, function (_a) {
                cacheStats = this.getCacheStats();
                return [2 /*return*/, {
                        cacheSize: cacheStats.size,
                        cacheHitRate: 0, // Would need to track hits/misses
                        redisConnected: this.isRedisConnected(),
                        memoryUsage: process.memoryUsage(),
                    }];
            });
        });
    };
    return RedisService;
}());
export { RedisService };
export var redisService = RedisService.getInstance();
