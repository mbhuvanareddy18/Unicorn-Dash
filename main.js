const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const maxWidth = 900;
    const screenWidth = window.innerWidth;

    canvas.width = screenWidth < 920 ? screenWidth - 20 : maxWidth;
    canvas.height = 350;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let gameRunning = false;
let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;

const gameOverScreen = document.getElementById("gameOverScreen");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");

// Show stored best score on load
bestScoreDisplay.innerText = "Best: " + bestScore;

// ===== SOUND SYSTEM =====
const ambientSound = new Audio("assets/ambient.mp3");
ambientSound.loop = true;
ambientSound.volume = 0.2;

const jumpSound = new Audio("assets/jump.wav");
jumpSound.volume = 0.4;

// Load SVG Dino
const dinoImage = new Image();
dinoImage.src = "assets/dino.svg";

let groundOffset = 0;

let particles = [];
let clouds = [
    {x:200, y:80},
    {x:500, y:60},
    {x:750, y:100}
];

let skyParticles = [];

for(let i = 0; i < 40; i++){
    skyParticles.push({
        x: Math.random() * 900,
        y: Math.random() * 200,
        size: Math.random() * 3 + 1,
        alpha: Math.random(),
        speed: Math.random() * 0.3 + 0.1
    });
}

let dino = {
    x: 100,
    y: 260,
    width: 50,
    height: 50,
    dy: 0,
    gravity: 0.8,
    jumpPower: -14,
    grounded: true
};

let obstacle = {
    x: 900,
    y: 270,
    width: 25,
    height: 50,
    speed: 6
};

function drawClouds() {
    ctx.fillStyle = "#e0e7ff";
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 25, 0, Math.PI * 2);
        ctx.fill();
        cloud.x -= 0.3;
        if(cloud.x < -50) cloud.x = 950;
    });
}

function drawGround() {
    ctx.fillStyle = "#dbeafe";
    ctx.fillRect(0, 310, 900, 40);

    groundOffset -= obstacle.speed;
    if(groundOffset < -40) groundOffset = 0;

    ctx.strokeStyle = "#c7d2fe";
    for(let i = groundOffset; i < 900; i += 40){
        ctx.beginPath();
        ctx.moveTo(i, 310);
        ctx.lineTo(i+20, 350);
        ctx.stroke();
    }
}

function drawDino() {
    ctx.drawImage(dinoImage, dino.x, dino.y, dino.width, dino.height);
}

function drawObstacle() {
    const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
    gradient.addColorStop(0, "#f9a8d4");   // soft pink
    gradient.addColorStop(1, "#c4b5fd");   // soft lavender

    ctx.fillStyle = gradient;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    ctx.shadowColor = "#fbcfe8";
    ctx.shadowBlur = 15;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.shadowBlur = 0;
}

function createParticles() {
    particles.push({
        x: dino.x,
        y: dino.y + 40,
        size: Math.random()*4,
        alpha: 1
    });
}

function drawParticles() {
    particles.forEach((p,i) => {
        ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        p.x -= 2;
        p.alpha -= 0.02;
        if(p.alpha <= 0) particles.splice(i,1);
    });
}

function drawSkyParticles(){
    skyParticles.forEach(p => {
        ctx.fillStyle = `rgba(244,114,182,${p.alpha})`; // soft pink
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.y -= p.speed;

        if(p.y < 0){
            p.y = 200;
            p.x = Math.random() * 900;
        }
    });
}

function update() {
    ctx.clearRect(0,0,900,350);

    drawSkyParticles();
    drawClouds();
    drawGround();

    dino.dy += dino.gravity;
    dino.y += dino.dy;

    if(dino.y >= 260){
        dino.y = 260;
        dino.dy = 0;
        dino.grounded = true;
    }

    obstacle.x -= obstacle.speed;

    if(obstacle.x < -20){
        obstacle.x = 900;
        score += 10;
    }

    // Collision
    if(
        dino.x < obstacle.x + obstacle.width &&
        dino.x + dino.width > obstacle.x &&
        dino.y < obstacle.y + obstacle.height &&
        dino.y + dino.height > obstacle.y
    ){
        endGame();
    }

    createParticles();
    drawParticles();

    drawDino();
    drawObstacle();

    scoreDisplay.innerText = "Score: " + score;

    if(gameRunning) requestAnimationFrame(update);
}

document.addEventListener("keydown", e => {

    if((e.code === "ArrowUp" || e.code === "Space") && dino.grounded && gameRunning){
        dino.dy = dino.jumpPower;
        jumpSound.play();
        dino.grounded = false;
    }

    if(e.code === "ArrowDown" && gameRunning){
        dino.height = 30;
    }
});

document.addEventListener("keyup", e => {
    if(e.code === "ArrowDown"){
        dino.height = 50;
    }
});

// ===== GLOBAL TOUCH CONTROLS (FULL SCREEN) =====
let touchStartY = 0;

document.addEventListener("touchstart", function(e) {
    touchStartY = e.touches[0].clientY;

    if(dino.grounded && gameRunning){
        dino.dy = dino.jumpPower;
        jumpSound.play();
        dino.grounded = false;
    }
}, { passive: false });

document.addEventListener("touchmove", function(e) {
    let touchEndY = e.touches[0].clientY;

    // Swipe Down to Duck
    if(touchEndY - touchStartY > 30){
        dino.height = 30;
    }
}, { passive: false });

document.addEventListener("touchend", function() {
    dino.height = 50;
});

function startGame(){
    score = 0;
    obstacle.x = 900;
    gameRunning = true;
    ambientSound.play().catch(() => {});
    update();
}

function endGame(){
    gameRunning = false;
    ambientSound.pause();
    ambientSound.currentTime = 0;

    // Update Best Score
    if(score > bestScore){
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
        bestScoreDisplay.innerText = "Best: " + bestScore;
    }

    gameOverScreen.classList.add("active");
}

function restartGame(){
    gameOverScreen.classList.remove("active");
    startGame();
}

window.onload = function(){
    startGame();
};