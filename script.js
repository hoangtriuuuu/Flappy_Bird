// script.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const newGameBtn = document.getElementById("newGame");
const continueGameBtn = document.getElementById("continueGame");

let flapSound, hitSound, scoreSound;

document.addEventListener("DOMContentLoaded", () => {
    flapSound = new Audio("./Sound/flap.wav");
    hitSound = new Audio("./Sound/hit.wav");
    scoreSound = new Audio("./Sound/score.wav");
    scoreSound.volume = 0.5;
});

canvas.width = 480;
canvas.height = 640;

const birdImg = new Image();
birdImg.src = "./Image/bird.png";
const birdFlapImg = new Image();
birdFlapImg.src = "./Image/bird_flap.png";
const pipeTopImg = new Image();
pipeTopImg.src = "./Image/pipeTop.png";
const pipeBottomImg = new Image();
pipeBottomImg.src = "./Image/pipeBottom.png";
const backgroundImg = new Image();
backgroundImg.src = "./Image/background.png";
const scoreDigits = [];
for (let i = 0; i <= 9; i++) {
    let img = new Image();
    img.src = `./Image/${i}.png`;
    scoreDigits.push(img);
}

let bird = { x: 100, y: 250, width: 34, height: 24, velocity: 0, isFlapping: false, angle: 0 };
let gravity = 0.5;
let lift = -8;
let pipes = [];
let score = 0;
let gameRunning = false;

function startGame() {
    menu.style.display = "none";
    canvas.style.display = "block";
    bird.y = 250;
    bird.velocity = 0;
    bird.isFlapping = false;
    bird.angle = 0;
    pipes = [];
    score = 0;
    gameRunning = true;
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updateBird();
    updatePipes();
    drawPipes();
    drawBird();
    drawScore();
    requestAnimationFrame(gameLoop);
}

function updateBird() {
    bird.velocity += gravity;
    bird.y += bird.velocity;
    
    if (bird.velocity < 0) {
        bird.angle = -20;
    } else {
        bird.angle = Math.min(bird.angle + 2, 45);
    }
    
    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        gameOver();
    }
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate((bird.angle * Math.PI) / 180);
    ctx.drawImage(
        bird.isFlapping ? birdFlapImg : birdImg,
        -bird.width / 2,
        -bird.height / 2,
        bird.width,
        bird.height
    );
    ctx.restore();
}

function updatePipes() {
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        let gapHeight = 300;
        let pipeY = Math.random() * (canvas.height - gapHeight - 100) + 50;
        pipes.push({ x: canvas.width, y: pipeY, width: 80, height: gapHeight });
    }
    pipes.forEach(pipe => {
        pipe.x -= 2;
        if (pipe.x + pipe.width < 0) {
            pipes.shift();
            score++;
            scoreSound.currentTime = 0;
            scoreSound.play().catch(err => console.log("Audio Play Error: ", err));
        }
        if (checkCollision(bird, pipe)) {
            gameOver();
        }
    });
}

function drawPipes() {
    pipes.forEach(pipe => {
        ctx.drawImage(pipeTopImg, pipe.x, pipe.y - pipeTopImg.height, pipe.width, pipeTopImg.height * 1.5);
        ctx.drawImage(pipeBottomImg, pipe.x, pipe.y + pipe.height, pipe.width, pipeBottomImg.height * 1.5);
    });
}

function checkCollision(bird, pipe) {
    return (
        (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x && bird.y < pipe.y) ||
        (bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x && bird.y + bird.height > pipe.y + pipe.height)
    );
}

function drawScore() {
    let scoreStr = score.toString();
    let scoreWidth = scoreStr.length * 30;
    let startX = (canvas.width - scoreWidth) / 2;
    for (let i = 0; i < scoreStr.length; i++) {
        let digit = parseInt(scoreStr[i]);
        ctx.drawImage(scoreDigits[digit], startX + i * 30, 10, 30, 50);
    }
}

function drawBackground() {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
}

function gameOver() {
    gameRunning = false;
    hitSound.play().catch(err => console.log("Audio Play Error: ", err));
    menu.style.display = "block";
    canvas.style.display = "none";
}

document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        flap();
    }
});

document.addEventListener("touchstart", function() {
    flap();
});

function flap() {
    bird.velocity = lift;
    bird.isFlapping = true;
    bird.angle = -20;
    flapSound.play().catch(err => console.log("Audio Play Error: ", err));
    setTimeout(() => bird.isFlapping = false, 150);
}

newGameBtn.addEventListener("click", startGame);
continueGameBtn.addEventListener("click", startGame);
