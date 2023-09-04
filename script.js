const FPS = 60;
const showFPS = false;

var canvas = document.getElementById("canvas");
var react = canvas.getBoundingClientRect();
var ctx = canvas.getContext("2d");
var lastCalledTime;
var screen_scale = 1;
var highscore = 0;
var score = 0;
var animateScore = 0;
var scoreScale = 1;

function init() {
  canvas.width = react.width;
  canvas.height = react.height;
  screen_scale = canvas.width / 100;
  // canvas.addEventListener("click", touch);
  // canvas.addEventListener("touchstart", (e) => touch(e.touches[0]));
  // canvas.addEventListener("touchmove", (e) => touch(e.touches[0]));
  // canvas.addEventListener("touchend", (e) => touch(e.touches[0]));
  highscore = loadScore();
  ctx.textBaseline = "top";
  // creatGrid();
  setInterval(update, 1000 / FPS);
}

setFontSize = (size = 7) => ctx.font = screen_scale * size + "px comic sans ms";

async function update() {
  // console.log(spawn_pool, board, poping_pool)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBG();
}

function drawBG() {
  var grd = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
  grd.addColorStop(0, '#d3168f');
  grd.addColorStop(1, '#1f2579');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "start";
  ctx.fillStyle = "black";
  if (animateScore < score && scoreScale < 1.1) {
    animateScore += Math.ceil((score - animateScore) / 10);
    scoreScale = 1.2;
  }
  setFontSize(7 * scoreScale);
  if (scoreScale > 1.001) scoreScale -= (scoreScale - 1) / 10;
  ctx.fillText("score: " + animateScore, 2 * screen_scale, 7 * screen_scale);
  setFontSize(3)
  ctx.fillText("highscore: " + highscore, 2 * screen_scale, 3 * screen_scale);

  // ctx.fillStyle = '#749D4E';
  // ctx.fillRect(0, 190 * screen_scale, 20 * screen_scale, 10 * screen_scale);
  // setFontSize(4)
  // ctx.fillStyle = "black";
  // ctx.fillText(`Bot: ${isBotEnabled ? 'on' : 'off'}`, 2 * screen_scale, 193 * screen_scale);
  // setFontSize(10);
  // ctx.fillText("↻", 92 * screen_scale, 2 * screen_scale);

  if (showFPS) {
    var fps = 0;
    if (!lastCalledTime) {
      lastCalledTime = Date.now();
      fps = 0;
    }
    else {
      var delta = (Date.now() - lastCalledTime) / 1000;
      lastCalledTime = Date.now();
      fps = 1 / delta;
    }
    ctx.scale(0.5, 0.5);
    ctx.fillText(Math.round(fps), 4 * screen_scale, 30 * screen_scale);
    ctx.scale(2, 2);
  }
}

// score
function saveScore() {
  highscore = Math.max(score, highscore);
  var d = new Date();
  d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = "score=" + highscore + ";" + expires + ";path=/";
}

function loadScore() {
  var name = "score=";
  var ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    var c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return 0;
}


init();