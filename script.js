const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const placarButton = document.getElementById('placarButton');
const placar = document.getElementById('placar');
const ranking = document.getElementById('ranking');
const voltarButton = document.getElementById('voltarButton');
const livesElement = document.getElementById('lives');
const bgCanvas = document.getElementById('bg-canvas');
const hintElement = document.getElementById('hint');
let score = 0;
let level = 0;
let gameRunning = false;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
if (highScores.length > 0 && typeof highScores[0] !== 'object') {
    highScores = highScores.map(score => ({
        score: score,
        date: 'N/A',
        time: 'N/A'
    }));
}
let lives = 3;

// Efeitos sonoros
const collectSound = new Audio('https://freesound.org/data/previews/270/270304_5123851-lq.mp3');
const explosionSound = new Audio('https://freesound.org/data/previews/80/80921_1022651-lq.mp3');
const levelUpSound = new Audio('https://freesound.org/data/previews/320/320655_5260872-lq.mp3');
const gameOverSound = new Audio('https://freesound.org/data/previews/76/76376_877451-lq.mp3');

// Novo soundtrack open source
// Adicionando uma nova trilha sonora para o jogo
// Trilha sonora de aventura em 8-bit para o jogo
const gameSoundtrack = new Audio('https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg');
gameSoundtrack.loop = true;
gameSoundtrack.volume = 0.5; // Ajuste o volume conforme necessário
// Nota: Esta é uma trilha sonora de exemplo. Certifique-se de que a URL está funcionando e é apropriada para o jogo.
gameSoundtrack.loop = true;

function showHint() {
    hintElement.classList.remove('hidden');
    hintElement.style.opacity = '1';
    setTimeout(() => {
        hintElement.style.opacity = '0';
        setTimeout(() => {
            hintElement.classList.add('hidden');
        }, 500);
    }, 1500);
}

function createGameObject(type) {
    const object = document.createElement('div');
    object.classList.add(type);
    object.style.left = `${Math.random() * 100}%`;
    object.style.top = `${Math.random() * 100}%`;
    gameArea.appendChild(object);
    return object;
}

function createSparkle() {
    return createGameObject('sparkle');
}

function createBomb() {
    const bomb = createGameObject('bomb');
    bomb.vx = 0;
    bomb.vy = 0;
    return bomb;
}

function updateScore() {
    scoreElement.textContent = `Pontuação: ${score}`;
    scoreElement.classList.add('score-update');
    setTimeout(() => scoreElement.classList.remove('score-update'), 300);

    const newLevel = Math.floor(score / 10);
    if (newLevel > level) {
        level = newLevel;
        levelUpSound.play();
        levelElement.classList.add('level-up');
        setTimeout(() => levelElement.classList.remove('level-up'), 500);
    }
    levelElement.textContent = `Nível: ${level}`;

    // Atualiza a ambientação baseada na pontuação
    const maxDarkness = 0.7; // Valor máximo de escurecimento
    const darknessLevel = Math.min(score / 100, maxDarkness); // Aumenta gradualmente até o máximo
    const backgroundColor = `rgba(0, 0, 0, ${darknessLevel})`;
    bgCanvas.style.backgroundColor = backgroundColor;
}

function resetGame() {
    score = 0;
    level = 0;
    lives = 3;
    updateScore();
    updateLives();
    gameArea.innerHTML = '';
    showHint();
    gameSoundtrack.currentTime = 0;
    gameSoundtrack.play();
    bgCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0)'; // Reseta o fundo para transparente
    for (let i = 0; i < 10; i++) {
        createSparkle();
    }
    for (let i = 0; i < 5; i++) {
        createBomb();
    }
}

function updateLives() {
    livesElement.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        livesElement.appendChild(heart);
    }
}

function loseLife() {
    if (lives > 0) {
        lives--;
        const hearts = livesElement.querySelectorAll('.heart');
        hearts[lives].classList.add('heart-loss');
        if (lives === 0) {
            gameOver();
        }
    }
}

function gameOver() {
    gameRunning = false;
    menu.style.display = 'block';
    startButton.style.display = 'none';
    restartButton.style.display = 'inline-block';
    updateHighScores();
    gameSoundtrack.pause();
    gameOverSound.play();
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = '5px';
        particle.style.height = '5px';
        particle.style.backgroundColor = color;
        particle.style.borderRadius = '50%';
        gameArea.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        let opacity = 1;
        function animateParticle() {
            if (opacity <= 0) {
                gameArea.removeChild(particle);
                return;
            }
            opacity -= 0.02;
            particle.style.opacity = opacity;
            particle.style.left = `${parseFloat(particle.style.left) + vx}px`;
            particle.style.top = `${parseFloat(particle.style.top) + vy}px`;
            requestAnimationFrame(animateParticle);
        }
        animateParticle();
    }
}

let lastUpdateTime = 0;
const updateInterval = 1000 / 60; // 60 FPS

function updateBombPositions(currentTime) {
    if (!gameRunning) return;

    if (currentTime - lastUpdateTime < updateInterval) {
        requestAnimationFrame(updateBombPositions);
        return;
    }

    lastUpdateTime = currentTime;

    const bombs = document.querySelectorAll('.bomb');
    const mouseX = parseFloat(player.style.left) + 15;
    const mouseY = parseFloat(player.style.top) + 15;

    bombs.forEach(bomb => {
        const rect = bomb.getBoundingClientRect();
        const dx = mouseX - rect.left;
        const dy = mouseY - rect.top;
        const distance = Math.hypot(dx, dy);

        // Aumenta significativamente a aceleração e velocidade máxima
        const baseAcceleration = 1.2; // Dobrado
        const accelerationIncrease = 0.6; // Dobrado
        const acceleration = baseAcceleration + (level * accelerationIncrease);
        bomb.vx += (dx / distance) * acceleration;
        bomb.vy += (dy / distance) * acceleration;

        // Aumenta a velocidade máxima
        const baseMaxSpeed = 20; // Dobrado
        const maxSpeedIncrease = 2; // Dobrado
        const maxSpeed = baseMaxSpeed + (level * maxSpeedIncrease);
        const speed = Math.hypot(bomb.vx, bomb.vy);
        if (speed > maxSpeed) {
            bomb.vx = (bomb.vx / speed) * maxSpeed;
            bomb.vy = (bomb.vy / speed) * maxSpeed;
        }

        // Adiciona um movimento aleatório mais pronunciado
        bomb.vx += (Math.random() - 0.5) * 1.5;
        bomb.vy += (Math.random() - 0.5) * 1.5;

        // Atualiza a posição da bomba
        const newX = rect.left + bomb.vx;
        const newY = rect.top + bomb.vy;

        // Verifica colisão com as bordas (agora com mais elasticidade)
        if (newX < 0 || newX > window.innerWidth - 20) bomb.vx *= -1;
        if (newY < 0 || newY > window.innerHeight - 20) bomb.vy *= -1;

        bomb.style.left = `${newX}px`;
        bomb.style.top = `${newY}px`;

        if (distance < 30) {
            explosionSound.currentTime = 0;
            explosionSound.play();
            createParticles(rect.left, rect.top, '#FF0000', 30);
            loseLife();
            bomb.remove();
            createBomb();
        }
    });

    requestAnimationFrame(updateBombPositions);
}

let trail = [];
const trailLength = 10;

document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    player.style.left = `${mouseX - 15}px`;
    player.style.top = `${mouseY - 15}px`;

    // Adiciona novo elemento à trilha
    if (trail.length >= trailLength) {
        const oldTrail = trail.shift();
        gameArea.removeChild(oldTrail);
    }

    const trailElement = document.createElement('div');
    trailElement.classList.add('trail');
    trailElement.style.left = `${mouseX}px`;
    trailElement.style.top = `${mouseY}px`;
    gameArea.appendChild(trailElement);
    trail.push(trailElement);

    // Atualiza opacidade da trilha
    trail.forEach((element, index) => {
        element.style.opacity = (index + 1) / trailLength;
    });

    if (!gameRunning) return;

    const sparkles = document.querySelectorAll('.sparkle');

    sparkles.forEach(sparkle => {
        const rect = sparkle.getBoundingClientRect();
        const distance = Math.hypot(mouseX - rect.left, mouseY - rect.top);

        if (distance < 30) {
            collectSound.play();
            sparkle.remove();
            score++;
            updateScore();
            createSparkle();
            createParticles(rect.left, rect.top, '#FFD700', 15);
        }
    });

    // Gera novos inimigos conforme avança de level
    const bombCount = 5 + (level * 3); // Aumenta o número de bombas em 3x por nível
    while (document.querySelectorAll('.bomb').length < bombCount) {
        createBomb();
    }

    // Mantém um número fixo de sparkles
    const sparkleCount = 10;
    while (document.querySelectorAll('.sparkle').length < sparkleCount) {
        createSparkle();
    }
});

startButton.addEventListener('click', () => {
    gameRunning = true;
    menu.style.display = 'none';
    resetGame();
    setTimeout(() => {
        requestAnimationFrame(updateBombPositions);
    }, 1500);
    gameSoundtrack.play();
});

restartButton.addEventListener('click', () => {
    gameRunning = true;
    menu.style.display = 'none';
    resetGame();
    gameSoundtrack.play();
    setTimeout(() => {
        requestAnimationFrame(updateBombPositions);
    }, 1500);
});

placarButton.addEventListener('click', () => {
    menu.style.display = 'none';
    placar.style.display = 'block';
    updateRanking();
});

voltarButton.addEventListener('click', () => {
    placar.style.display = 'none';
    menu.style.display = 'block';
});

function updateHighScores() {
    const now = new Date();
    const scoreData = {
        score: score,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString()
    };
    highScores.push(scoreData);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function updateRanking() {
    const tbody = ranking.querySelector('tbody');
    tbody.innerHTML = '';
    highScores.forEach((scoreData, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${scoreData.score}</td>
            <td>${scoreData.date} ${scoreData.time}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Background animado otimizado
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

function createParticle(x, y) {
    return {
        x: x,
        y: y,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1
    };
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
    });
    requestAnimationFrame(drawParticles);
}

for (let i = 0; i < 50; i++) {
    particles.push(createParticle(Math.random() * canvas.width, Math.random() * canvas.height));
}

let lastMouseMoveTime = 0;
canvas.addEventListener('mousemove', (e) => {
    const currentTime = Date.now();
    if (currentTime - lastMouseMoveTime > 50) {
        for (let i = 0; i < 2; i++) {
            particles.push(createParticle(e.clientX, e.clientY));
        }
        if (particles.length > 200) particles = particles.slice(-200);
        lastMouseMoveTime = currentTime;
    }
});

drawParticles();

// Adicione este evento para garantir que o áudio possa ser reproduzido
document.addEventListener('click', () => {
    gameSoundtrack.play().catch(error => console.log("Erro ao reproduzir áudio:", error));
}, { once: true });