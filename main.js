
class Boi extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.drawRadius = 10;
        this.radius = 2;
        this.color = "Red" //Green,Blue,White
    }
    findNearestEnemy(species) {
        let nearest = { x:100000, y:100000};
        let distNearest = distance(this, nearest);
        this.game[species].forEach( other => {
            let distOther = distance(this, other);
            if (distNearest > distOther) {
                nearest = other;
                distNearest = distOther;
            }
        });
        return nearest;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.drawRadius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
    }
    moveToEnemyX(xTarget) {
        if (this.x < xTarget) { // go right 
            let diff = xTarget - this.x;
            let moveAmount = Math.min(diff, this.move);
            this.x += moveAmount;
            this.move -= moveAmount;
        } else if (this.x > xTarget) { // go left
            let diff = this.x - xTarget;
            let moveAmount = Math.min(diff, this.move);
            this.x -= moveAmount;
            this.move -= moveAmount;
        }
    }
    moveToEnemyY(yTarget) {
        if (this.y < yTarget) { // go down 
            let diff = yTarget - this.y;
            let moveAmount = Math.min(diff, this.move);
            this.y += moveAmount;
            this.move -= moveAmount;
        } else if (this.y > yTarget) { // go up
            let diff = this.y - yTarget;
            let moveAmount = Math.min(diff, this.move);
            this.y -= moveAmount;
            this.move -= moveAmount;
        }
    }
}

class SpaceMarine extends Boi {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = "Blue"
        this.killRange = 50;
        this.reloaded = true;
        this.reloadTime = 100;
        this.reloadStart = Date.now();
        this.speed = 1;
    }
    update() {
        const enemy = super.findNearestEnemy('tyranids');
        this.moveToEnemy(enemy);
        this.slayXenos(enemy);
    }
    moveToEnemy(enemy) {
        this.move = this.speed;
        let xTarget = getEnemyLaneXOrY(this, enemy, 'x');
        let yTarget = getEnemyLaneXOrY(this, enemy, 'y');
        if (this.inXLane()) {
            super.moveToEnemyX(xTarget);
            super.moveToEnemyY(yTarget);
        } else {
            super.moveToEnemyY(yTarget);
            super.moveToEnemyX(xTarget);
        }
        // if (this.move == this.speed) {
        //     console.log(this, enemy);
        //     console.log(xTarget)
        //     console.log(yTarget);
        // }
    }
    slayXenos(enemy) {
        // can only kill with line of sight
        if (enemy.x != this.x && enemy.y != this.y)
            return; 
        // check reload progress
        if (!this.reloaded && this.reloadStart < Date.now() - this.reloadtime) 
            this.reloaded = true;
        // attempt to kill
        if (this.reloaded && distance(this, enemy) <= this.killRange) {
            enemy.removeFromWorld = true;
            this.reloaded = false;
            this.reloadStart = Date.now();
            // if (this.game.spawnTyranid)
            //     this.game.spawnAnotherTyranid = true;
            // this.game.spawnTyranid = true;
            // spawnTyranid(this.game);
        }
    }
    inXLane() {
        // an X lane is a row left/right across the grid where you can adjust x freely legally
        return (this.y - STARTY) % LANE_WIDTH === 0;
    }
}

class Tyranid extends Boi {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 2.5;
        this.smellRange = 400;
        this.randomTimer = Date.now();
    }
    update() {
        const enemy = super.findNearestEnemy('marines');
        if (this.smellRange >= distance(this, enemy))
            this.moveToEnemy(enemy);
        else 
            this.moveRandomly();
        this.slayMarine(enemy);
    }
    moveToEnemy(enemy) {
        this.move = this.speed;
        let xTarget = getEnemyLaneXOrY(this, enemy, 'x');
        let yTarget = getEnemyLaneXOrY(this, enemy, 'y');

        if (this.inXLane()) {
            super.moveToEnemyX(xTarget);
            super.moveToEnemyY(yTarget);
        } else {
            super.moveToEnemyY(yTarget);
            super.moveToEnemyX(xTarget);
        }
    }
    moveRandomly() {
        if (!this.currentRandomTarget || Date.now() - 1000 > this.randomTimer) {
            this.randomTimer = Date.now();
            this.currentRandomTarget = this.getNewRandomTarget();
        }
        this.moveToEnemy(this.currentRandomTarget);
    }
    getNewRandomTarget() {
        let target = {};
        let dir = Math.random();
        if (dir < 0.25) {
            target.x = this.x
            target.y = this.y - LANE_WIDTH;
        } else if(dir < 0.5) {
            target.x = this.x + LANE_WIDTH
            target.y = this.y;
        } else if(dir < 0.75) {
            target.x = this.x - LANE_WIDTH
            target.y = this.y;
        }else {
            target.x = this.x
            target.y = this.y + LANE_WIDTH;
        }
        if (target.x < STARTX)
            target.x += 2 * LANE_WIDTH;
        else if (target.y < STARTY)
            target.y += 2 * LANE_WIDTH;
        else if (target.x > STARTX + LANE_WIDTH * 18)
            target.x -= 2 * LANE_WIDTH;
        else if (target.y > STARTY + LANE_WIDTH * 18)
            target.y -= 2 * LANE_WIDTH;
        return target;
    }
    slayMarine(enemy) {
        if (isCircleCollidingWithCircle(this, enemy)) {
            enemy.removeFromWorld = true;
            // if(this.game.spawnMarine) 
            //     this.game.spawnAnotherMarine = true;
            // this.game.spawnMarine = true;
            this.removeFromWorld = true;
            // if(this.game.spawnTyranid) 
            //     this.game.spawnAnotherTyranid = true;
            // this.game.spawnTyranid = true;
        }
    }
    closerInX(enemy) {
        return Math.abs(this.x - enemy.x) < Math.abs(this.y - enemy.y);
    }
    inXLane() {
        // an X lane is a row left/right across the grid where you can adjust x freely legally
        return (this.y - STARTY) % LANE_WIDTH === 0;
    }
    countNearbyAllies() {
        let count = 0;
        this.game.tyranids.forEach( nid => {
            if (distance(this, nid) < 100)
                count++;
        });
        return count;
    }
}

function isCircleCollidingWithCircle(circle1, circle2) {
    let dx = circle1.x - circle2.x;
    let dy = circle1.y - circle2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if(distance < circle1.radius + circle2.radius){
           return true;
    }
    return false;
}

function getEnemyLaneXOrY(me, enemy, xOrY) { // legit pass 'x' or 'y' 
    if ((enemy[xOrY] - STARTX) % LANE_WIDTH === 0) 
        return enemy[xOrY];             // they're in a predefined lane
    else if (me[xOrY] > enemy[xOrY])    // they're left of me (x) / above me (y)
        return (Math.floor((enemy[xOrY] - STARTX) / LANE_WIDTH + 1)) * LANE_WIDTH + STARTX;
    else                                // they're right of me (x) / below me (y)
        return (Math.floor((enemy[xOrY] - STARTX) / LANE_WIDTH)) * LANE_WIDTH + STARTX;
}

function distance(a, b) {
    var dx = Math.abs(a.x - b.x);
    var dy = Math.abs(a.y - b.y);
    return Math.sqrt(dx * dx + dy * dy);
}

const GO_PATH = "./img/960px-Blank_Go_board.png";
const BACKGROUND_SCALE = 0.86;
const LANE_WIDTH = 50 * BACKGROUND_SCALE;
const STARTX = 30 * BACKGROUND_SCALE;
const STARTY = 30 * BACKGROUND_SCALE;
const TYRANID_COUNT = 20;
const MARINE_COUNT = 4;

class Background extends Entity {
    constructor(game, AM, srcX, srcY, srcW, srcH, x, y) {
        super(game, x, y);
        this.spriteSheet = AM.getAsset(GO_PATH);
        this.scale = BACKGROUND_SCALE;
        this.srcX = srcX;
        this.srcY = srcY;
        this.srcW = srcW;
        this.srcH = srcH;
        this.updateTimer = 0;
        this.updateIndex = 0;
    }
    draw(ctx) {
        ctx.drawImage(this.spriteSheet, this.srcX, this.srcY, 
            this.srcW, this.srcH, this.x, this.y, this.srcW * this.scale, this.srcH * this.scale);
    }
}

// taken from mozilla.org MDN
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

function spawnTyranid(game) {
    game.addTyranid(new Tyranid(game, STARTX + LANE_WIDTH * getRandomInt(19), STARTY + LANE_WIDTH * getRandomInt(19)));
}
let marineArrayCount = 0;
const marineArray = [];
function generateMarineSpawnArray() {
    for (let i = 0; i < 13; i++) {
        marineArray.push({x:STARTX + LANE_WIDTH * 3, y: STARTY + LANE_WIDTH * (3 + i)})
    }
    for (let i = 1; i < 13; i++) {
        marineArray.push({x:STARTX + LANE_WIDTH * (3 + i), y: STARTY + LANE_WIDTH * 15})
    }
    for (let i = 12; i > -1; i--) {
        marineArray.push({x:STARTX + LANE_WIDTH * 15, y: STARTY + LANE_WIDTH * (3 + i)})
    }
    for (let i = 12; i > 0; i--) {
        marineArray.push({x:STARTX + LANE_WIDTH * (3 + i), y: STARTY + LANE_WIDTH * 3})
    }
}
function spawnMarine(game) {
    if (marineArrayCount >= marineArray.length)
        marineArrayCount = 0;
    // console.log(marineArray)
    game.addMarine(new SpaceMarine(game, marineArray[marineArrayCount].x, marineArray[marineArrayCount++].y));
}

const socket = io.connect("http://24.16.255.56:8888");
var ASSET_MANAGER = new AssetManager();
ASSET_MANAGER.queueDownload(GO_PATH);
ASSET_MANAGER.downloadAll(function () {
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    let saveButton = document.getElementById("save");
    let loadButton = document.getElementById("load");
    saveButton.onclick = function (e) {
        console.log('save pressed');
        let message = gameEngine.save();
        // console.log(message);
        socket.emit("save", message);
    };
    loadButton.onclick = function (e) {
        console.log('load pressed');
        console.log(socket);
        socket.emit("load", {studentname:"Conner Canning", statename:"sateName"});
    };
    socket.on("load", function(data) {
        console.log(data);
        let saveState = data.data;
        gameEngine.load(saveState);
    });
    socket.on("connect", function () {
        console.log("Socket connected.")
    });
    socket.on("disconnect", function () {
        console.log("Socket disconnected.")
    });
    socket.on("reconnect", function () {
        console.log("Socket reconnected.")
    });

    var gameEngine = new GameEngine();
    // gameEngine.addMarine(new SpaceMarine(gameEngine, STARTX /*+ LANE_WIDTH * 15*/, STARTY /*+ LANE_WIDTH* 15*/));
    // gameEngine.addTyranid(new Boi(gameEngine, STARTX + LANE_WIDTH * Math.random(19), STARTY + LANE_WIDTH * Math.random(19)));
    generateMarineSpawnArray();
    for (let i = 0; i < MARINE_COUNT; i++) {
        spawnMarine(gameEngine);
    }
    for (let i = 0; i < TYRANID_COUNT; i++) {
        spawnTyranid(gameEngine);
    }
    // gameEngine.addTyranid(new Boi(gameEngine, STARTX + LANE_WIDTH * 6, STARTY + LANE_WIDTH * 12));
    gameEngine.background = new Background(gameEngine, ASSET_MANAGER, 0, 0, 930, 930, 0, 0);
    gameEngine.init(ctx);
    gameEngine.start();
});
