const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const os = require('os');

// Serve static files
app.use(express.static(__dirname));

// Store game rooms
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create a new room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            players: [socket.id],
            gameState: null,
            host: socket.id
        });
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, playerNumber: 1 });
        console.log(`Room ${roomCode} created by ${socket.id}`);
    });

    // Join an existing room
    socket.on('joinRoom', (roomCode) => {
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('roomError', 'Room not found');
            return;
        }
        
        if (room.players.length >= 2) {
            socket.emit('roomError', 'Room is full');
            return;
        }

        room.players.push(socket.id);
        socket.join(roomCode);
        socket.emit('roomJoined', { roomCode, playerNumber: 2 });
        
        // Notify both players that the game can start
        io.to(roomCode).emit('gameReady');
        console.log(`Player ${socket.id} joined room ${roomCode}`);
    });

    // Handle paddle movement
    socket.on('paddleMove', (data) => {
        const { roomCode, y, playerNumber } = data;
        // Broadcast to other player in the room
        socket.to(roomCode).emit('opponentPaddleMove', { y, playerNumber });
    });

    // Handle ball position (only host sends this)
    socket.on('ballUpdate', (data) => {
        const { roomCode, x, y, dx, dy } = data;
        socket.to(roomCode).emit('ballSync', { x, y, dx, dy });
    });

    // Handle score updates
    socket.on('scoreUpdate', (data) => {
        const { roomCode, player1Score, player2Score } = data;
        io.to(roomCode).emit('scoreSync', { player1Score, player2Score });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove player from any rooms
        rooms.forEach((room, roomCode) => {
            if (room.players.includes(socket.id)) {
                // Notify other player
                socket.to(roomCode).emit('opponentDisconnected');
                // Remove the room
                rooms.delete(roomCode);
                console.log(`Room ${roomCode} closed due to disconnection`);
            }
        });
    });
});

// Generate a random 6-character room code
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if code already exists
    if (rooms.has(code)) {
        return generateRoomCode();
    }
    return code;
}

// Get local IP address
function getLocalIP() {
    try {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                // Skip internal and non-IPv4 addresses
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    } catch (error) {
        // Fallback if we can't get network interfaces
        console.log('Could not determine local IP address');
    }
    return 'localhost';
}

const PORT = 3000;
http.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log('\n=================================');
    console.log('🎮 Pong Server Running!');
    console.log('=================================');
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://${localIP}:${PORT}`);
    console.log('=================================');
    console.log('Share the Network URL with friends on your WiFi!\n');
});

