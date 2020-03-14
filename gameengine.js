// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

class Timer {
    constructor() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
    }
    tick() {
        var wallCurrent = Date.now();
        var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;
        var gameDelta = Math.min(wallDelta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    }
}

class GameEngine {
    constructor() {
        this.marines = [];
        this.tyranids = [];
        this.showOutlines = false;
        this.ctx = null;
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.surfaceWidth = null;
        this.surfaceHeight = null;
    }
    init(ctx) {
        this.ctx = ctx;
        this.surfaceWidth = this.ctx.canvas.width;
        this.surfaceHeight = this.ctx.canvas.height;
        // this.startInput();
        this.timer = new Timer();
        console.log('game initialized');
    }
    start() {
        console.log("starting game");
        var that = this;
        (function gameLoop() {
            that.loop();
            requestAnimFrame(gameLoop, that.ctx.canvas);
        })();
    }
    addMarine(entity) {
        this.marines.push(entity);
    }
    addTyranid(entity) {
        this.tyranids.push(entity);
    }
    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();
        // drawWalls(this.ctx);
        this.background.draw(this.ctx);
        drawWalls(this.ctx);
        for (var i = 0; i < this.marines.length; i++) {
            this.marines[i].draw(this.ctx);
        }
        for (var i = 0; i < this.tyranids.length; i++) {
            this.tyranids[i].draw(this.ctx);
        }
        this.ctx.restore();
    }
    updateMarines() {
        var entitiesCount = this.marines.length;
        for (var i = 0; i < entitiesCount; i++) {
            var entity = this.marines[i];
            if (!entity.removeFromWorld) {
                entity.update();
            }
        }
        for (var i = this.marines.length - 1; i >= 0; --i) {
            if (this.marines[i].removeFromWorld) {
                this.marines.splice(i, 1);
            }
        }
    }
    updateTyranids() {
        var entitiesCount = this.tyranids.length;
        for (var i = 0; i < entitiesCount; i++) {
            var entity = this.tyranids[i];
            if (!entity.removeFromWorld) {
                entity.update();
            }
        }
        for (var i = this.tyranids.length - 1; i >= 0; --i) {
            if (this.tyranids[i].removeFromWorld) {
                this.tyranids.splice(i, 1);
            }
        }
    }
    updateMarineCount() {
        for (let i = this.marines.length; i < MARINE_COUNT; i++) {
            spawnMarine(this);
        }            
    }
    updateTyranidCount() {
        for (let i = this.tyranids.length; i < TYRANID_COUNT; i++) {
            spawnTyranid(this);
        }            
    }
    loop() {
        this.clockTick = this.timer.tick();
        this.updateMarines();
        this.updateTyranids();
        this.updateMarineCount();
        // this.updateTyranidCount();
        // if (this.spawnMarine) {
        //     console.log("marine spawned");
        //     spawnMarine(this);
        // }
        // if (this.spawnAnotherMarine) {
        //     console.log("anothermarine spawned");
        //     spawnMarine(this);
        // }
        // if (this.spawnTyranid) {
        //     console.log("tyranid spawned")
        //     spawnTyranid(this);
        // }
        // if (this.spawnAnotherTyranid) {
        //     console.log("another tyranid spawned")
        //     spawnTyranid(this);
        // }
        // this.spawnMarine = false;
        // this.spawnAnotherMarine = false;
        // this.spawnTyranid = false;
        // this.spawnAnotherTyranid = false;
        this.draw();
        this.click = null;
        this.rightclick = null;
        this.wheel = null;
    }
}

class Entity {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.removeFromWorld = false;
    }
    update() {
    }
    draw(ctx) {
        if (this.game.showOutlines && this.radius) {
            this.game.ctx.beginPath();
            this.game.ctx.strokeStyle = "green";
            this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.game.ctx.stroke();
            this.game.ctx.closePath();
        }
    }
    rotateAndCache(image, angle) {
        var offscreenCanvas = document.createElement('canvas');
        var size = Math.max(image.width, image.height);
        offscreenCanvas.width = size;
        offscreenCanvas.height = size;
        var offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.save();
        offscreenCtx.translate(size / 2, size / 2);
        offscreenCtx.rotate(angle);
        offscreenCtx.translate(0, 0);
        offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
        offscreenCtx.restore();
        //offscreenCtx.strokeStyle = "red";
        //offscreenCtx.strokeRect(0,0,size,size);
        return offscreenCanvas;
    }
}