
let board;
let boardWidth = 360;
let boardHeight = 576;
let context;


/// doodle char
let doodlerWidth = 46;
let doodlerHeight = 46;
let doodlerX = boardWidth / 2 - doodlerWidth / 2;
let doodlerY = boardHeight * 7 / 8 - doodlerHeight;
let doodlerRightImg;
let doodlerLeftImg;



let doodler = {
    img: null,
    x: doodlerX,
    y: doodlerY,
    width: doodlerWidth,
    height: doodlerHeight
};


/// jump gravity
let velocityX = 0;
let velocityY = 0;
let jumpVelocity = -10;
let bounceGravity = 0.4;
let fallGravity = 0.4;



/// platform
let platformArray = [];
let platformWidth = 80;
let platformHeight = 18;
let platformImg;
let breakablePlatformImg;


/// stars
let stars = [];
let numStars = 100;


///
let score = 0;
let maxScore = 0;
let gameOver = false;
let highScore = 0;
let playerName = '';
let lastYPosition = doodlerY;







window.onload = function () {
    playerName = prompt("Enter your name (Max 8 characters):");
    playerName = playerName ? playerName.substring(0, 8) : "Player";

    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    board.style.margin = "auto";
    board.style.display = "block";

    doodlerRightImg = new Image();
    doodlerRightImg.src = "./doodler-right.png";
    doodlerLeftImg = new Image();
    doodlerLeftImg.src = "./doodler-left.png";
    platformImg = new Image();
    platformImg.src = "./platform.png";
    breakablePlatformImg = new Image();
    breakablePlatformImg.src = "./platform-broken.png";

    doodler.img = doodlerRightImg;
    velocityY = jumpVelocity;

    doodlerRightImg.onload = function () {
        platformImg.onload = function () {
            placePlatforms();
            generateStars();
            requestAnimationFrame(update);
        };
    };

    document.addEventListener("keydown", moveDoodler);
};








function update() {
    if (gameOver) return;

    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    drawStars();

    doodler.x += velocityX;
    if (doodler.x > boardWidth) doodler.x = 0;
    if (doodler.x + doodler.width < 0) doodler.x = boardWidth;

    if (velocityY < 0) {
        velocityY += bounceGravity;
    } else {
        velocityY += fallGravity;
    }
    doodler.y += velocityY;

    const doodlerThreshold = boardHeight / 2;
    if (doodler.y < doodlerThreshold) {
        const offset = doodlerThreshold - doodler.y;
        doodler.y = doodlerThreshold;

        for (let platform of platformArray) {
            platform.y += offset;
        }

        for (let star of stars) {
            star.y = (star.y + offset) % boardHeight;
        }

        score += offset * 0.1;
    }

    if (doodler.y > boardHeight) gameOver = true;

    context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);

    let toRemove = [];
    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];

        if (detectCollision(doodler, platform) && velocityY >= 0) {
            if (platform.isBreakable) {
                toRemove.push(i);
            }
            velocityY = jumpVelocity;
        }

        context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
    }

    for (let index of toRemove) {
        platformArray.splice(index, 1);
    }

    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift();
        newPlatform();
    }

    updateScore();
    displayText();

    if (gameOver) {
        displayGameOver();
    }
}




/// character control function
function moveDoodler(e) {
    if (e.code === "ArrowRight" || e.code === "KeyD") {
        velocityX = 4;
        doodler.img = doodlerRightImg;
    } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        velocityX = -4;
        doodler.img = doodlerLeftImg;
    } else if (e.code === "Space") {
        if (gameOver) {
            resetGame();
            requestAnimationFrame(update);
        }
    }
}





/// increases Breakable_platform spawn generator by score
function getBreakableChance(score) {
    if (score >= 1500) return 0.7; // 80%
    if (score >= 1000) return 0.5; // 60%
    if (score >= 500) return 0.3;  // 40%
    return 0.1;                    // 20%
}



/// function platforms (Initializes and sets up the initial array of platforms at the start of the game.)
function placePlatforms() {
    platformArray = [];
    let platform = {
        img: platformImg,
        x: boardWidth / 2 - platformWidth / 2,
        y: boardHeight - platformHeight - 10,
        width: platformWidth,
        height: platformHeight,
        isBreakable: false
    };
    platformArray.push(platform);

    
    const minVerticalDistance = 50;
    const minHorizontalSpacing = 50;
    let currentX = platform.x;

    for (let i = 1; i <= 15; i++) {
        let randomX = Math.random() * (boardWidth - platformWidth);
        let randomY = boardHeight - (i * minVerticalDistance) - Math.random() * 55;

        while (Math.abs(currentX - randomX) < minHorizontalSpacing) {
            randomX = Math.random() * (boardWidth - platformWidth);
        }

        let breakableChance = getBreakableChance(score); // Get breakable platform chance
        let isBreakable = Math.random() < breakableChance; // Determine if the platform is breakable

        platform = {
            img: isBreakable ? breakablePlatformImg : platformImg,
            x: randomX,
            y: randomY,
            width: platformWidth,
            height: platformHeight,
            isBreakable: isBreakable
        };

        platformArray.push(platform);
        currentX = randomX;
    }
}



/// function newPlatform (Adds a new platform dynamically during the game as old platforms move off-screen.)
function newPlatform() {
    const minJumpableDistance = 30;
    const maxJumpableDistance = 60;

    let randomX = Math.random() * (boardWidth - platformWidth);
    let randomY = -Math.random() * (maxJumpableDistance - minJumpableDistance) - minJumpableDistance;

    let overlapping;
    do {
        overlapping = false;
        randomX = Math.random() * (boardWidth - platformWidth);

        for (let platform of platformArray) {
            if (
                randomX < platform.x + platform.width &&
                randomX + platformWidth > platform.x &&
                randomY < platform.y + platform.height &&
                randomY + platformHeight > platform.y
            ) {
                overlapping = true;
                break;
            }
        }
    } while (overlapping);

    let breakableChance = getBreakableChance(score); // Get breakable platform chance
    let isBreakable = Math.random() < breakableChance; // Determine if the platform is breakable

    let platform = {
        img: isBreakable ? breakablePlatformImg : platformImg,
        x: randomX,
        y: randomY,
        width: platformWidth,
        height: platformHeight,
        isBreakable: isBreakable
    };

    platformArray.push(platform);
}





/// function Collision
function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}




/// function Score update mechanism
function updateScore() {
    let scoreIncrementRate = 0.5;
    if (doodler.y < lastYPosition) {
        score += scoreIncrementRate;
        lastYPosition = doodler.y;
    }
    if (score > highScore) highScore = score;
}




/// function display text (for scoring)
function displayText() {
    context.fillStyle = "white";
    context.font = "25px 'Gloria Hallelujah', cursive";
    context.fillText(`${playerName} ${Math.floor(score)}`, 5, 20);
}



/// function display Game Over to the screen
function displayGameOver() {
    context.fillStyle = "white";
    context.font = "15px 'Gloria Hallelujah', cursive";
    context.fillText(`High Score: ${Math.floor(highScore)}`, boardWidth / 2 - 100, 30);
    context.fillText("Game Over: Press 'Space' to Restart", boardWidth / 2 - 150, boardHeight / 2);
    context.fillText(`Your final score is ${Math.floor(score)}`, boardWidth / 2 - 100, boardHeight * 3 / 4);
}



/// function reset game
function resetGame() {
    doodler = {
        img: doodlerRightImg,
        x: doodlerX,
        y: doodlerY,
        width: doodlerWidth,
        height: doodlerHeight
    };
    velocityX = 0;
    velocityY = jumpVelocity;
    score = 0;
    gameOver = false;
    lastYPosition = doodlerY;
    platformArray = [];
    stars = [];
    placePlatforms();
    generateStars();
}





//// functions of stars (background)

function generateStars() {
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * boardWidth,
            y: Math.random() * boardHeight
        });
    }
}

function drawStars() {
    for (let star of stars) {
        context.fillStyle = "white";
        context.beginPath();
        context.arc(star.x, star.y, 1.5, 0, Math.PI * 2);
        context.fill();
    }
}
