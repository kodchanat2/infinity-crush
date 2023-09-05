var ctx;
var screen_scale;
const image = document.getElementById("item");
const imageSize = 40;
const itemSize = 10;
const itemPadding = 0.6;
const boardPadding = 2;
const bombTime = 10;
const gridSize = { w: 9, h: 10 };
const boardSize = { w: gridSize.w * (itemSize + itemPadding) - itemPadding, h: gridSize.h * (itemSize + itemPadding) - itemPadding };
const startPos = { x: 0, y: 0 };
const grid = [];
const STATE = {
  MOVING: -1,
  IDLE: 0,
  MATCHING: 1,
}

var rainbowParade = 0;
var bombTimer = 0;
var gameState = STATE.MOVING;

export function init(_ctx, _screen_scale) {
  ctx = _ctx;
  screen_scale = _screen_scale;
  startPos.x = (100 - boardSize.w) / 2;
  startPos.y = 200 - (200 - boardSize.h) / 2;


  for (let i = 0; i < gridSize.w; i++) {
    for (let j = 0; j < gridSize.h; j++) {
      if (!grid[i]) grid[i] = [];
      grid[i][j] = newItem(i, j, j + gridSize.h);
    }
  }
}

export function update() {
  drawBG();
  if (bombTimer === 0) gameState = STATE.IDLE;
  for (let i = 0; i < gridSize.w; i++) {
    for (let j = 0; j < gridSize.h; j++) {
      if (bombTimer > 0)
        grid[i][j].destroying();
      else
        grid[i][j].update();
      grid[i][j].draw();
    }
  }
  if (bombTimer > 0) {
    if (!--bombTimer) {
      // arrage grid
      for (let i = 0; i < gridSize.w; i++) {
        let n = 0;
        for (let j = 0; j + n < gridSize.h; j++) {
          if (grid[i][j].state == STATE.MATCHING) {
            grid[i].splice(j--, 1);
            n++;
          } else if (n > 0) {
            grid[i][j].y -= n;
          }
        }
        for (let j = 0; j < n; j++) {
          grid[i].push(newItem(i, gridSize.h - n + j, gridSize.h + j));
        }
      }
    }
  }
  else if (gameState == STATE.IDLE) {
    matching();
  }
}

function drawBG() {
  // draw line
  ctx.beginPath();
  ctx.lineWidth = 1 * screen_scale;
  var grd = ctx.createLinearGradient(100 * screen_scale, 30 * screen_scale, 0, 170 * screen_scale);
  ["red", "orange", "yellow", "lime", "green", "deepskyblue", "blue", "purple"].forEach((color, index) => {
    grd.addColorStop((8 - index / 8 + rainbowParade / 100) % 1, color);
  });
  rainbowParade = (rainbowParade + 0.2) % 100;
  ctx.strokeStyle = grd;
  ctx.roundRect((startPos.x - boardPadding) * screen_scale, (200 - startPos.y - boardPadding) * screen_scale, (boardSize.w + 2 * boardPadding) * screen_scale, (boardSize.h + 2 * boardPadding) * screen_scale, boardPadding * 2 * screen_scale);
  // for (let i = 1; i < 3; i++) {
  //   ctx.moveTo(canvas.width * i / 3, canvas.height);
  //   ctx.lineTo(canvas.width * i / 3, canvas.height - max_board * (ball_radius * 2 + ball_padding) * screen_scale);
  // }
  ctx.stroke();
  ctx.fillStyle = "#1d269a3c";
  ctx.fill();
}

function newItem(x, y, curY = gridSize.h) {
  return new Item(Math.floor(Math.random() * 6), x, y, curY);
}

function drawItem(item, x, y, size = 1) {
  if (item >= 6) return;
  ctx.drawImage(image, item * imageSize, 0, imageSize, imageSize, ((startPos.x + x * (itemSize + itemPadding)) + (1 - size) * itemSize / 2) * screen_scale, ((startPos.y - (y + 1) * (itemSize + itemPadding)) + (1 - size) * itemSize / 2) * screen_scale, itemSize * size * screen_scale, itemSize * size * screen_scale);
}

class Item {
  constructor(type, x, y, curY) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.curY = curY;
    this.velocity = 0;
    this.size = 0;
    this.state = STATE.IDLE;
  }

  update() {
    if (this.curY < gridSize.h && this.size < 1)
      this.size = Math.min(1, this.size + 0.2);
    if (this.curY == this.y) return;
    this.velocity += 0.01;
    this.curY -= this.velocity;
    gameState = STATE.MOVING;
    if (this.curY <= this.y) {
      this.curY = this.y;
      this.velocity = 0;
    }
  }

  destroying() {
    if (this.state == STATE.MATCHING && this.size > 0)
      this.size = Math.max(0, this.size - 1 / bombTime);
    if (this.size < 0) this.size = 0;
  }

  draw() {
    drawItem(this.type, this.x, this.curY, this.size);
  }
}

function matching() {
  var isMatch = false;
  for (let i = 0; i < gridSize.h; i++) {
    checkMatch('x', 0, i);
  }
  for (let i = 0; i < gridSize.w; i++) {
    checkMatch('y', i, 0);
  }
  if (isMatch) {
    console.log("matching: ", isMatch);
    bombTimer = bombTime;
  }

  function checkMatch(dir, x, y, type = -1, _stack = 0) {
    var stack = grid[x][y].type == type ? _stack + 1 : 1;
    if (dir == 'x') {
      if (x < gridSize.w - 1) {
        stack = Math.max(stack, checkMatch(dir, x + 1, y, grid[x][y].type, stack));
      }
      if (stack >= 3) {
        grid[x][y].state = STATE.MATCHING;
        isMatch = true;
      }
      if (type == grid[x][y].type) return stack;
      else return 1;
    }
    else if (dir == 'y') {
      if (y < gridSize.h - 1) {
        stack = Math.max(stack, checkMatch(dir, x, y + 1, grid[x][y].type, stack));
      }
      if (stack >= 3) {
        grid[x][y].state = STATE.MATCHING;
      }
      if (type == grid[x][y].type) return stack;
      else return 1;
    }
  }
}