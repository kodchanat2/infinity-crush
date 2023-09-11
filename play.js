import { addScore } from "./script.js";

var ctx;
var screen_scale;
const image = document.getElementById("item");
const imageSize = 40;
const itemSize = 10;
const itemPadding = 0.6;
const boardPadding = 2;
const bombTime = 15;
const gridSize = { w: 9, h: 10 };
const boardSize = { w: gridSize.w * (itemSize + itemPadding) - itemPadding, h: gridSize.h * (itemSize + itemPadding) - itemPadding };
const startPos = { x: 0, y: 0 };
const grid = [];
const tmpfill = [];
const debugged = false;
const STATE = {
  MOVING: -1,
  IDLE: 0,
  MATCHING: 1,
}
const POWER = {
  NONE: 0,
  LINEX: 1,
  LINEY: 2,
  BOMB: 3,
}

var AUTOFILL = false;
var moveCount = 0;
var rainbowParade = 0;
var bombTimer = 0;
var swapTimer = 0;
var destroyingStage = 0;
var gameState = STATE.MOVING;
var touchState = STATE.IDLE;
var selectingItem = null;
var swapingItem = null;

export function init(_ctx, _screen_scale) {
  ctx = _ctx;
  screen_scale = _screen_scale;
  startPos.x = (100 - boardSize.w) / 2;
  startPos.y = 200 - (200 - boardSize.h) / 2;


  for (let i = 0; i < gridSize.w; i++) {
    grid[i] = [];
    tmpfill[i] = [];
    for (let j = 0; j < gridSize.h; j++) {
      grid[i][j] = newItem(i, j, j + gridSize.h);
    }
  }
}

export function setMode(mode) {
  AUTOFILL = mode;
}

export function update() {
  drawBG();
  drawSwaping();
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
      var blank = [];
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
        blank[i] = n;
      }
      bestfill().then(() => {
        for (let i = 0; i < gridSize.w; i++) {
          for (let j = 0; j < blank[i]; j++) {
            grid[i].push(newItem(i, gridSize.h - blank[i] + j, gridSize.h + j));
          }
        }
      });
    }
    else if (bombTimer == bombTime * 2) {
      destroyByLine();
    }
    else if (bombTimer == bombTime) {
      if (destroyingStage == 1) destroyByBomb();
      else destroyByLine();
    }
  }
  else if (gameState == STATE.IDLE) {
    matching();
  }
}

// ==================== touch ====================

function XYtoGridPos(x, y) {
  var gridPos = { x: Math.floor((x - startPos.x) / (itemSize + itemPadding)), y: Math.floor((startPos.y - y) / (itemSize + itemPadding)) };
  if (gridPos.x < 0 || gridPos.x > gridSize.w || gridPos.y < 0 || gridPos.y > gridSize.h) return { x: -1, y: -1 };
  return gridPos;
}

function touchCancel() {
  if (touchState == STATE.MATCHING && gameState == STATE.IDLE) return;
  touchState = STATE.IDLE;
  swapingItem = null;
  selectingItem = null;
}

function swapItem(gridPos, force = false) {
  if (selectingItem && selectingItem.x == gridPos.x && selectingItem.y == gridPos.y) return;
  if (selectingItem && Math.abs(selectingItem.x - gridPos.x) + Math.abs(selectingItem.y - gridPos.y) == 1) {
    swapingItem = grid[gridPos.x][gridPos.y];
    touchState = STATE.MATCHING;
    swapTimer = bombTime * 2;
  } else if (!force) {
    selectingItem = grid[gridPos.x][gridPos.y];
    swapingItem = null;
    touchState = STATE.MOVING;
  }
  else {
    touchCancel();
  }
}

export function touchStart(x, y) {
  if (gameState != STATE.IDLE || touchState == STATE.MATCHING) return touchCancel();
  var gridPos = XYtoGridPos(x, y);
  if (gridPos.x < 0) return touchCancel();
  swapItem(gridPos);
}

export function touchMove(x, y) {
  if (touchState != STATE.MOVING || gameState != STATE.IDLE) return touchCancel();
  var gridPos = XYtoGridPos(x, y);
  if (gridPos.x < 0) return touchCancel();
  swapItem(gridPos, true);
}

// ==================== draw ====================

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

  ctx.font = 5 * screen_scale + "px Comic Neue";
  ctx.fillStyle = "black";
  ctx.fillText("move: " + moveCount, 2 * screen_scale, 12 * screen_scale);
  ctx.font = "bold " + 10 * screen_scale + "px Comic Neue";
  ctx.textAlign = "center";
  ctx.fillStyle = grd;
  if (AUTOFILL)
    ctx.fillText("ALWAYS LUCKY", 50 * screen_scale, 38 * screen_scale);
}

function drawSwaping() {
  if (gameState != STATE.IDLE) {
    if (swapTimer > 0) moveCount++;
    swapTimer = 0;
    return touchCancel();
  }
  if (touchState == STATE.IDLE) return;
  const _diffSize = 0.4;
  const selectingPos = { x: selectingItem?.x || 0, y: selectingItem?.y || 0, size: 1 };
  const swapingPos = { x: swapingItem?.x || 0, y: swapingItem?.y || 0, size: 1 };
  if (touchState === STATE.MATCHING) {
    swapTimer--;
    var alpha = 0;
    if (swapTimer >= bombTime) {
      alpha = 1 - (swapTimer - bombTime) / bombTime;
    } else {
      alpha = (bombTime - swapTimer) / bombTime;
    }
    selectingPos.x = selectingItem.x + (swapingItem.x - selectingItem.x) * alpha;
    selectingPos.y = selectingItem.y + (swapingItem.y - selectingItem.y) * alpha;
    swapingPos.x = swapingItem.x + (selectingItem.x - swapingItem.x) * alpha;
    swapingPos.y = swapingItem.y + (selectingItem.y - swapingItem.y) * alpha;
    selectingPos.size = 1 + Math.sin(Math.PI * alpha) * _diffSize;
    swapingPos.size = 1 - Math.sin(Math.PI * alpha) * _diffSize;
  }
  if (swapingItem) {
    _drawArea(swapingItem);
    _drawItem(swapingItem, swapingPos);
  }
  if (selectingItem) {
    _drawArea(selectingItem);
    _drawItem(selectingItem, selectingPos);
  }
  if (touchState == STATE.MATCHING && swapTimer % bombTime == 0) {
    selectingItem.x = selectingPos.x;
    selectingItem.y = selectingPos.y;
    selectingItem.curY = selectingPos.y;
    swapingItem.x = swapingPos.x;
    swapingItem.y = swapingPos.y;
    swapingItem.curY = swapingPos.y;
    grid[selectingItem.x][selectingItem.y] = selectingItem;
    grid[swapingItem.x][swapingItem.y] = swapingItem;
    var tmp = selectingItem;
    selectingItem = swapingItem;
    swapingItem = tmp;
    if (swapTimer == 0) {
      touchState = STATE.IDLE;
      touchCancel();
    }
  }

  function _drawArea(item) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 0.5 * screen_scale;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.roundRect((startPos.x + item.x * (itemSize + itemPadding) - itemPadding / 2) * screen_scale, (startPos.y - (item.y + 1) * (itemSize + itemPadding) - itemPadding / 2) * screen_scale, (itemSize + itemPadding) * screen_scale, (itemSize + itemPadding) * screen_scale, itemPadding * screen_scale);
    ctx.fill();
    ctx.stroke();
  }
  function _drawItem(item, pos) {
    drawItem(item.type, pos.x, pos.y, item.power, item.size * pos.size);
  }
}

function newItem(x, y, curY = gridSize.h) {
  var type = Math.floor(Math.random() * 6);
  var stack = Math.floor(tmpfill[x][y] / 10);
  var _type = tmpfill[x][y] % 10;
  if (AUTOFILL && stack > 1 && stack <= 5 && _type >= 0 && _type < 6) type = _type;
  return new Item(type, x, y, curY);
}

function drawItem(type, x, y, power = POWER.NONE, size = 1) {
  if (type >= 6) return;
  ctx.drawImage(image, type * imageSize, power * imageSize, imageSize, imageSize, ((startPos.x + x * (itemSize + itemPadding)) + (1 - size) * itemSize / 2) * screen_scale, ((startPos.y - (y + 1) * (itemSize + itemPadding)) + (1 - size) * itemSize / 2) * screen_scale, itemSize * size * screen_scale, itemSize * size * screen_scale);
}

class Item {
  constructor(type, x, y, curY) {
    this.type = type;
    this.power = POWER.NONE;
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

  match() {
    if (this.state == STATE.MATCHING) return;
    this.state = STATE.MATCHING;
    addScore();
  }

  destroying() {
    if (this.power !== POWER.NONE && !destroyingStage) return;
    if (this.power == POWER.BOMB && destroyingStage < 2) return;
    if (this.state == STATE.MATCHING && this.size > 0)
      this.size = Math.max(0, this.size - 1 / bombTime);
    if (this.size < 0) this.size = 0;
  }

  draw() {
    if (touchState != STATE.IDLE && (this == selectingItem || this == swapingItem)) return;
    drawItem(this.type, this.x, this.curY, this.power, this.size);
  }
}

// ==================== ALGORITHM ====================

function matching() {
  var isMatch = false;
  var isLineMatch = false;
  var isBombMatch = false;
  for (let i = 0; i < gridSize.h; i++) {
    checkMatch('x', 0, i);
  }
  for (let i = 0; i < gridSize.w; i++) {
    checkMatch('y', i, 0);
  }
  // console.log("matching :", isMatch, isLineMatch, isBombMatch);
  if (isMatch) {
    gameState = STATE.MATCHING;
    bombTimer = bombTime;
    if (isLineMatch) bombTimer += bombTime;
    if (isBombMatch) bombTimer += bombTime;
  }
  else {
    logGrid();
  }

  function checkMatch(dir, x, y, type = -1, _stack = 0) {
    var stack = grid[x][y].type == type ? _stack + 1 : 1;

    if ((dir == 'x' && x < gridSize.w - 1) || (dir == 'y' && y < gridSize.h - 1)) {
      stack = Math.max(stack, checkMatch(dir, dir == 'x' ? x + 1 : x, dir == 'y' ? y + 1 : y, grid[x][y].type, stack));
    }
    if (stack >= 3) {
      grid[x][y].match();
      isMatch = true;
      if (grid[x][y].power == POWER.BOMB) isBombMatch = true;
      if (grid[x][y].power == POWER.LINEX || grid[x][y].power == POWER.LINEY) isLineMatch = true;
      if (stack > 10) {
        var center = Math.ceil(stack / 20);
        if (center === stack % 10) {
          grid[x][y].state = STATE.IDLE;
          grid[x][y].power = Math.floor(stack / 10) > 4 ? POWER.BOMB : dir == 'x' ? POWER.LINEX : POWER.LINEY;
        }
      }
    }
    if (type == grid[x][y].type) {
      if (stack > 10) return stack - 1;
      if (stack > 3) return stack * 10 + stack - 1;
      return stack;
    }
    else return 1;
  }
}

function destroyByLine() {
  // console.log('destroyByLine');
  for (let i = 0; i < gridSize.w; i++) {
    for (let j = 0; j < gridSize.h; j++) {
      if (grid[i][j].power == POWER.LINEX && grid[i][j].state == STATE.MATCHING) {
        for (let k = 0; k < gridSize.w; k++) {
          grid[k][j].match();
        }
      }
      if (grid[i][j].power == POWER.LINEY && grid[i][j].state == STATE.MATCHING) {
        for (let k = 0; k < gridSize.h; k++) {
          grid[i][k].match();
        }
        continue;
      }
    }
  }
  destroyingStage = 1;
}

function destroyByBomb() {
  // console.log('destroyByBomb');
  var bombtype = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < gridSize.w; i++) {
    for (let j = 0; j < gridSize.h; j++) {
      if (grid[i][j].power == POWER.BOMB && grid[i][j].state == STATE.MATCHING) {
        bombtype[grid[i][j].type]++;
      }
    }
  }
  for (let i = 0; i < gridSize.w; i++) {
    for (let j = 0; j < gridSize.h; j++) {
      if (bombtype[grid[i][j].type] > 0) {
        grid[i][j].match();
      }
    }
  }
  destroyingStage = 2;
}


function bestfill() {
  for (let i = 0; i < gridSize.w; i++) {
    for (let j = 0; j < gridSize.h; j++) {
      tmpfill[i][j] = 0;
    }
  }

  // L to R
  for (let j = 0; j < gridSize.h; j++) {
    for (let i = 0, lastType = -1, stack = 0; i < gridSize.w; i++) {
      [lastType, stack] = _survay(i, j, lastType, stack);
    }
  }
  // console.log(tmpfill);
  // R to L
  for (let j = 0; j < gridSize.h; j++) {
    for (let i = gridSize.w - 1, lastType = -1, stack = 0; i >= 0; i--) {
      [lastType, stack] = _survay(i, j, lastType, stack);
    }
  }
  // console.log(tmpfill);
  // T to B
  for (let i = 0; i < gridSize.w; i++) {
    for (let j = 0, lastType = -1, stack = 0; j < gridSize.h; j++) {
      [lastType, stack] = _survay(i, j, lastType, stack);
    }
  }
  // console.log(tmpfill);
  // B to T
  for (let i = 0; i < gridSize.w; i++) {
    for (let j = gridSize.h - 1, lastType = -1, stack = 0; j >= 0; j--) {
      [lastType, stack] = _survay(i, j, lastType, stack);
    }
  }
  // console.log(tmpfill);
  return Promise.resolve(true);

  function _survay(x, y, lastType, stack) {
    if (grid[x][y]) {
      stack = grid[x][y].type == lastType ? stack + 1 : 1;
      lastType = grid[x][y].type;
    }
    else {
      stack++;
      if (stack > 5) lastType = -1;
      if (lastType >= 0) {
        tmpfill[x][y] = Math.max(tmpfill[x][y], lastType + stack * 10);
      }
    }
    return [lastType, stack];
  }
}

function logGrid() {
  var str = "";
  for (let j = gridSize.h - 1; j >= 0; j--) {
    for (let i = 0; i < gridSize.w; i++) {
      str += "" + grid[i][j].power + grid[i][j].type + " ";
    }
    str += "\n";
  }
  if (debugged) console.log(str);
}