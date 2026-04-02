<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Math Jumper</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700&display=swap');
        
        body {
            margin: 0;
            overflow: hidden;
            background-color: #1a202c; /* Tailwind gray-900 */
            font-family: 'Nunito', sans-serif;
            touch-action: none; /* Prevent scroll on touch devices */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }

        #game-container {
            position: relative;
            width: 100%;
            max-width: 800px;
            aspect-ratio: 4/3;
            background: #87CEEB; /* Sky blue */
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border-radius: 12px;
            overflow: hidden;
        }

        canvas {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 12px;
        }

        /* Overlay UI */
        #ui-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
            box-sizing: border-box;
        }

        .hud-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .equation-box {
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 25px;
            border-radius: 30px;
            font-family: 'Fredoka One', cursive;
            font-size: 28px;
            color: #2d3748;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 4px solid #4a5568;
            text-align: center;
        }

        .level-text {
            font-family: 'Fredoka One', cursive;
            font-size: 24px;
            color: white;
            text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        }

        /* Messages */
        #message-box {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Fredoka One', cursive;
            font-size: 48px;
            text-align: center;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            text-shadow: 3px 3px 0 #000;
        }
        .msg-success { color: #4ade80; } /* Green */
        .msg-error { color: #f87171; }   /* Red */

        /* Mobile Controls */
        #mobile-controls {
            display: none;
            width: 100%;
            max-width: 800px;
            justify-content: space-between;
            padding: 15px 20px;
            box-sizing: border-box;
            margin-top: 10px;
        }

        @media (max-width: 768px) {
            #mobile-controls { display: flex; }
            .equation-box { font-size: 20px; padding: 8px 16px; }
            .level-text { font-size: 18px; }
        }

        .control-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        .control-btn:active {
            background: rgba(255, 255, 255, 0.4);
        }
        .d-pad { display: flex; gap: 15px; }

        /* Screens */
        #start-screen, #end-screen {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            z-index: 50;
            pointer-events: auto;
        }
        
        .title {
            font-family: 'Fredoka One', cursive;
            font-size: 56px;
            margin-bottom: 20px;
            color: #fbbf24;
            text-shadow: 0 4px 0 #b45309;
            text-align: center;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
            font-family: 'Fredoka One', cursive;
            font-size: 24px;
            padding: 12px 32px;
            border-radius: 999px;
            border: 4px solid #1d4ed8;
            cursor: pointer;
            transition: transform 0.1s, filter 0.1s;
        }
        .btn-primary:hover { filter: brightness(1.1); }
        .btn-primary:active { transform: scale(0.95); }
    </style>
</head>
<body>

    <div id="game-container">
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        
        <div id="ui-layer">
            <div class="hud-header">
                <div class="level-text" id="level-display">Level 1</div>
                <div class="equation-box" id="equation-display">2 + ? = 5</div>
                <div style="width: 70px;"></div> <!-- Spacer for balance -->
            </div>
        </div>

        <div id="message-box" class="msg-success">CORRECT!</div>

        <!-- Start Screen -->
        <div id="start-screen">
            <h1 class="title">Math Jumper</h1>
            <p class="text-xl mb-8 text-center max-w-md">Find the correct number to solve the equation and unlock the door. Use Arrow Keys or On-Screen buttons to move.</p>
            <button class="btn-primary" onclick="startGame()">PLAY</button>
        </div>

        <!-- End Screen -->
        <div id="end-screen" style="display: none;">
            <h1 class="title" style="color: #4ade80;">You Win!</h1>
            <p class="text-xl mb-8">You're a math genius!</p>
            <button class="btn-primary" onclick="resetGame()">PLAY AGAIN</button>
        </div>
    </div>

    <div id="mobile-controls">
        <div class="d-pad">
            <div class="control-btn" id="btn-left">◀</div>
            <div class="control-btn" id="btn-right">▶</div>
        </div>
        <div class="control-btn" id="btn-jump">▲</div>
    </div>

<script>
    /**
     * Engine & Setup
     */
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // UI Elements
    const eqDisplay = document.getElementById('equation-display');
    const lvlDisplay = document.getElementById('level-display');
    const msgBox = document.getElementById('message-box');
    const startScreen = document.getElementById('start-screen');
    const endScreen = document.getElementById('end-screen');

    // Game Constants
    const GRAVITY = 0.6;
    const FRICTION = 0.8;
    const JUMP_POWER = -12;
    const SPEED = 5;
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;

    // Input State
    const keys = { left: false, right: false, up: false };

    // Game State
    let currentLevelIdx = 0;
    let doorUnlocked = false;
    let animationFrameId;
    let gameState = 'START'; // START, PLAYING, END

    /**
     * Level Data Definitions
     */
    const levels = [
        {
            // Level 1: Basics
            spawn: { x: 50, y: 400 },
            door: { x: 700, y: 440, w: 50, h: 60 },
            equation: { text: "2 + ? = 5", answer: 3 },
            pickups: [
                { x: 300, y: 470, val: 1 },
                { x: 450, y: 470, val: 3 },
                { x: 600, y: 470, val: 4 }
            ],
            platforms: [
                { x: 0, y: 500, w: 800, h: 100 } // Ground
            ]
        },
        {
            // Level 2: Subtraction & light jumping
            spawn: { x: 50, y: 300 },
            door: { x: 700, y: 440, w: 50, h: 60 },
            equation: { text: "10 - ? = 4", answer: 6 },
            pickups: [
                { x: 250, y: 350, val: 4 },
                { x: 400, y: 200, val: 6 }, // Requires jumping on platforms
                { x: 550, y: 470, val: 5 }
            ],
            platforms: [
                { x: 0, y: 500, w: 800, h: 100 },
                { x: 150, y: 400, w: 150, h: 20 },
                { x: 350, y: 280, w: 100, h: 20 }
            ]
        },
        {
            // Level 3: Pits & Traps
            spawn: { x: 50, y: 250 },
            door: { x: 700, y: 290, w: 50, h: 60 },
            equation: { text: "8 + ? = 15", answer: 7 },
            pickups: [
                { x: 250, y: 210, val: 6 }, // Trap path
                { x: 410, y: 320, val: 7 }, // Correct path
                { x: 570, y: 210, val: 9 }  // Trap path
            ],
            platforms: [
                { x: 0, y: 350, w: 150, h: 250 },   // Start platform
                { x: 220, y: 250, w: 60, h: 20 },   // Step 2 (Trap, high)
                { x: 220, y: 450, w: 60, h: 20 },   // Step 1 (Safe, low)
                { x: 330, y: 350, w: 160, h: 250 }, // Middle ground
                { x: 540, y: 250, w: 60, h: 20 },   // High Step (Trap)
                { x: 540, y: 450, w: 60, h: 20 },   // Low Step (Safe)
                { x: 610, y: 350, w: 190, h: 250 }  // End platform
            ]
        },
        {
            // Level 4: Tricky Subtraction
            spawn: { x: 50, y: 100 },
            door: { x: 50, y: 440, w: 50, h: 60 },
            equation: { text: "20 - ? = 11", answer: 9 },
            pickups: [
                { x: 700, y: 100, val: 9 }, // Far right top
                { x: 400, y: 300, val: 8 }, // Middle
                { x: 700, y: 470, val: 11 } // Far right bottom
            ],
            platforms: [
                { x: 0, y: 150, w: 150, h: 20 },  // Spawn ledge
                { x: 250, y: 220, w: 100, h: 20 },
                { x: 450, y: 150, w: 100, h: 20 },
                { x: 650, y: 150, w: 150, h: 20 }, // Top right
                { x: 350, y: 350, w: 100, h: 20 },
                { x: 0, y: 500, w: 800, h: 100 }   // Bottom ground
            ]
        },
        {
            // Level 5: Final Challenge
            spawn: { x: 380, y: 450 },
            door: { x: 375, y: 40, w: 50, h: 60 },
            equation: { text: "? + 13 = 21", answer: 8 },
            pickups: [
                { x: 100, y: 350, val: 6 },
                { x: 700, y: 350, val: 7 },
                { x: 100, y: 150, val: 8 },
                { x: 700, y: 150, val: 9 }
            ],
            platforms: [
                { x: 300, y: 500, w: 200, h: 100 }, // Center bottom
                { x: 150, y: 400, w: 80, h: 20 },
                { x: 570, y: 400, w: 80, h: 20 },
                { x: 50, y: 280, w: 80, h: 20 },
                { x: 670, y: 280, w: 80, h: 20 },
                { x: 150, y: 160, w: 80, h: 20 },
                { x: 570, y: 160, w: 80, h: 20 },
                { x: 350, y: 100, w: 100, h: 20 }   // Top center for door
            ]
        }
    ];

    /**
     * Entities
     */
    const player = {
        x: 0, y: 0, w: 32, h: 32,
        vx: 0, vy: 0,
        grounded: false,
        color: '#FFA500' // Orange
    };

    let currentPlatforms = [];
    let currentPickups = [];
    let currentDoor = null;
    let currentEquation = null;

    /**
     * Initialization & Logic
     */
    function loadLevel(index) {
        if (index >= levels.length) {
            gameState = 'END';
            endScreen.style.display = 'flex';
            return;
        }

        const lvl = levels[index];
        player.x = lvl.spawn.x;
        player.y = lvl.spawn.y;
        player.vx = 0;
        player.vy = 0;
        
        // Deep copy arrays so we don't modify originals
        currentPlatforms = JSON.parse(JSON.stringify(lvl.platforms));
        currentPickups = JSON.parse(JSON.stringify(lvl.pickups));
        // Add radius to pickups
        currentPickups.forEach(p => p.r = 18);

        currentDoor = { ...lvl.door };
        currentEquation = { ...lvl.equation };
        
        doorUnlocked = false;
        
        // Update UI
        lvlDisplay.innerText = `Level ${index + 1}`;
        eqDisplay.innerText = currentEquation.text;
    }

    function showMessage(text, isSuccess) {
        msgBox.innerText = text;
        msgBox.className = isSuccess ? 'msg-success' : 'msg-error';
        msgBox.style.opacity = 1;
        
        setTimeout(() => {
            msgBox.style.opacity = 0;
        }, 1500);
    }

    function resetCurrentLevel() {
        loadLevel(currentLevelIdx);
    }

    /**
     * Input Listeners
     */
    window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = true;
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = false;
    });

    // Touch controls
    const bindTouch = (id, key) => {
        const btn = document.getElementById(id);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
    };
    bindTouch('btn-left', 'left');
    bindTouch('btn-right', 'right');
    bindTouch('btn-jump', 'up');

    /**
     * Collision Helpers
     */
    function rectIntersect(r1, r2) {
        return r1.x < r2.x + (r2.w || r2.width) &&
               r1.x + r1.w > r2.x &&
               r1.y < r2.y + (r2.h || r2.height) &&
               r1.y + r1.h > r2.y;
    }

    function circleRectIntersect(circle, rect) {
        // Find closest point on rect to circle center
        let testX = circle.x;
        let testY = circle.y;

        if (circle.x < rect.x) testX = rect.x;
        else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;

        if (circle.y < rect.y) testY = rect.y;
        else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

        let distX = circle.x - testX;
        let distY = circle.y - testY;
        let distance = Math.sqrt((distX*distX) + (distY*distY));

        return distance <= circle.r;
    }

    /**
     * Main Update Loop
     */
    function update() {
        if (gameState !== 'PLAYING') return;

        // X Movement
        if (keys.left) player.vx -= 1.5;
        if (keys.right) player.vx += 1.5;
        
        player.vx *= FRICTION; // Friction
        
        // Cap speed
        if (player.vx > SPEED) player.vx = SPEED;
        if (player.vx < -SPEED) player.vx = -SPEED;

        // Apply X velocity
        player.x += player.vx;

        // X Collision with platforms
        for (let p of currentPlatforms) {
            if (rectIntersect(player, p)) {
                if (player.vx > 0) { // moving right
                    player.x = p.x - player.w;
                    player.vx = 0;
                } else if (player.vx < 0) { // moving left
                    player.x = p.x + p.w;
                    player.vx = 0;
                }
            }
        }

        // Screen boundaries (Left/Right)
        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (player.x + player.w > CANVAS_WIDTH) { player.x = CANVAS_WIDTH - player.w; player.vx = 0; }

        // Y Movement (Gravity & Jump)
        player.vy += GRAVITY;
        
        if (keys.up && player.grounded) {
            player.vy = JUMP_POWER;
            player.grounded = false;
        }

        // Apply Y velocity
        player.y += player.vy;
        player.grounded = false;

        // Y Collision with platforms
        for (let p of currentPlatforms) {
            if (rectIntersect(player, p)) {
                if (player.vy > 0) { // falling
                    player.y = p.y - player.h;
                    player.vy = 0;
                    player.grounded = true;
                } else if (player.vy < 0) { // jumping up hitting ceiling
                    player.y = p.y + p.h;
                    player.vy = 0;
                }
            }
        }

        // Fall out of bounds -> Death / Reset
        if (player.y > CANVAS_HEIGHT + 100) {
            showMessage("Oh no! Try again.", false);
            resetCurrentLevel();
        }

        // Pickup Collection
        for (let i = currentPickups.length - 1; i >= 0; i--) {
            let p = currentPickups[i];
            if (circleRectIntersect(p, player)) {
                // Check answer
                if (p.val === currentEquation.answer) {
                    doorUnlocked = true;
                    eqDisplay.innerText = currentEquation.text.replace('?', p.val);
                    showMessage("CORRECT!", true);
                } else {
                    showMessage("INCORRECT! Resetting...", false);
                    setTimeout(resetCurrentLevel, 500);
                }
                // Remove pickup
                currentPickups.splice(i, 1);
            }
        }

        // Door Collision
        if (doorUnlocked && rectIntersect(player, currentDoor)) {
            // Level complete
            currentLevelIdx++;
            loadLevel(currentLevelIdx);
        }
    }

    /**
     * Main Render Loop
     */
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Platforms
        ctx.fillStyle = '#2d3748'; // Dark gray/blue
        for (let p of currentPlatforms) {
            // Draw main block
            ctx.fillRect(p.x, p.y, p.w, p.h);
            // Draw grass top
            ctx.fillStyle = '#4ade80'; // Green
            ctx.fillRect(p.x, p.y, p.w, Math.min(10, p.h));
            ctx.fillStyle = '#2d3748'; // Revert
        }

        // Draw Door
        if (currentDoor) {
            // Door frame
            ctx.fillStyle = '#4a5568';
            ctx.fillRect(currentDoor.x - 5, currentDoor.y - 5, currentDoor.w + 10, currentDoor.h + 5);
            
            // Door interior
            ctx.fillStyle = doorUnlocked ? '#86efac' : '#fca5a5'; // Light green / Light red
            ctx.fillRect(currentDoor.x, currentDoor.y, currentDoor.w, currentDoor.h);
            
            // Door symbol / knob
            ctx.fillStyle = doorUnlocked ? '#16a34a' : '#dc2626'; // Dark green / Dark red
            
            if (doorUnlocked) {
                // Draw checkmark or open knob
                ctx.beginPath();
                ctx.arc(currentDoor.x + 10, currentDoor.y + currentDoor.h / 2, 5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw lock hole
                ctx.beginPath();
                ctx.arc(currentDoor.x + currentDoor.w / 2, currentDoor.y + currentDoor.h / 2, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(currentDoor.x + currentDoor.w / 2 - 4, currentDoor.y + currentDoor.h / 2, 8, 12);
            }
        }

        // Draw Pickups
        const time = Date.now();
        for (let p of currentPickups) {
            const bobbing = Math.sin(time / 200 + p.x) * 5; // Bob up and down
            const drawY = p.y + bobbing;

            // Glow
            const gradient = ctx.createRadialGradient(p.x, drawY, 0, p.x, drawY, p.r * 1.5);
            gradient.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
            gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, drawY, p.r * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Circle
            ctx.fillStyle = '#facc15'; // Yellow
            ctx.beginPath();
            ctx.arc(p.x, drawY, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ca8a04';
            ctx.stroke();

            // Number
            ctx.fillStyle = '#713f12';
            ctx.font = 'bold 20px "Fredoka One", cursive';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.val, p.x, drawY + 2); // +2 for visual center
        }

        // Draw Player
        ctx.fillStyle = player.color;
        // Rounded rect for player
        ctx.beginPath();
        ctx.roundRect(player.x, player.y, player.w, player.h, 8);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'white';
        let faceOffset = (player.vx / SPEED) * 4; // Look direction
        ctx.fillRect(player.x + 8 + faceOffset, player.y + 8, 6, 8);
        ctx.fillRect(player.x + 18 + faceOffset, player.y + 8, 6, 8);
        ctx.fillStyle = 'black';
        ctx.fillRect(player.x + 10 + faceOffset, player.y + 10, 4, 4);
        ctx.fillRect(player.x + 20 + faceOffset, player.y + 10, 4, 4);
    }

    /**
     * Game Loop execution
     */
    function loop() {
        if (gameState === 'PLAYING') {
            update();
            draw();
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    // Public API
    window.startGame = function() {
        startScreen.style.display = 'none';
        endScreen.style.display = 'none';
        currentLevelIdx = 0;
        gameState = 'PLAYING';
        loadLevel(currentLevelIdx);
        if(!animationFrameId) loop();
    };

    window.resetGame = function() {
        startGame();
    };

    // Initial draw (background only)
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
</script>
</body>
</html>