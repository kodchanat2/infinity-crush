var size = 10;
var velocity = 0;
var maxSize = 100;
var center = { x: 0, y: 0 };
var res = { w: 0, h: 0 };
const ratio = 470 / 200;// 470 × 200
const accel = 0.01;
const image = document.getElementById("title");
const buttonSpec = { w: 0.9, h: 0.1, space: 0.03 };
const buttons = [];

export function draw(ctx, canvas) {
  if (center.x == 0) { // init
    center = { x: canvas.width / 2, y: canvas.height / 3 };
    initButtons();
  }
  if (size > maxSize) velocity *= -1.5;
  velocity = Math.max(maxSize / size * accel + velocity * (1 - accel), -5);
  // console.log(size, velocity);
  size += velocity;
  res.w = size * ratio * center.x * 0.7 / maxSize;
  res.h = size * center.x * 0.7 / maxSize;
  ctx.drawImage(image, center.x - res.w / 2, center.y - res.h / 2, res.w, res.h);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "bold 30px Comic Neue";
  // ctx.fillText("touch to start", center.x, canvas.height * 0.7 + 50);

  for (var i = 0; i < buttons.length; i++) {
    drawButton(i);
  }

  function initButtons() {
    var texts = ["PLAY", "LUCKY PLAY"];
    var start = { x: center.x - buttonSpec.w * canvas.width / 2, y: center.y + buttonSpec.h * canvas.height * 2 };
    for (var i = 0; i < texts.length; i++) {
      buttons.push({ x: start.x, y: start.y, w: buttonSpec.w * canvas.width, h: buttonSpec.h * canvas.height, text: texts[i] });
      start.y += buttonSpec.h * canvas.height + buttonSpec.space * canvas.height;
    }
  }

  function drawButton(i) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.roundRect(buttons[i].x, buttons[i].y, buttons[i].w, buttons[i].h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fillText(buttons[i].text, buttons[i].x + buttons[i].w / 2, buttons[i].y + buttons[i].h / 2);
  }
}

export function click(x, y) {
  if (x < buttons[0].x || x > buttons[0].x + buttons[0].w) return 0;
  if (y < buttons[0].y || y > buttons[buttons.length - 1].y + buttons[0].h) return 0;
  var i = Math.floor((y - buttons[0].y) / (buttons[0].h + buttonSpec.space * canvas.height));
  if (y > buttons[i].y + buttons[i].h) return 0;
  return i + 1;
}
