import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
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
// Store rooms in memory
var rooms = new Map();
io.on('connection', function (socket) {
    console.log('Client connected:', socket.id);
    // Room creation
    socket.on('room:create', function (playerData) {
        var roomId = Math.random().toString(36).substring(7);
        var newPlayer = {
            id: socket.id,
            name: {
                playerName: playerData.playerName,
                difficulty: playerData.difficulty,
                gameDuration: playerData.gameDuration
            },
            isReady: false,
            score: 0,
        };
        var room = {
            id: roomId,
            players: [newPlayer],
            difficulty: playerData.difficulty,
            isStarted: false,
            gameDuration: playerData.gameDuration
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        io.to(socket.id).emit('room:created', room);
    });
    // Room joining
    socket.on('room:join', function (roomId, playerName) {
        var room = rooms.get(roomId);
        if (!room) {
            io.to(socket.id).emit('error', { message: 'Room not found' });
            return;
        }
        var newPlayer = {
            id: socket.id,
            name: {
                playerName: playerName,
                difficulty: room.difficulty, // Use room's difficulty
                gameDuration: room.gameDuration || 120 // Use room's game duration
            },
            isReady: false,
            score: 0,
        };
        room.players.push(newPlayer);
        socket.join(roomId);
        io.to(roomId).emit('room:joined', room);
        io.to(roomId).emit('room:updated', room);
    });
    // Room data request
    socket.on('room:request', function (roomId) {
        console.log('Room data requested for:', roomId);
        var room = rooms.get(roomId);
        if (!room) {
            io.to(socket.id).emit('error', { message: 'Room not found' });
            return;
        }
        io.to(socket.id).emit('room:updated', room);
    });
    // Player ready
    socket.on('player:ready', function (roomId) {
        var room = rooms.get(roomId);
        if (!room)
            return;
        var player = room.players.find(function (p) { return p.id === socket.id; });
        if (!player)
            return;
        player.isReady = true;
        player.isGameOver = false; // Reset game over state on ready
        player.isRematchReady = false; // Reset rematch state on ready
        // Check if all players are ready
        var allReady = room.players.every(function (p) { return p.isReady; });
        if (allReady && room.players.length >= 2) {
            room.isStarted = true;
            // Reset all players' isGameOver and isRematchReady state
            room.players.forEach(function (p) { p.isGameOver = false; p.isRematchReady = false; });
            io.to(roomId).emit('game:start', room);
        }
        else {
            io.to(roomId).emit('room:updated', room);
        }
    });
    // Player game over
    socket.on('player:gameover', function (roomId) {
        var room = rooms.get(roomId);
        if (!room)
            return;
        var player = room.players.find(function (p) { return p.id === socket.id; });
        if (!player)
            return;
        player.isGameOver = true;
        // If all players are game over, emit room:gameover
        var allGameOver = room.players.every(function (p) { return p.isGameOver; });
        if (allGameOver) {
            io.to(roomId).emit('room:gameover', room);
        }
    });
    // Rematch request
    socket.on('rematch:request', function (roomId) {
        var room = rooms.get(roomId);
        if (!room)
            return;
        var player = room.players.find(function (p) { return p.id === socket.id; });
        if (!player)
            return;
        player.isRematchReady = true;
        io.to(roomId).emit('rematch:status', room);
        // If all players are ready for rematch, start new game
        var allRematchReady = room.players.length > 1 && room.players.every(function (p) { return p.isRematchReady; });
        if (allRematchReady) {
            // Reset game state for rematch
            room.players.forEach(function (p) {
                p.isReady = false;
                p.isGameOver = false;
                p.isRematchReady = false;
                p.score = 0;
            });
            room.isStarted = false;
            io.to(roomId).emit('rematch:start');
            io.to(roomId).emit('room:updated', room);
        }
    });
    // Score updates
    socket.on('player:score', function (roomId, score) {
        var room = rooms.get(roomId);
        if (!room)
            return;
        var player = room.players.find(function (p) { return p.id === socket.id; });
        if (!player)
            return;
        player.score = score;
        io.to(roomId).emit('player:score', socket.id, score);
    });
    // Duck spawn synchronization
    socket.on('duck:spawn', function (roomId, duckData) {
        var room = rooms.get(roomId);
        if (!room || !room.isStarted)
            return;
        // Broadcast duck spawn to other players in the room
        socket.to(roomId).emit('duck:spawn', duckData);
    });
    // Duck hit synchronization
    socket.on('duck:hit', function (roomId, duckId) {
        var room = rooms.get(roomId);
        if (!room || !room.isStarted)
            return;
        // Broadcast duck hit to other players in the room
        socket.to(roomId).emit('duck:hit', duckId);
    });
    // Effect synchronization
    socket.on('effect:trigger', function (roomId, effectData) {
        var room = rooms.get(roomId);
        if (!room || !room.isStarted)
            return;
        // Broadcast effect to other players in the room
        socket.to(roomId).emit('effect:trigger', effectData);
    });
    // Chat message handling
    socket.on('chat:message', function (roomId, messageData) {
        console.log('Server received chat message:', { roomId: roomId, messageData: messageData });
        var room = rooms.get(roomId);
        if (!room) {
            console.log('Room not found for chat message:', roomId);
            return;
        }
        console.log('Broadcasting chat message to room:', roomId);
        // Broadcast chat message to all players in the room
        io.to(roomId).emit('chat:message', messageData);
    });
    // Room leaving
    socket.on('room:leave', function (roomId) {
        var room = rooms.get(roomId);
        if (!room)
            return;
        room.players = room.players.filter(function (p) { return p.id !== socket.id; });
        // Remove game over and rematch state for leaving player
        socket.leave(roomId);
        if (room.players.length === 0) {
            rooms.delete(roomId);
        }
        else {
            // Notify others of rematch status change
            io.to(roomId).emit('rematch:status', room);
            io.to(roomId).emit('room:updated', room);
        }
    });
    // Handle disconnection
    socket.on('disconnect', function () {
        console.log('Client disconnected:', socket.id);
        // Find and leave all rooms
        rooms.forEach(function (room, roomId) {
            if (room.players.some(function (p) { return p.id === socket.id; })) {
                room.players = room.players.filter(function (p) { return p.id !== socket.id; });
                // Remove game over and rematch state for disconnected player
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                }
                else {
                    io.to(roomId).emit('rematch:status', room);
                    io.to(roomId).emit('room:updated', room);
                }
            }
        });
    });
});
httpServer.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
