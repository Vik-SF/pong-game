# Pong Game

A beautiful Pong game with 1-player, 2-player local, and **online multiplayer** modes!

## Features

- 🎮 **1 Player**: Play against AI
- 👥 **2 Players (Local)**: Play with a friend on the same keyboard
- 🌐 **Online Multiplayer**: Play with friends over WiFi!
- 📱 **iPad & Mobile Support**: Touch controls for playing on tablets and phones

## Quick Start (Local Play)

1. Open `index.html` in your web browser
2. Choose your game mode and play!

## Online Multiplayer Setup

To play online with friends on the same WiFi network:

### 1. Install Dependencies

First, make sure you have Node.js installed. Then run:

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

You'll see output like this:

```
=================================
🎮 Pong Server Running!
=================================
Local:   http://localhost:3000
Network: http://192.168.1.100:3000
=================================
Share the Network URL with friends on your WiFi!
```

### 3. Connect and Play

**Host (Player 1):**
1. Open the Network URL in your browser (e.g., `http://192.168.1.100:3000`)
2. Click "Online Multiplayer"
3. Click "Create Room"
4. Share the 6-character room code with your friend

**Guest (Player 2):**
1. Open the same Network URL in your browser
2. Click "Online Multiplayer"
3. Click "Join Room"
4. Enter the room code
5. Game starts automatically when both players are connected!

## Controls

### Desktop/Keyboard Controls

**Local Modes:**
- **Player 1**: 
  - `W` - Move paddle up
  - `S` - Move paddle down

- **Player 2** (in 2-player local mode):
  - `↑` (Up Arrow) - Move paddle up
  - `↓` (Down Arrow) - Move paddle down

**Online Mode:**
- Both players use `W` (up) and `S` (down) to control their paddle
- Player 1 (host) controls the left paddle
- Player 2 (guest) controls the right paddle

### iPad & Mobile Touch Controls

Touch controls are automatically enabled on iPad and mobile devices:

**Method 1: Drag Controls (Recommended)**
- Touch and drag your finger on your paddle's side of the screen
- Your paddle follows your finger position
- Left side controls Player 1's paddle
- Right side controls Player 2's paddle

**Method 2: Button Controls**
- Use the ▲/▼ buttons that appear on screen
- Tap and hold to move your paddle up or down
- Each player has their own set of buttons on their side

## Game Rules

- The ball bounces off the top and bottom walls
- Players must prevent the ball from passing their paddle
- Each time the ball passes a paddle, the opponent scores a point
- Ball speed increases with each paddle hit for more challenge
- Ball angle changes based on where it hits the paddle

## Technical Details

### Online Multiplayer
- Uses **Socket.IO** for real-time communication
- Host (Player 1) manages game physics and ball movement
- Guest (Player 2) receives ball position updates
- Both players send their paddle positions to each other
- Automatic reconnection on network interruption
- Graceful handling of player disconnections

### Server
- Built with **Node.js** and **Express**
- Listens on all network interfaces (0.0.0.0)
- Generates random 6-character room codes
- Manages multiple concurrent games
- Cleans up rooms when players disconnect

## iPad & Mobile Compatibility

The game is fully optimized for touch devices:

### Features:
- ✨ **Auto-detection** - Touch controls appear automatically on iPad/mobile
- 🎯 **Dual control methods** - Choose between drag or button controls
- 📏 **Responsive design** - Adapts to different screen sizes
- 🔘 **Large touch targets** - Easy to tap buttons (70px on iPad, 50px on phones)
- 🚫 **No zoom/scroll** - Prevents accidental page movements during gameplay

### How to Play on iPad:
1. Open the game URL in Safari or Chrome
2. Touch controls will appear automatically
3. **For best experience**: Add to Home Screen for fullscreen play
   - Tap the Share button in Safari
   - Select "Add to Home Screen"
   - Launch from home screen for immersive gameplay

### Supported Devices:
- ✅ iPad (all models)
- ✅ iPhone
- ✅ Android tablets
- ✅ Android phones
- ✅ Any touchscreen device with a modern browser

## Troubleshooting

**Can't connect to server?**
- Make sure both players are on the same WiFi network
- Check firewall settings - port 3000 needs to be accessible
- Try the local IP address shown in the server console

**Game feels laggy?**
- This is normal on slower WiFi networks
- Try moving closer to the WiFi router
- Close other applications using the network

**Opponent disconnected message?**
- One player lost connection or closed the browser
- Return to menu and create/join a new room

## Files

- `index.html` - Main game page
- `style.css` - Beautiful gradient UI styling
- `game.js` - Game logic and multiplayer client
- `server.js` - Node.js multiplayer server
- `package.json` - Dependencies

## Development

The game runs in two modes:

1. **Static Mode**: Open `index.html` directly for local play only
2. **Server Mode**: Run `npm start` for full online multiplayer support

Enjoy the game! 🏓
