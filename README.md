# Rapid-Quack 🦆

A typing-based duck shooting game with multiplayer support, built with Phaser.js and React.

## 🎮 Game Concept

Instead of using a crosshair to shoot ducks, players type words to shoot them! Ducks carry randomized words and move across the screen. Players score points by typing the correct words, with higher scores for more difficult words.

## 🚀 Features

- **Typing-based gameplay** - Type words to shoot ducks
- **Word difficulty scoring** - Harder words = more points
- **Combo system** - Score bonus points for consecutive hits
- **Particle and sound effects** - Visual and audio feedback for actions
- **Multiplayer rooms** - Play with friends in real-time (in progress)
- **Real-time scoring** - See other players' scores live
- **Responsive design** - Works on desktop and mobile
- **Multiple difficulty levels** - Easy, Normal, Hard, Expert, Duckpocalypse
- **Room management** - Create, join, and wait in multiplayer rooms

## 🛠 Tech Stack

- **Phaser.js 3** - Game engine for scenes and sprites
- **React 18** - UI wrapper and components
- **TypeScript** - Type safety
- **Socket.io** - Real-time multiplayer
- **Tailwind CSS** - Styling
- **Vite** - Development and build tool
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Zustand** - State management
- **Concurrently** - Run multiple scripts
- **TSX** - TypeScript execution for server

## 📁 Project Structure

```
rapid-quack/
├── src/
│   ├── game/           # Phaser.js game logic (scenes, audio, effects)
│   ├── components/     # React UI components (including multiplayer UI)
│   ├── server/         # Node.js/Express server (Socket.io backend)
│   ├── services/       # Socket service for frontend
│   ├── shared/
│   │   ├── types/      # Shared types
│   │   └── utils/      # Word generator, fallback word lists
│   └── styles/         # Tailwind and custom CSS
├── public/
│   └── assets/
│       └── audio/      # Game audio assets
├── docs/               # Documentation (game flow, tech stack, todo)
├── index.html          # Main HTML entry
└── ...                 # Config and build files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd rapid-quack
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

4. Start backend server (in another terminal):

```bash
npm run server
```

5. Or run both simultaneously:

```bash
npm run dev:full
```

The game will be available at `http://localhost:3000`

## 🎯 Development Phases

See `docs/TODO_LIST.txt` for detailed development phases and progress tracking.

## 📚 Documentation

- `docs/TECH_STACK.txt` - Complete tech stack details
- `docs/TODO_LIST.txt` - Development roadmap and progress
- `docs/GAME_FLOW.txt` - Game UI and flow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Typing! 🦆⌨️**
