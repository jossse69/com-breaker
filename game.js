'use strict';

// Import all exports from 'littlejsengine' as an object named 'LittleJS'
import * as LittleJS from './libs/littlejs.esm.min.js';

const levelSize = LittleJS.vec2(38, 20); // size of play area
const sound_bounce = new LittleJS.Sound([
  ,
  ,
  180,
  ,
  0.03,
  0.01,
  1,
  3.3,
  ,
  -85,
  ,
  ,
  ,
  ,
  0.7,
  ,
  ,
  0.88,
  0.02,
  0.03,
]);
const sound_start = new LittleJS.Sound([
  ,
  ,
  272,
  0.08,
  0.29,
  0.47,
  1,
  3.3,
  ,
  -139,
  198,
  0.07,
  0.06,
  ,
  ,
  ,
  ,
  0.78,
  0.28,
  0.07,
]);

const break_sound = new LittleJS.Sound([
  1.7,
  ,
  31,
  0.01,
  0.02,
  0.32,
  4,
  3.8,
  ,
  4,
  ,
  ,
  ,
  0.7,
  ,
  0.9,
  0.1,
  0.32,
  0.2,
  0.37,
  1555,
]);
const lose_sound = new LittleJS.Sound([
  1.2,
  ,
  84,
  0.1,
  0.3,
  0.6,
  ,
  0.5,
  -6,
  2,
  ,
  ,
  0.22,
  0.3,
  ,
  0.7,
  ,
  0.37,
  0.23,
  0.25,
]);
const win_sound = new LittleJS.Sound([
  ,
  ,
  557,
  0.06,
  0.29,
  0.37,
  ,
  3.1,
  ,
  ,
  490,
  0.08,
  0.06,
  ,
  ,
  ,
  ,
  0.9,
  0.15,
]);

const combo_messages = [
  'lame...',
  'ok, i guess?',
  'getting somewere!',
  'nice!',
  'stylish!',
  'epic!',
  'curshing!',
  'supreme!',
  'lengendary!',
  'élégant!',
];

let ball; // keep track of ball object
let paddle; // keep track of player's paddle
let score = 0; // start score at 0
let combo = 0;
let combo_message_ticks = 0;
let last_combo = 0;
let bricks = [];
let bricks_left = 0;
let has_won = false;

class Paddle extends LittleJS.EngineObject {
  constructor() {
    super(LittleJS.vec2(0, 1), LittleJS.vec2(6, 0.5)); // set object position and size
    this.setCollision(); // make object collide
    this.mass = 0; // make object have static physics
  }
  update() {
    this.pos.x = LittleJS.mousePos.x; // move paddle to mouse
    this.pos.x = LittleJS.clamp(
      this.pos.x,
      this.size.x / 2,
      levelSize.x - this.size.x / 2
    );
  }
}

class Ball extends LittleJS.EngineObject {
  constructor(pos) {
    super(pos, LittleJS.vec2(0.5)); // set object position
    this.setCollision(); // make object collide
    this.velocity = LittleJS.vec2(-0.1, -0.1); // give ball some movement
    this.elasticity = 1; // make object bounce
    this.hits = 0;
  }

  collideWithObject(o) {
    // prevent colliding with paddle if moving upwards
    if (o == paddle && this.velocity.y > 0) return false;

    sound_bounce.play(this.pos, 1, 1 + this.hits / 16); // play bounce sound
    this.hits++;

    if (o == paddle) {
      // control bounce angle when ball collides with paddle
      const deltaX = this.pos.x - o.pos.x;
      this.velocity = this.velocity.rotate(0.3 * deltaX);

      // make sure ball is moving upwards with a minimum speed
      this.velocity.y = LittleJS.max(-this.velocity.y, 0.2);

      // prevent default collision code
      return false;
    }

    // speed up the ball
    const speed = LittleJS.min(1.04 * this.velocity.length(), 0.5);
    this.velocity = this.velocity.normalize(speed);

    return true; // allow object to collide
  }
}

class Wall extends LittleJS.EngineObject {
  constructor(pos, size) {
    super(pos, size); // set object position and size
    this.color = new LittleJS.Color(0, 0, 0, 0); // make object invisible
    this.setCollision(); // make object collide
    this.mass = 0; // make object have static physics
  }
}

class Brick extends LittleJS.EngineObject {
  constructor(pos, size) {
    super(pos, size);

    this.setCollision(); // make object collide
    this.mass = 0; // make object have static physics
  }

  collideWithObject(o) {
    ++combo;
    score += 1 * combo;
    break_sound.play(this.pos);
    // create explosion effect
    const color = this.color;
    new LittleJS.ParticleEmitter(
      this.pos,
      0,
      0,
      0.01,
      1000,
      3.14,
      0,
      color,
      color,
      new LittleJS.Color(color.r, color.g, color.b, 0),
      new LittleJS.Color(color.r, color.g, color.b, 0),
      0.5,
      0.1,
      1,
      0.1,
      0.05,
      0.99,
      0.99,
      0.4,
      3.14,
      0.1,
      0.1,
      0.5,
      1,
      1
    );
    bricks_left--;

    this.destroy(); // destroy block when hit
    return true;
  }
}

function init_level() {
  score = 0;
  combo = 0;
  has_won = false;
  if (ball) {
    ball.destroy();
    ball = 0;
  }

  if (bricks.length > 0) {
    for (let i = 0; i <= bricks.length - 1; i++) {
      let brick = bricks[i];
      brick.destroy();
      bricks.splice(i, 1);
    }
  }

  // create bricks
  for (let x = 2; x <= levelSize.x - 2; x += 2)
    for (let y = 12; y <= levelSize.y - 2; y += 1) {
      const brick = new Brick(LittleJS.vec2(x, y), LittleJS.vec2(2, 1)); // create a brick
      brick.color = LittleJS.hsl(
        (((x + y) * 20) % 360) / 360,
        100 / 100,
        50 / 100
      );
      bricks_left++;
      bricks.push(brick);
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // called once after the engine starts up
  // setup the game

  LittleJS.setCameraPos(levelSize.scale(0.5)); // center camera in level
  LittleJS.setCanvasFixedSize(LittleJS.vec2(1280, 720)); // use a 720p fixed size canvas

  init_level();

  paddle = new Paddle(); // create player's paddle

  // create walls
  new Wall(LittleJS.vec2(-0.5, levelSize.y / 2), LittleJS.vec2(1, 100)); // left
  new Wall(
    LittleJS.vec2(levelSize.x + 0.5, levelSize.y / 2),
    LittleJS.vec2(1, 100)
  ); // right
  new Wall(
    LittleJS.vec2(levelSize.x / 2, levelSize.y + 0.5),
    LittleJS.vec2(100, 1)
  ); // top
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state

  if (bricks_left == 0 && !has_won) {
    win_sound.play();
    has_won = true;
    ball.destroy();
    ball = 0;
    combo = 0;
  }

  if (ball && ball.pos.y < -1) {
    // if ball is below level
    // destroy old ball
    ball.destroy();
    ball = 0;
    last_combo = combo;
    combo = 0;
    lose_sound.play();
    combo_message_ticks = 130;
  }
  if (!ball && LittleJS.mouseWasPressed(0) && !has_won) {
    // if there is no ball and left mouse is pressed
    ball = new Ball(LittleJS.cameraPos); // create the ball
    sound_start.play(); // play start sound
  }
  if (has_won && LittleJS.mouseWasPressed(0)) {
    init_level();
  }

  if (combo_message_ticks > 0) {
    combo_message_ticks--;
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects

  LittleJS.drawRect(
    LittleJS.cameraPos,
    LittleJS.vec2(100),
    new LittleJS.Color(0.5, 0.5, 0.5)
  ); // draw background
  LittleJS.drawRect(
    LittleJS.cameraPos,
    levelSize,
    new LittleJS.Color(0.1, 0.1, 0.1)
  ); // draw level boundary
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects

  LittleJS.drawTextScreen(
    'Score: ' + score,
    LittleJS.vec2(LittleJS.mainCanvasSize.x / 4, 70),
    50
  ); // show score

  if (combo > 0) {
    LittleJS.drawTextScreen(
      combo + 'x Combo!',
      LittleJS.vec2((LittleJS.mainCanvasSize.x / 4) * 2, 70),
      50,
      LittleJS.hsl(60 / 360, 100 / 100, 50 / 100)
    ); // show combo
  }

  if (combo_message_ticks > 0) {
    LittleJS.drawTextScreen(
      'That combo was ' +
        combo_messages[
          LittleJS.min(Math.floor(last_combo / 5), combo_messages.length - 1)
        ],
      LittleJS.vec2(
        LittleJS.mainCanvasSize.x / 2,
        LittleJS.mainCanvasSize.y / 2
      ),
      50,
      LittleJS.hsl(((LittleJS.time * 90) / 360) % 1, 100 / 100, 50 / 100)
    );
  }
  if (!ball && bricks_left == 0) {
    LittleJS.drawTextScreen(
      'You won! (Click to restart  the game)',
      LittleJS.vec2(
        LittleJS.mainCanvasSize.x / 2,
        LittleJS.mainCanvasSize.y / 2 - 50
      ),
      50
    );
  } else if (!ball) {
    LittleJS.drawTextScreen(
      'Ciick to spawn the ball!',
      LittleJS.vec2(
        LittleJS.mainCanvasSize.x / 2,
        LittleJS.mainCanvasSize.y / 2 - 50
      ),
      50
    );
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LittleJS.engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost
);
