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
    canvas.style.display = "block"; // Hiện game lên ngay
    countdownScreen.style.visibility = "visible";

    // Hiển thị kỷ lục cũ
    let highScore = localStorage.getItem("highScore") || 0;
    document.getElementById("highScoreDisplay").innerHTML = `<img src="./Image/${highScore}.png" width="20" height="30">`;

    let countdown = 3;
    countdownText.innerHTML = `<img src="./Image/${countdown}.png" width="30" height="60">`;

    bird.y = 250;
    bird.velocity = 0;
    bird.isFlapping = false;
    bird.angle = 0;
    pipes = [];
    score = 0;
    gameRunning = true;

    disableControls(); // Chặn điều khiển
    gameLoop(); // Chạy game ngay lập tức

    let countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownText.innerHTML = `<img src="./Image/${countdown}.png" width="40" height="60">`;
        } else {
            clearInterval(countdownInterval);
            countdownScreen.style.visibility = "hidden";
            enableControls(); // Bật điều khiển khi đếm xong
        }
    }, 1000);
}


function disableControls() {
    document.removeEventListener("keydown", flap);
    document.removeEventListener("touchstart", flap);
}

function enableControls() {
    document.addEventListener("keydown", flap);
    document.addEventListener("touchstart", flap);
}

function flap() {
    if (!gameRunning) return;
    bird.velocity = lift;
    bird.isFlapping = true;
    bird.angle = -20;
    flapSound.play().catch(err => console.log("Audio Play Error: ", err));
    setTimeout(() => bird.isFlapping = false, 150);
}

function runGame() {
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
    drawHighScore(); // 🏆 Vẽ high score ở góc trái trên cùng

    requestAnimationFrame(gameLoop);
}


function updateBird() {
    if (countdownScreen.style.visibility === "visible") {
        bird.velocity = 0; // Ngăn chim rơi xuống
        bird.isFlapping = !bird.isFlapping; // Đổi trạng thái cánh mỗi frame
        return;
    }

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
        let gapHeight = 150;
        let pipeY = Math.random() * (canvas.height - gapHeight - 100) + 50;
        pipes.push({ x: canvas.width, y: pipeY, width: 80, height: gapHeight });
    }

    // Nếu đang đếm ngược thì không di chuyển ống nước
    if (countdownScreen.style.visibility === "visible") {
        return;
    }

    pipes.forEach(pipe => {
        pipe.x -= 2; // Ống nước di chuyển bình thường sau khi đếm xong
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
        // Vẽ ống trên
        ctx.drawImage(pipeTopImg, pipe.x, pipe.y - pipeTopImg.height * 1.5, pipe.width, pipeTopImg.height * 1.5);
        // Vẽ ống dưới
        ctx.drawImage(pipeBottomImg, pipe.x, pipe.y + pipe.height, pipe.width, pipeBottomImg.height * 1.5);
    });
}


function checkCollision(bird, pipe) {
    let birdRight = bird.x + bird.width;
    let birdBottom = bird.y + bird.height;

    let pipeLeft = pipe.x;
    let pipeRight = pipe.x + pipe.width;
    let pipeTopBottom = pipe.y; // Đỉnh của khoảng trống giữa ống

    let pipeBottomTop = pipe.y + pipe.height; // Đáy của khoảng trống giữa ống

    let pipeTopHeight = pipeTopImg.height * 10; // Độ cao chính xác của pipeTop
    let pipeBottomHeight = pipeBottomImg.height * 10; // Độ cao chính xác của pipeBottom

    // Va chạm với ống trên
    if (bird.x < pipeRight && birdRight > pipeLeft && bird.y < pipeTopBottom) {
        return true;
    }

    // Va chạm với ống dưới
    if (bird.x < pipeRight && birdRight > pipeLeft && birdBottom > pipeBottomTop) {
        return true;
    }

    return false;
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

function drawHighScore() {
    let highScore = localStorage.getItem("highScore") || 0;
    let scoreStr = highScore.toString();
    let startX = 10; // Góc trái trên cùng
    let startY = 10; // Khoảng cách từ trên xuống

    for (let i = 0; i < scoreStr.length; i++) {
        let digit = parseInt(scoreStr[i]);
        ctx.drawImage(scoreDigits[digit], startX + i * 20, startY, 20, 30);
    }
}



function drawBackground() {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
}

function gameOver() {
    gameRunning = false;

    // Kiểm tra và lưu kỷ lục nếu cần
    let highScore = localStorage.getItem("highScore") || 0;
    if (score > highScore) {
        localStorage.setItem("highScore", score);
    }

    setTimeout(showMenu,0); // Đợi 2 giây rồi quay lại menu
}

function showMenu() {
    menu.style.display = "block";
    canvas.style.display = "none";
}


document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        bird.velocity = lift;
        bird.isFlapping = true;
        bird.angle = -20;
        flapSound.play().catch(err => console.log("Audio Play Error: ", err));
        setTimeout(() => bird.isFlapping = false, 150);
    }
});

document.addEventListener("touchstart", function() {
    bird.velocity = lift;
    bird.isFlapping = true;
    bird.angle = -20;
    flapSound.play().catch(err => console.log("Audio Play Error: ", err));
    setTimeout(() => bird.isFlapping = false, 150);
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
