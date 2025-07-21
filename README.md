# Rapid-Quack 🦆

A typing-based duck shooting game with multiplayer support, built with Phaser.js and React.

## 🎮 Game Concept

Instead of using a crosshair to shoot ducks, players type words to shoot them! Ducks carry randomized words and move across the screen. Players score points by typing the correct words, with higher scores for more difficult words.

## 🚀 Features

- **Typing-based gameplay** - Type words to shoot ducks
- **Word difficulty scoring** - Harder words = more points
- **Multiplayer rooms** - Play with friends in real-time
- **Real-time scoring** - See other players' scores live
- **Responsive design** - Works on desktop and mobile

## 🛠 Tech Stack

- **Phaser.js 3** - Game engine for scenes and sprites
- **React 18** - UI wrapper and components
- **TypeScript** - Type safety
- **Socket.io** - Real-time multiplayer
- **Tailwind CSS** - Styling
- **Vite** - Development and build tool

## 📁 Project Structure

```
rapid-quack/
├── src/
│   ├── game/           # Phaser.js game logic
│   ├── components/     # React UI components
│   ├── server/         # Node.js/Express server
│   └── shared/         # Shared types and utilities
├── public/
│   └── assets/         # Game assets
└── docs/               # Documentation
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