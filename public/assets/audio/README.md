# Audio Assets

This directory should contain the following audio files for the Rapid Quack game:

## Required Audio Files

- `hit.wav` - Sound effect when a duck is hit
- `combo.wav` - Sound effect for combo hits
- `duck_spawn.wav` - Sound effect when a duck spawns
- `game_over.wav` - Sound effect when the game ends
- `opponent_hit.wav` - Sound effect when opponent hits a duck (multiplayer)
- `background_music.wav` - Background music for the game

## Supported Formats

The game supports the following audio formats:

- wav (recommended)
- OGG
- WAV

## Notes

- The game will work without these audio files (audio is optional)
- Audio files should be optimized for web (small file sizes)
- All audio will be loaded when the game starts, so keep files reasonably sized
- Consider using royalty-free or original audio content

## Adding Audio Files

1. Place your audio files in this directory
2. Make sure they have the exact names listed above
3. Restart the development server
4. The game will automatically detect and use the audio files
