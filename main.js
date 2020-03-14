
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
            if (distNearest > distOther && !other.removeFromWorld) {
                nearest = other;
                distNearest = distOther;
            }
        });
        if (nearest.x === 100000)
            console.log("NO NEAREST ENEMY BOIII")
        return nearest;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.drawRadius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
    }
    moveToX(xTarget) {
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
    moveToY(yTarget) {
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
        this.killRange = 100;
        this.reloaded = true;
        this.reloadTime = 200;
        this.reloadStart = Date.now();
        this.speed = 1;
        this.targetLocation = {x:STARTX + LANE_WIDTH * 15, y:STARTY + LANE_WIDTH * 9}
        this.swarmThisGuy = 0;
        this.swarmTimer = Date.now() - 1000;
    }
    update() {
        this.swarmThisGuy = 0;
        const enemy = this.findNearestEnemy('tyranids');
        this.moveToEnemy(enemy);
        this.slayXenos(enemy);
    }
    moveToEnemy(enemy) {
        this.move = this.speed;
        let xTarget = getEnemyLaneXOrY(this, enemy, 'x');
        let yTarget = getEnemyLaneXOrY(this, enemy, 'y');
        if (this.inXLane()) {
            super.moveToX(xTarget);
            super.moveToY(yTarget);
        } else {
            super.moveToY(yTarget);
            super.moveToX(xTarget);
        }
    }
    slayXenos(enemy) {
        // can only kill with line of sight
        if (enemy.x != this.x && enemy.y != this.y)
            return; 
        // check reload progress
        if (!this.reloaded && this.reloadStart < Date.now() - this.reloadTime) 
            this.reloaded = true;
        // attempt to kill
        if (this.reloaded && distance(this, enemy) <= this.killRange) {
            enemy.removeFromWorld = true;
            this.reloaded = false;
            this.reloadStart = Date.now();
        }
    }
    findNearestEnemy(species) {
        let nearest = this.targetLocation;
        let distNearest = distance(this, nearest);
        this.game[species].forEach( other => {
            let distOther = distance(this, other);
            if (distNearest > distOther && !other.removeFromWorld && !isWallInTheWay(this, other) && !other.onAWall) {
                nearest = other;
                distNearest = distOther;
            }
        });
        if (nearest.x === this.targetLocation.x) {
            if (this.x === nearest.x) {
                console.log("REACHED TARGET LOCATION")
                this.targetLocation = Date.now() % 4
                this.handleTargetLocation();
            }
        }
        return nearest;
    }
    handleTargetLocation() {
        if (this.targetLocation === 0)
            this.targetLocation = {x:STARTX + LANE_WIDTH * 15, y:STARTY + LANE_WIDTH * 9}
        else if (this.targetLocation === 1)
            this.targetLocation = {x:STARTX + LANE_WIDTH * 9, y:STARTY + LANE_WIDTH * 3}
        else if (this.targetLocation === 2)
            this.targetLocation = {x:STARTX + LANE_WIDTH * 3, y:STARTY + LANE_WIDTH * 9}
        else if (this.targetLocation === 3)
            this.targetLocation = {x:STARTX + LANE_WIDTH * 9, y:STARTY + LANE_WIDTH * 15}
        else {
            console.log("unexpected marine target location");
            this.targetLocation = {x:STARTX + LANE_WIDTH * 15, y:STARTY + LANE_WIDTH * 9}
        }
    }
    inXLane() {
        // an X lane is a row left/right across the grid where you can adjust x freely legally
        return (this.y - STARTY) % LANE_WIDTH === 0;
    }
}

function isWallInTheWay(a, b) {
    // marines ignore aliens behind walls
    // aliens move up to walls and wait to breach
    let closeWall = STARTX + LANE_WIDTH * 2;
    let farWall = STARTX + LANE_WIDTH * 16;
    if (isWallBetweenUs(a, b, closeWall, 'x', 'y')) {
        return "left";
    } else if (isWallBetweenUs(a, b, farWall, 'x', 'y')) {
        return "right"
    } else if (isWallBetweenUs(a, b, closeWall, 'y', 'x')) {
        return "top"
    } else if (isWallBetweenUs(a, b, farWall, 'y', 'x')) {
        return "bot"
    }
    return false;
}
function isWallBetweenUs(me, them, wall, xOrY, theOtherXY) {
    // let mid = Math.abs(me[theOtherXY] - them[theOtherXY] / 2)
            // wall existance 
    return (me[xOrY] > wall && them[xOrY] < wall
        || me[xOrY] < wall && them[xOrY] > wall)
        && (// length of wall blocking our line of sight
            (me[theOtherXY] > STARTX + LANE_WIDTH * 4 && me[theOtherXY] < STARTX + LANE_WIDTH * 14) //between 4 & 14 wall length
         && (them[theOtherXY] > STARTX + LANE_WIDTH * 4 && them[theOtherXY] < STARTX + LANE_WIDTH * 14) 
        )
}
function onAWall(me) {
    let closeWall = STARTX + LANE_WIDTH * 2;
    let farWall = STARTX + LANE_WIDTH * 16;
    if (me.x === closeWall && me.y > STARTY + LANE_WIDTH * 4 && me.y < STARTY + LANE_WIDTH * 14)
        return 'left'
    if (me.x === farWall && me.y > STARTY + LANE_WIDTH * 4 && me.y < STARTY + LANE_WIDTH * 14)
        return 'left'
    if (me.y === closeWall && me.x > STARTX + LANE_WIDTH * 4 && me.x < STARTX + LANE_WIDTH * 14)
        return 'left'
    if (me.y === farWall && me.x > STARTX + LANE_WIDTH * 4 && me.x < STARTX + LANE_WIDTH * 14)
        return 'left'
    return false;
}

class Tyranid extends Boi {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 2.5;
        this.smellRange = 400;
        this.closeRange = 300;
        this.randomTimer = Date.now();
        this.onAWall = false;
    }
    update() {
        // if in close range and on a wall, stay and chill until backup arrives
        this.onAWall = onAWall(this);
        const enemy = super.findNearestEnemy('marines');
        if (this.closeRange >= distance(this, enemy) && this.onAWall)
            this.waitOnWall(enemy);
        else if (this.smellRange >= distance(this, enemy))
            this.moveToEnemy(enemy);
        else 
            this.moveRandomly();
        this.slayMarine(enemy);
    }
    waitOnWall(enemy) { // wait on wall until you have the numbers to swarm a guy
        enemy.swarmThisGuy++;
        if (enemy.swarmTimer > Date.now() - 1000) { // join existing swarm
            this.moveToEnemy(enemy)
        } else if (enemy.swarmThisGuy > WALL_THRESHOLD) { // start swarm
            enemy.swarmTimer = Date.now();
            this.moveToEnemy(enemy)
        } // else don't move :D


        // if (!this.waitOnWall)
        //     this.waitOnWall = true;
        // this.game[this.onAWall]++;
        // if (this.game[this.onAWall] > WALL_THRESHOLD) {
        //     enemy.swarmThisGuy = true;
        //     enemy.swarmTimer = Date.now();
        // }
        // if I have the bois with me we all go in
        
    }
    moveToEnemy(enemy) {
        this.move = this.speed;
        let xTarget = getEnemyLaneXOrY(this, enemy, 'x');
        let yTarget = getEnemyLaneXOrY(this, enemy, 'y');

        if (this.inXLane()) {
            super.moveToX(xTarget);
            super.moveToY(yTarget);
        } else {
            super.moveToY(yTarget);
            super.moveToX(xTarget);
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
            if (!enemy.removeFromWorld) {
                enemy.removeFromWorld = true;
                this.removeFromWorld = true;
            }
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
    let marine = new SpaceMarine(game, marineArray[marineArrayCount].x, marineArray[marineArrayCount++].y);
    marine.targetLocation = Math.floor(marineArrayCount / 12.5);
    marine.handleTargetLocation();
    game.addMarine(marine);
}

function drawWalls(ctx) {
    ctx.strokeStyle = "brown";
    ctx.lineWidth = 5;

    let closeWall = STARTX + LANE_WIDTH * 2;
    let farWall = STARTX + LANE_WIDTH * 16;

    ctx.beginPath();
    ctx.moveTo(closeWall, STARTY + LANE_WIDTH * 4);
    ctx.lineTo(closeWall, STARTY + LANE_WIDTH * 14);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(farWall, STARTY + LANE_WIDTH * 4);
    ctx.lineTo(farWall, STARTY + LANE_WIDTH * 14);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(STARTX + LANE_WIDTH * 4, closeWall);
    ctx.lineTo(STARTY + LANE_WIDTH * 14, closeWall);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(STARTX + LANE_WIDTH * 4, farWall);
    ctx.lineTo(STARTY + LANE_WIDTH * 14, farWall);
    ctx.stroke();


}

const TYRANID_COUNT = 30;
const MARINE_COUNT = 3;
const WALL_THRESHOLD = 5;

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
        console.log(message);
        socket.emit("save", message);
    };
    loadButton.onclick = function (e) {
        console.log('load pressed');
        console.log(socket);
        socket.emit("load", {studentname:"Conner Canning", statename:"state"});
    };
    socket.on("load", function(data) {
        console.log("LOADING RIGHT NOW", data.data);
        let saved = data.data;
        gameEngine.load(saved);
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

    // gameEngine.addTyranid(new Tyranid(gameEngine, STARTX + LANE_WIDTH * 1, STARTY + LANE_WIDTH * 8));
    // gameEngine.addTyranid(new Tyranid(gameEngine, STARTX + LANE_WIDTH * 3, STARTY + LANE_WIDTH * 8));
    // gameEngine.addMarine(new SpaceMarine(gameEngine, STARTX + LANE_WIDTH * 5, STARTY + LANE_WIDTH * 8));

    gameEngine.background = new Background(gameEngine, ASSET_MANAGER, 0, 0, 930, 930, 0, 0);
    gameEngine.init(ctx);
    gameEngine.start();
});
