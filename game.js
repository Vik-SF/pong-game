// Canvas setup
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = {
    isPlaying: false,
    mode: null, // 'single' or 'double'
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

    // Player 1 controls (W/S)
    if (keys['w'] || keys['W']) {
        paddle1.move('up');
    }
    if (keys['s'] || keys['S']) {
        paddle1.move('down');
    }

    // Player 2 controls (Arrow keys) or AI
    if (gameState.mode === 'double') {
        if (keys['ArrowUp']) {
            paddle2.move('up');
        }
        if (keys['ArrowDown']) {
            paddle2.move('down');
        }
    } else if (gameState.mode === 'single') {
        paddle2.updateAI(ball);
    }

    // Update ball
    ball.update();

    // Check paddle collisions
    if (checkPaddleCollision(ball, paddle1)) {
        ball.dx = Math.abs(ball.dx);
        ball.x = paddle1.x + paddle1.width + ball.radius;
        
        // Add some angle variation based on where ball hits paddle
        const hitPos = (ball.y - (paddle1.y + paddle1.height / 2)) / (paddle1.height / 2);
        ball.dy = hitPos * ball.speed;
        ball.increaseSpeed();
    }

    if (checkPaddleCollision(ball, paddle2)) {
        ball.dx = -Math.abs(ball.dx);
        ball.x = paddle2.x - ball.radius;
        
        // Add some angle variation
        const hitPos = (ball.y - (paddle2.y + paddle2.height / 2)) / (paddle2.height / 2);
        ball.dy = hitPos * ball.speed;
        ball.increaseSpeed();
    }

    // Check if ball goes out of bounds (score)
    if (ball.x - ball.radius < 0) {
        gameState.player2Score++;
        updateScoreDisplay();
        ball.reset();
    } else if (ball.x + ball.radius > canvas.width) {
        gameState.player1Score++;
        updateScoreDisplay();
        ball.reset();
    }

    // Draw everything
    paddle1.draw();
    paddle2.draw();
    ball.draw();

    requestAnimationFrame(gameLoop);
}

// Menu navigation
document.getElementById('onePlayerBtn').addEventListener('click', () => {
    startGame('single');
});

document.getElementById('twoPlayerBtn').addEventListener('click', () => {
    startGame('double');
});

document.getElementById('backBtn').addEventListener('click', () => {
    stopGame();
});

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
    document.getElementById('modeDisplay').textContent = mode === 'single' ? '1 Player' : '2 Players';
    
    // Switch views
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    
    // Start game loop
    gameLoop();
}

function stopGame() {
    gameState.isPlaying = false;
    
    // Switch views
    document.getElementById('game').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    
    // Clear keys
    Object.keys(keys).forEach(key => keys[key] = false);
}

// Initialize
updateScoreDisplay();

