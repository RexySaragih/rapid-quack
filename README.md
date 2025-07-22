# Rapid-Quack

A typing-based duck shooting game built with Phaser.js and React. Players type words to shoot ducks that carry randomized words, with scoring based on word difficulty. Features single-player and multiplayer modes with real-time synchronization.

## 🚀 Performance Features

### Redis Integration

This project now includes Redis for enhanced performance and scalability:

- **Horizontal Scaling**: Multiple server instances can share room data
- **Session Persistence**: Player states survive server restarts
- **Real-time Leaderboards**: Global score tracking across sessions
- **Rate Limiting**: Prevents spam and abuse
- **Chat History**: Persistent message storage
- **Game Statistics**: Track usage metrics and analytics

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Game Engine**: Phaser.js 3.70.0
- **Backend**: Node.js, Express, Socket.io
- **Cache/Storage**: Redis 7
- **Build Tools**: Vite, TSX
- **State Management**: Zustand
- **Development**: ESLint, Prettier, Concurrently

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd rapid-quack
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Redis** (Choose one option)

   **Option A: Using Docker (Recommended)**

   ```bash
   docker-compose up -d redis
   ```

   **Option B: Local Redis installation**

   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis-server

   # Windows
   # Download from https://redis.io/download
   ```

4. **Start the development server**
   ```bash
   npm run start
   ```

## 🎮 Game Features

### Single Player Mode

- 5 difficulty levels (Easy, Normal, Hard, Expert, Duckpocalypse)
- Dynamic word generation with API integration
- Combo system for consecutive hits
- Lives system with backspace penalty
- Real-time scoring based on word length and difficulty

### Multiplayer Mode

- Room-based multiplayer with real-time synchronization
- Chat system with message history
- Rematch functionality
- Global leaderboards
- Player session persistence

### Performance Optimizations

- **Redis Caching**: Fast room and session data access
- **Rate Limiting**: Prevents abuse and spam
- **Horizontal Scaling**: Multiple server instances supported
- **Session Persistence**: Survives server restarts
- **Real-time Analytics**: Track game statistics and usage

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run server           # Start Socket.io server
npm run start            # Start both dev server and Socket.io server

# Production
npm run build            # Build frontend
npm run build:server     # Build server
npm run build:all        # Build both frontend and server
npm run start:prod       # Start production build

# Utilities
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
REDIS_URL=redis://localhost:6379

# Optional: Redis with authentication
# REDIS_URL=redis://username:password@localhost:6379
```

### Redis Management

**Start Redis with Docker:**

```bash
docker-compose up -d redis
```

**Access Redis Commander (Web UI):**

- URL: http://localhost:8081
- Automatically connects to Redis instance

**Redis CLI:**

```bash
# Connect to Redis
redis-cli

# Check connection
ping

# View active rooms
SMEMBERS active_rooms

# View leaderboard
ZREVRANGE leaderboard 0 9 WITHSCORES
```

## 📊 API Endpoints

The server provides several endpoints for monitoring and analytics:

- **Health Check**: `GET /health`

  - Server status and Redis connection
  - Active connections and rooms count

- **Leaderboard**: `GET /leaderboard`

  - Top 10 players by score
  - Real-time updates

- **Game Statistics**: `GET /stats`
  - Rooms created, players joined
  - Games started/completed
  - Rematch requests

## 🏗️ Project Structure

```
src/
├── game/           # Phaser.js game logic (scenes, audio, effects)
├── components/     # React UI components (including multiplayer UI)
├── server/         # Node.js/Express server with Redis integration
├── services/       # Socket service for frontend
├── shared/         # Shared types and utilities
└── styles/         # Tailwind and custom CSS
```

## 🎯 Performance Benefits

### Before Redis

- ❌ In-memory storage (lost on restart)
- ❌ Single server instance only
- ❌ No session persistence
- ❌ No rate limiting
- ❌ No analytics

### After Redis

- ✅ Persistent data storage
- ✅ Horizontal scaling support
- ✅ Session persistence across restarts
- ✅ Rate limiting and abuse prevention
- ✅ Real-time analytics and leaderboards
- ✅ Chat message history
- ✅ Graceful fallback to in-memory storage

## 🚀 Deployment

### Production Setup

1. **Install Redis on your server**

   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl enable redis-server
   ```

2. **Set environment variables**

   ```bash
   export REDIS_URL=redis://localhost:6379
   export PORT=3001
   ```

3. **Build and start**
   ```bash
   npm run build:all
   npm run start:prod
   ```

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🐛 Troubleshooting

### Redis Connection Issues

- Ensure Redis is running: `redis-cli ping`
- Check Redis URL in environment variables
- Server will fallback to in-memory storage if Redis is unavailable

### Performance Issues

- Monitor Redis memory usage: `redis-cli info memory`
- Check active connections: `GET /health`
- Review rate limiting settings in server code

### Development Issues

- Clear Redis data: `redis-cli FLUSHALL`
- Restart Redis: `docker-compose restart redis`
- Check server logs for connection errors

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### Game Statistics

```bash
curl http://localhost:3001/stats
```

### Leaderboard

```bash
curl http://localhost:3001/leaderboard
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Redis enabled and disabled
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
