// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Game state
const game = {
    running: true,
    health: 100,
    maxHealth: 100,
    score: 0,
    wave: 1,
    ammo: 30,
    maxAmmo: 30,
    waveEnemies: 5,
    enemiesKilled: 0
};

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 30,
    height: 30,
    speed: 5,
    angle: 0,
    keys: {}
};

// Arrays to store game objects
let enemies = [];
let bullets = [];

// Mouse position for aiming
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// Initialize enemies for current wave
function initWave() {
    enemies = [];
    game.enemiesKilled = 0;
    const enemyCount = game.waveEnemies + (game.wave - 1) * 2;
    
    for (let i = 0; i < enemyCount; i++) {
        spawnEnemy();
    }
}

// Spawn a single enemy
function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -30;
            break;
        case 1: // Right
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            break;
        case 3: // Left
            x = -30;
            y = Math.random() * canvas.height;
            break;
    }
    
    const enemy = {
        x: x,
        y: y,
        width: 25,
        height: 25,
        speed: 2 + (game.wave * 0.5),
        health: 1 + Math.floor(game.wave / 2),
        maxHealth: 1 + Math.floor(game.wave / 2)
    };
    
    enemies.push(enemy);
}

// Update player position
function updatePlayer() {
    if (player.keys['ArrowUp'] || player.keys['w']) {
        player.y -= player.speed;
    }
    if (player.keys['ArrowDown'] || player.keys['s']) {
        player.y += player.speed;
    }
    if (player.keys['ArrowLeft'] || player.keys['a']) {
        player.x -= player.speed;
    }
    if (player.keys['ArrowRight'] || player.keys['d']) {
        player.x += player.speed;
    }
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Calculate angle to mouse
    player.angle = Math.atan2(mouseY - (player.y + player.height / 2), mouseX - (player.x + player.width / 2));
}

// Update enemies
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
        
        // Check collision with player
        if (checkCollision(player, enemy)) {
            game.health -= 1;
            enemies.splice(i, 1);
            continue;
        }
        
        // Remove if off screen (shouldn't happen but safety)
        if (enemy.x < -50 || enemy.x > canvas.width + 50 || enemy.y < -50 || enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
    
    // Check if wave cleared
    if (enemies.length === 0 && game.enemiesKilled >= (game.waveEnemies + (game.wave - 1) * 2)) {
        game.wave++;
        game.ammo = game.maxAmmo;
        initWave();
    }
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;
        
        // Check collision with enemies
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullet, enemies[j])) {
                enemies[j].health--;
                if (enemies[j].health <= 0) {
                    game.score += 10 * game.wave;
                    game.enemiesKilled++;
                    enemies.splice(j, 1);
                }
                hit = true;
                break;
            }
        }
        
        // Remove if off screen or hit
        if (hit || bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Draw player
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);
    
    // Body
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    
    // Gun barrel
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(player.width, 0);
    ctx.stroke();
    
    ctx.restore();
}

// Draw enemies
function drawEnemies() {
    for (const enemy of enemies) {
        // Body
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Health bar
        ctx.fillStyle = '#00ff00';
        const healthWidth = (enemy.health / enemy.maxHealth) * enemy.width;
        ctx.fillRect(enemy.x, enemy.y - 8, healthWidth, 4);
        
        // Health bar background
        ctx.strokeStyle = '#888';
        ctx.strokeRect(enemy.x, enemy.y - 8, enemy.width, 4);
    }
}

// Draw bullets
function drawBullets() {
    ctx.fillStyle = '#ffff00';
    for (const bullet of bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw crosshair
function drawCrosshair() {
    const size = 15;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // Horizontal
    ctx.beginPath();
    ctx.moveTo(mouseX - size, mouseY);
    ctx.lineTo(mouseX + size, mouseY);
    ctx.stroke();
    
    // Vertical
    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY - size);
    ctx.lineTo(mouseX, mouseY + size);
    ctx.stroke();
    
    // Center dot
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Update HUD
function updateHUD() {
    document.getElementById('health').textContent = Math.max(0, game.health);
    document.getElementById('score').textContent = game.score;
    document.getElementById('wave').textContent = game.wave;
    document.getElementById('ammo').textContent = game.ammo;
}

// Game over
function gameOver() {
    game.running = false;
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('gameOver').style.display = 'flex';
}

// Main game loop
function gameLoop() {
    if (!game.running) return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update
    updatePlayer();
    updateEnemies();
    updateBullets();
    
    // Check game over
    if (game.health <= 0) {
        gameOver();
        return;
    }
    
    // Draw
    drawEnemies();
    drawBullets();
    drawPlayer();
    drawCrosshair();
    
    // Update HUD
    updateHUD();
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    player.keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    player.keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
    if (game.ammo > 0) {
        const bullet = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            angle: player.angle,
            speed: 8,
            radius: 4
        };
        bullets.push(bullet);
        game.ammo--;
    }
});

// Reload ammo with R key
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        game.ammo = game.maxAmmo;
    }
});

// Start game
initWave();
gameLoop();
