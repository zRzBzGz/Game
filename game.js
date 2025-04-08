/* global Phaser */

const config = {
  type: Phaser.AUTO,
  width: 500,
  height: 500,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 400 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
  this.load.image('background', './oak_woods_v1.0/background/background_layer_1.png');

  this.load.spritesheet('suelo', './LEGACY/Assets/Hive.png', {
    frameWidth: 80,
    frameHeight: 64
  });

  this.load.spritesheet('hero', './oak_woods_v1.0/character/char_blue.png', {
    frameWidth: 56,
    frameHeight: 56
  });

  this.load.spritesheet('monster', './2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Character.png', {
    frameWidth: 16,
    frameHeight: 16
  });
}

function create() {
  this.add.image(0, 0, 'background')
    .setOrigin(0, 0)
    .setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

  this.floor = this.physics.add.staticGroup();

  for (let i = 0; i < 7; i++) {
    this.floor.create(i * 80, 500, 'suelo')
      .setOrigin(0, 1)
      .setScale(1);
  }

  this.hero = this.physics.add.sprite(100, 350, 'hero')
    .setOrigin(0, 1)
    .setScale(1.5);
  this.hero.isDead = false;
  this.hero.isAttacking = false;

  this.hero.body.setSize(30, 50);
  this.hero.body.setOffset(10, 6);

  this.physics.add.collider(this.hero, this.floor);

  this.monster = this.physics.add.sprite(300, 350, 'monster')
    .setScale(2)
    .setBounce(0)
    .setCollideWorldBounds(true)
    .setVelocityX(50);
  this.monster.isDead = false;

  this.physics.add.collider(this.monster, this.floor);

  // ⚔️ Colisión lógica de ataque
  this.physics.add.overlap(this.hero, this.monster, () => {
    if (this.hero.isAttacking && !this.monster.isDead) {
      this.monster.isDead = true;
      this.monster.disableBody(true, true);
    } else if (!this.hero.isDead && !this.monster.isDead) {
      this.hero.isDead = true;
      this.hero.setVelocity(0, 0);
      this.hero.anims.play('hero-dead');
      this.time.delayedCall(1000, () => {
        this.scene.restart();
      });
    }
  }, null, this);

  // Animaciones
  this.anims.create({
    key: 'hero-walk',
    frames: this.anims.generateFrameNumbers('hero', { start: 17, end: 23 }),
    frameRate: 18,
    repeat: -1
  });

  this.anims.create({
    key: 'hero-idle',
    frames: [{ key: 'hero', frame: 0 }]
  });

  this.anims.create({
    key: 'hero-jump',
    frames: this.anims.generateFrameNumbers('hero', { start: 24, end: 37 }),
    frameRate: 11,
    repeat: 0
  });

  this.anims.create({
    key: 'hero-dead',
    frames: this.anims.generateFrameNumbers('hero', { start: 39, end: 48 }),
    frameRate: 11,
    repeat: 0
  });

  this.anims.create({
    key: 'hero-attack',
    frames: this.anims.generateFrameNumbers('hero', { start: 8, end: 12 }),
    frameRate: 11,
    repeat: 0
  });

  this.keys = this.input.keyboard.createCursorKeys();
  this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
  this.cameras.main.setBounds(0, 0, 2000, 500);
}

function update() {
  let isOnGround = this.hero.body.blocked.down;
  if (this.hero.isDead) return;

  // Ataque
  if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.hero.isAttacking) {
    this.hero.isAttacking = true;
    this.hero.setVelocityX(0);
    this.hero.anims.play('hero-attack', true);

    this.hero.once('animationcomplete-hero-attack', () => {
      this.hero.isAttacking = false;
    });
    return; // Evita que se sigan procesando otras animaciones
  }

  // Movimiento
  if (!this.hero.isAttacking) {
    if (this.keys.left.isDown) {
      this.hero.setVelocityX(-160);
      if (isOnGround) {
        this.hero.anims.play('hero-walk', true);
      }
      this.hero.setFlipX(true);
    } else if (this.keys.right.isDown) {
      this.hero.setVelocityX(160);
      if (isOnGround) {
        this.hero.anims.play('hero-walk', true);
      }
      this.hero.setFlipX(false);
    } else {
      this.hero.setVelocityX(0);
      if (isOnGround) {
        this.hero.anims.play('hero-idle', true);
      }
    }

    if (this.keys.up.isDown && isOnGround) {
      this.hero.setVelocityY(-300);
      this.hero.anims.play('hero-jump', true);
    }

    if (!isOnGround && (!this.hero.anims.isPlaying || this.hero.anims.currentAnim.key !== 'hero-jump')) {
      this.hero.anims.play('hero-jump', true);
    }
  }

  // Movimiento automático del monstruo
  if (!this.monster.isDead) {
    if (this.monster.body.blocked.right) {
      this.monster.setVelocityX(-50);
      this.monster.setFlipX(true);
    } else if (this.monster.body.blocked.left) {
      this.monster.setVelocityX(50);
      this.monster.setFlipX(false);
    }
  }

  // Muerte si cae al vacío
  if (this.hero.y >= config.height) {
    this.hero.isDead = true;
    this.hero.setVelocity(0, 0);
    this.hero.anims.play('hero-dead');
    this.time.delayedCall(1000, () => {
      this.scene.restart();
    });
  }
}
