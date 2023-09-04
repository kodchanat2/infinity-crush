var size = 10;
var velocity = 0;
var maxSize = 100;
var center = { x: 0, y: 0 };
var res = { w: 0, h: 0 };
const ratio = 470 / 200;// 470 × 200
const accel = 0.01;
const image = document.getElementById("title");

export function draw(ctx, canvas) {
  if (center.x == 0) center = { x: canvas.width / 2, y: canvas.height / 3 };
  if (size > maxSize) velocity *= -1.5;
  velocity = Math.max(maxSize / size * accel + velocity * (1 - accel), -5);
  // console.log(size, velocity);
  size += velocity;
  res.w = size * ratio * center.x * 0.7 / maxSize;
  res.h = size * center.x * 0.7 / maxSize;
  ctx.drawImage(image, center.x - res.w / 2, center.y - res.h / 2, res.w, res.h);

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 20px comic sans ms";
  ctx.fillText("touch to start", center.x, canvas.height * 0.7 + 50);
}
