# Online Multiplayer Guide

## Quick Start

### 1. Install and Start Server

```bash
npm install
npm start
```

You'll see:
```
=================================
🎮 Pong Server Running!
=================================
Local:   http://localhost:3000
Network: http://192.168.4.198:3000
=================================
Share the Network URL with friends on your WiFi!
```

### 2. Host a Game (Player 1)

1. Open the **Network URL** in your browser (e.g., `http://192.168.4.198:3000`)
2. Click **"Online Multiplayer"**
3. Click **"Create Room"**
4. You'll get a **6-character room code** (e.g., `ABC123`)
5. Share this code with your friend

### 3. Join a Game (Player 2)

1. Open the **same Network URL** in your browser
2. Click **"Online Multiplayer"**
3. Click **"Join Room"**
4. Enter the **room code**
5. Game starts automatically!

## Controls

**Both players use the same keys:**
- `W` - Move paddle up
- `S` - Move paddle down

**Paddle Assignment:**
- Player 1 (Host) controls the **left paddle**
- Player 2 (Guest) controls the **right paddle**

## How It Works

### Game Synchronization

- **Host (Player 1)** is the "server" for the game:
  - Manages ball physics
  - Detects collisions
  - Sends ball position to guest
  - Updates scores

- **Guest (Player 2)** is the "client":
  - Receives ball updates from host
  - Sends paddle position to host

- **Both players**:
  - Send their paddle movements to each other
  - See synchronized game state

### Connection Details

- Uses **WebSocket** (Socket.IO) for real-time communication
- Low latency (<50ms on good WiFi)
- Automatic reconnection on brief network interruptions
- Room code system prevents random players joining

## Troubleshooting

### "Room not found" error
- Double-check the room code (6 characters)
- Make sure the host hasn't closed their browser
- Room codes are case-insensitive

### Can't connect to Network URL
- Ensure both devices are on the **same WiFi network**
- Check if firewall is blocking port 3000
- Try using the Local URL (`http://localhost:3000`) if testing on same computer

### Game feels laggy
- Normal on slower WiFi (should still be playable)
- Try moving closer to WiFi router
- Close bandwidth-heavy applications
- Consider using 5GHz WiFi instead of 2.4GHz

### "Opponent disconnected"
- One player lost connection or closed browser
- Simply create/join a new room to play again

## Network Requirements

- **Same WiFi network** (or same local network)
- Port 3000 must be accessible
- Stable internet connection (local WiFi is fine)
- WebSocket support (all modern browsers)

## Advanced: Play Over Internet

To play over the internet (not just local WiFi):

1. Set up port forwarding on your router (port 3000)
2. Use your public IP address instead of local IP
3. Or use a tunneling service like ngrok:
   ```bash
   ngrok http 3000
   ```
   Then share the ngrok URL

## Tips for Best Experience

✅ **Do:**
- Use a stable WiFi connection
- Play on the same network for best latency
- Share the room code via text/chat
- Close the room properly (back to menu)

❌ **Don't:**
- Use cellular data (high latency)
- Share room codes publicly (anyone can join)
- Refresh the page during a game (breaks connection)

Enjoy playing Pong online with your friends! 🏓

