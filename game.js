// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Socket.IO connection (only if available)
let socket = null;
let isOnlineMode = false;
let roomCode = null;
let playerNumber = null; // 1 or 2
let isHost = false;

// Initialize socket if available
if (typeof io !== 'undefined') {
    socket = io();
    setupSocketListeners();
} else {
    // Hide online multiplayer button if Socket.IO is not available
    const onlineBtn = document.getElementById('onlineBtn');
    if (onlineBtn) {
        onlineBtn.style.display = 'none';
    }
    console.log('Online multiplayer not available - server not running');
}

// Game state
let gameState = {
    isPlaying: false,
    mode: null, // 'single', 'double', or 'online'
    player1Score: 0,
    player2Score: 0
};

// Paddle class
class Paddle {
    constructor(x, y, width, height, isAI = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 6;
        this.isAI = isAI;
        this.aiReactionDelay = 0;
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(direction) {
        if (direction === 'up' && this.y > 0) {
            this.y -= this.speed;
        } else if (direction === 'down' && this.y < canvas.height - this.height) {
            this.y += this.speed;
        }
    }

    updateAI(ball) {
        // Add some delay and imperfection to AI
        this.aiReactionDelay++;
        
        if (this.aiReactionDelay < 3) return; // Reaction delay
        this.aiReactionDelay = 0;

        const paddleCenter = this.y + this.height / 2;
        const ballCenter = ball.y + ball.radius;
        const difficulty = 0.8; // Lower = easier (AI won't perfectly center)

        // Only move if ball is moving towards AI
        if (ball.dx > 0) {
            if (paddleCenter < ballCenter - this.height * (1 - difficulty) / 2) {
                this.move('down');
            } else if (paddleCenter > ballCenter + this.height * (1 - difficulty) / 2) {
                this.move('up');
            }
        }
    }
}

// Ball class
class Ball {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 5;
        this.dx = this.speed;
        this.dy = this.speed;
        this.maxSpeed = 12;
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Top and bottom collision
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.dy = -this.dy;
        }
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speed = 5;
        this.dx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
        this.dy = (Math.random() * 2 - 1) * this.speed;
    }

    increaseSpeed() {
        if (Math.abs(this.dx) < this.maxSpeed) {
            this.dx *= 1.05;
            this.dy *= 1.05;
        }
    }
}

// Create game objects
const paddle1 = new Paddle(20, canvas.height / 2 - 50, 15, 100);
const paddle2 = new Paddle(canvas.width - 35, canvas.height / 2 - 50, 15, 100);
const ball = new Ball(canvas.width / 2, canvas.height / 2, 10);

// Keyboard controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls
let touchControls = {
    player1Up: false,
    player1Down: false,
    player2Up: false,
    player2Down: false
};

// Add touch event listeners for control buttons
function setupTouchControls() {
    const p1UpBtn = document.getElementById('p1UpBtn');
    const p1DownBtn = document.getElementById('p1DownBtn');
    const p2UpBtn = document.getElementById('p2UpBtn');
    const p2DownBtn = document.getElementById('p2DownBtn');

    if (p1UpBtn) {
        p1UpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls.player1Up = true;
        });
        p1UpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchControls.player1Up = false;
        });
    }

    if (p1DownBtn) {
        p1DownBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls.player1Down = true;
        });
        p1DownBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchControls.player1Down = false;
        });
    }

    if (p2UpBtn) {
        p2UpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls.player2Up = true;
        });
        p2UpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchControls.player2Up = false;
        });
    }

    if (p2DownBtn) {
        p2DownBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls.player2Down = true;
        });
        p2DownBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchControls.player2Down = false;
        });
    }
}

// Canvas touch controls - drag to move paddle
let activeTouches = {
    player1: null,
    player2: null
};

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    
    for (let touch of e.changedTouches) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Determine which side was touched
        if (x < canvas.width / 2) {
            // Left side - Player 1
            activeTouches.player1 = { id: touch.identifier, y: y };
        } else {
            // Right side - Player 2
            activeTouches.player2 = { id: touch.identifier, y: y };
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    
    for (let touch of e.changedTouches) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Update active touches
        if (activeTouches.player1 && activeTouches.player1.id === touch.identifier) {
            activeTouches.player1.y = y;
        }
        if (activeTouches.player2 && activeTouches.player2.id === touch.identifier) {
            activeTouches.player2.y = y;
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    for (let touch of e.changedTouches) {
        if (activeTouches.player1 && activeTouches.player1.id === touch.identifier) {
            activeTouches.player1 = null;
        }
        if (activeTouches.player2 && activeTouches.player2.id === touch.identifier) {
            activeTouches.player2 = null;
        }
    }
});

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    activeTouches.player1 = null;
    activeTouches.player2 = null;
});

// Collision detection
function checkPaddleCollision(ball, paddle) {
    return (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y
    );
}

// Draw middle line
function drawMiddleLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('player1Score').textContent = gameState.player1Score;
    document.getElementById('player2Score').textContent = gameState.player2Score;
}

// Game loop
function gameLoop() {
    if (!gameState.isPlaying) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw middle line
    drawMiddleLine();

    // Handle controls based on mode
    if (gameState.mode === 'online') {
        // In online mode, control your paddle
        if (playerNumber === 1) {
            // Keyboard controls
            if (keys['w'] || keys['W'] || touchControls.player1Up) {
                paddle1.move('up');
                if (socket) socket.emit('paddleMove', { roomCode, y: paddle1.y, playerNumber: 1 });
            }
            if (keys['s'] || keys['S'] || touchControls.player1Down) {
                paddle1.move('down');
                if (socket) socket.emit('paddleMove', { roomCode, y: paddle1.y, playerNumber: 1 });
            }
            // Touch drag controls
            if (activeTouches.player1) {
                const targetY = activeTouches.player1.y - paddle1.height / 2;
                paddle1.y = Math.max(0, Math.min(canvas.height - paddle1.height, targetY));
                if (socket) socket.emit('paddleMove', { roomCode, y: paddle1.y, playerNumber: 1 });
            }
        } else if (playerNumber === 2) {
            // Keyboard controls
            if (keys['w'] || keys['W'] || touchControls.player2Up) {
                paddle2.move('up');
                if (socket) socket.emit('paddleMove', { roomCode, y: paddle2.y, playerNumber: 2 });
            }
            if (keys['s'] || keys['S'] || touchControls.player2Down) {
                paddle2.move('down');
                if (socket) socket.emit('paddleMove', { roomCode, y: paddle2.y, playerNumber: 2 });
            }
            // Touch drag controls
            if (activeTouches.player2) {
                const targetY = activeTouches.player2.y - paddle2.height / 2;
                paddle2.y = Math.max(0, Math.min(canvas.height - paddle2.height, targetY));
                if (socket) socket.emit('paddleMove', { roomCode, y: paddle2.y, playerNumber: 2 });
            }
        }
    } else {
        // Local controls - Player 1
        if (keys['w'] || keys['W'] || touchControls.player1Up) {
            paddle1.move('up');
        }
        if (keys['s'] || keys['S'] || touchControls.player1Down) {
            paddle1.move('down');
        }
        // Touch drag for Player 1
        if (activeTouches.player1) {
            const targetY = activeTouches.player1.y - paddle1.height / 2;
            paddle1.y = Math.max(0, Math.min(canvas.height - paddle1.height, targetY));
        }

        // Player 2 controls or AI
        if (gameState.mode === 'double') {
            // Keyboard controls
            if (keys['ArrowUp'] || touchControls.player2Up) {
                paddle2.move('up');
            }
            if (keys['ArrowDown'] || touchControls.player2Down) {
                paddle2.move('down');
            }
            // Touch drag for Player 2
            if (activeTouches.player2) {
                const targetY = activeTouches.player2.y - paddle2.height / 2;
                paddle2.y = Math.max(0, Math.min(canvas.height - paddle2.height, targetY));
            }
        } else if (gameState.mode === 'single') {
            paddle2.updateAI(ball);
        }
    }

    // Update ball (only host in online mode)
    if (gameState.mode !== 'online' || isHost) {
        ball.update();

        // Check paddle collisions
        if (checkPaddleCollision(ball, paddle1)) {
            ball.dx = Math.abs(ball.dx);
            ball.x = paddle1.x + paddle1.width + ball.radius;
            
            const hitPos = (ball.y - (paddle1.y + paddle1.height / 2)) / (paddle1.height / 2);
            ball.dy = hitPos * ball.speed;
            ball.increaseSpeed();
        }

        if (checkPaddleCollision(ball, paddle2)) {
            ball.dx = -Math.abs(ball.dx);
            ball.x = paddle2.x - ball.radius;
            
            const hitPos = (ball.y - (paddle2.y + paddle2.height / 2)) / (paddle2.height / 2);
            ball.dy = hitPos * ball.speed;
            ball.increaseSpeed();
        }

        // Check if ball goes out of bounds (score)
        if (ball.x - ball.radius < 0) {
            gameState.player2Score++;
            updateScoreDisplay();
            ball.reset();
            if (gameState.mode === 'online' && socket) {
                socket.emit('scoreUpdate', { 
                    roomCode, 
                    player1Score: gameState.player1Score, 
                    player2Score: gameState.player2Score 
                });
            }
        } else if (ball.x + ball.radius > canvas.width) {
            gameState.player1Score++;
            updateScoreDisplay();
            ball.reset();
            if (gameState.mode === 'online' && socket) {
                socket.emit('scoreUpdate', { 
                    roomCode, 
                    player1Score: gameState.player1Score, 
                    player2Score: gameState.player2Score 
                });
            }
        }

        // Send ball position to other player if online
        if (gameState.mode === 'online' && socket) {
            socket.emit('ballUpdate', { 
                roomCode, 
                x: ball.x, 
                y: ball.y, 
                dx: ball.dx, 
                dy: ball.dy 
            });
        }
    }

    // Draw everything
    paddle1.draw();
    paddle2.draw();
    ball.draw();

    requestAnimationFrame(gameLoop);
}

// Socket.IO listeners
function setupSocketListeners() {
    if (!socket) return;

    socket.on('roomCreated', (data) => {
        roomCode = data.roomCode;
        playerNumber = data.playerNumber;
        isHost = true;
        showRoomMenu(roomCode);
    });

    socket.on('roomJoined', (data) => {
        roomCode = data.roomCode;
        playerNumber = data.playerNumber;
        isHost = false;
        showRoomMenu(roomCode);
    });

    socket.on('roomError', (message) => {
        document.getElementById('joinError').textContent = message;
        document.getElementById('joinError').classList.remove('hidden');
    });

    socket.on('gameReady', () => {
        document.getElementById('waitingMessage').classList.add('hidden');
        document.getElementById('readyMessage').classList.remove('hidden');
        
        setTimeout(() => {
            startGame('online');
        }, 2000);
    });

    socket.on('opponentPaddleMove', (data) => {
        if (data.playerNumber === 1) {
            paddle1.y = data.y;
        } else {
            paddle2.y = data.y;
        }
    });

    socket.on('ballSync', (data) => {
        ball.x = data.x;
        ball.y = data.y;
        ball.dx = data.dx;
        ball.dy = data.dy;
    });

    socket.on('scoreSync', (data) => {
        gameState.player1Score = data.player1Score;
        gameState.player2Score = data.player2Score;
        updateScoreDisplay();
    });

    socket.on('opponentDisconnected', () => {
        alert('Opponent disconnected!');
        stopGame();
    });
}

// Menu navigation
document.getElementById('onePlayerBtn').addEventListener('click', () => {
    startGame('single');
});

document.getElementById('twoPlayerBtn').addEventListener('click', () => {
    startGame('double');
});

document.getElementById('onlineBtn').addEventListener('click', () => {
    showOnlineMenu();
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
    showMainMenu();
});

document.getElementById('createRoomBtn').addEventListener('click', () => {
    if (socket) {
        socket.emit('createRoom');
    }
});

document.getElementById('joinRoomBtn').addEventListener('click', () => {
    showJoinRoomMenu();
});

document.getElementById('submitJoinBtn').addEventListener('click', () => {
    const code = document.getElementById('roomCodeInput').value.toUpperCase().trim();
    if (code && socket) {
        document.getElementById('joinError').classList.add('hidden');
        socket.emit('joinRoom', code);
    }
});

document.getElementById('roomCodeInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('submitJoinBtn').click();
    }
});

document.getElementById('backFromJoinBtn').addEventListener('click', () => {
    showOnlineMenu();
});

document.getElementById('cancelRoomBtn').addEventListener('click', () => {
    if (socket && roomCode) {
        socket.disconnect();
        socket.connect();
        setupSocketListeners();
    }
    roomCode = null;
    playerNumber = null;
    isHost = false;
    showOnlineMenu();
});

document.getElementById('backBtn').addEventListener('click', () => {
    stopGame();
});

// View management
function showMainMenu() {
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('onlineMenu').classList.add('hidden');
    document.getElementById('roomMenu').classList.add('hidden');
    document.getElementById('joinRoomMenu').classList.add('hidden');
    document.getElementById('game').classList.add('hidden');
}

function showOnlineMenu() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('onlineMenu').classList.remove('hidden');
    document.getElementById('roomMenu').classList.add('hidden');
    document.getElementById('joinRoomMenu').classList.add('hidden');
    document.getElementById('game').classList.add('hidden');
}

function showRoomMenu(code) {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('onlineMenu').classList.add('hidden');
    document.getElementById('roomMenu').classList.remove('hidden');
    document.getElementById('joinRoomMenu').classList.add('hidden');
    document.getElementById('game').classList.add('hidden');
    
    document.getElementById('roomCodeDisplay').textContent = code;
    document.getElementById('waitingMessage').classList.remove('hidden');
    document.getElementById('readyMessage').classList.add('hidden');
}

function showJoinRoomMenu() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('onlineMenu').classList.add('hidden');
    document.getElementById('roomMenu').classList.add('hidden');
    document.getElementById('joinRoomMenu').classList.remove('hidden');
    document.getElementById('game').classList.add('hidden');
    
    document.getElementById('roomCodeInput').value = '';
    document.getElementById('joinError').classList.add('hidden');
}

function startGame(mode) {
    gameState.mode = mode;
    gameState.isPlaying = true;
    gameState.player1Score = 0;
    gameState.player2Score = 0;
    
    // Reset positions
    paddle1.y = canvas.height / 2 - 50;
    paddle2.y = canvas.height / 2 - 50;
    ball.reset();
    
    // Update display
    updateScoreDisplay();
    let modeText = mode === 'single' ? '1 Player' : mode === 'double' ? '2 Players' : 'Online';
    document.getElementById('modeDisplay').textContent = modeText;
    
    // Switch views
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('onlineMenu').classList.add('hidden');
    document.getElementById('roomMenu').classList.add('hidden');
    document.getElementById('joinRoomMenu').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    
    // Start game loop
    gameLoop();
}

function stopGame() {
    gameState.isPlaying = false;
    
    // Disconnect from online game if needed
    if (gameState.mode === 'online' && socket && roomCode) {
        socket.disconnect();
        socket.connect();
        setupSocketListeners();
        roomCode = null;
        playerNumber = null;
        isHost = false;
    }
    
    // Switch views
    document.getElementById('game').classList.add('hidden');
    showMainMenu();
    
    // Clear keys
    Object.keys(keys).forEach(key => keys[key] = false);
}

// Initialize
updateScoreDisplay();
setupTouchControls();

// Show/hide touch controls based on device
function checkTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

if (checkTouchDevice()) {
    // Show touch controls on touch devices
    const touchControlsEl = document.getElementById('touchControls');
    if (touchControlsEl) {
        touchControlsEl.style.display = 'flex';
    }
    // Show touch hint
    const touchHint = document.querySelector('.touch-hint');
    if (touchHint) {
        touchHint.style.display = 'block';
    }
    // Update control info text for touch devices
    const controlsInfo = document.querySelector('.controls-info');
    if (controlsInfo) {
        controlsInfo.innerHTML = '<p><strong>Touch controls enabled!</strong></p><p>Tap buttons or drag on your paddle side</p>';
    }
}
