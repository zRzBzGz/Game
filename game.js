/* global Phaser */

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
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
    this.load.spritesheet('monster2', './Monster_Creatures_Fantasy(Version 1.3)/Skeleton/Attack3.png', {
      frameWidth: 16,
      frameHeight: 16
    });
  }

  create() {
    this.background = this.add.image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);
    this.background.setScrollFactor(0);

    this.floor = this.physics.add.staticGroup();
    for (let i = 0; i < 30; i++) {
      if (i === 10 || i === 11) continue;
      this.floor.create(i * 80, 500, 'suelo')
        .setOrigin(0, 1)
        .setScale(1)
        .refreshBody(); // importante
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
    this.monster.body.setSize(16, 16);
    this.monster.body.setOffset(10, 6);
    this.physics.add.collider(this.monster, this.floor);

    this.monster2 = this.physics.add.sprite(600, 350, 'monster2')
      .setScale(2)
      .setBounce(0)
      .setCollideWorldBounds(true)
      .setVelocityX(-50);
    this.monster2.isDead = false;
    this.monster2.body.setSize(16, 16);
    this.monster2.body.setOffset(10, 6);
    this.physics.add.collider(this.monster2, this.floor);

    this.physics.add.overlap(this.hero, this.monster, this.handleMonsterCollision, null, this);
    this.physics.add.overlap(this.hero, this.monster2, this.handleMonsterCollision, null, this);

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

    this.lives = 3;
    this.livesText = this.add.text(16, 16, 'Vidas: ' + this.lives, {
      fontSize: '20px',
      fill: '#fff'
    }).setScrollFactor(0);
  }

  handleMonsterCollision(hero, monster) {
    if (hero.isAttacking && !monster.isDead) {
      monster.isDead = true;
      monster.disableBody(true, true);
    } else if (!hero.isDead && !monster.isDead) {
      hero.isDead = true;
      hero.setVelocity(0, 0);
      hero.anims.play('hero-dead');
      this.time.delayedCall(1000, () => this.scene.restart());
    }
  }

  update() {
    let isOnGround = this.hero.body.blocked.down;
    if (this.hero.isDead) return;

    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.hero.isAttacking) {
      this.hero.isAttacking = true;
      this.hero.setVelocityX(0);
      this.hero.anims.play('hero-attack', true);

      this.time.delayedCall(300, () => {
        this.hero.isAttacking = false;
      });

      return;
    }

    if (!this.hero.isAttacking) {
      if (this.keys.left.isDown) {
        this.hero.setVelocityX(-160);
        if (isOnGround) this.hero.anims.play('hero-walk', true);
        this.hero.setFlipX(true);
      } else if (this.keys.right.isDown) {
        this.hero.setVelocityX(160);
        if (isOnGround) this.hero.anims.play('hero-walk', true);
        this.hero.setFlipX(false);
      } else {
        this.hero.setVelocityX(0);
        if (isOnGround) this.hero.anims.play('hero-idle', true);
      }

      if (this.keys.up.isDown && isOnGround) {
        this.hero.setVelocityY(-300);
        this.hero.anims.play('hero-jump', true);
      }

      if (!isOnGround && (!this.hero.anims.isPlaying || this.hero.anims.currentAnim.key !== 'hero-jump')) {
        this.hero.anims.play('hero-jump', true);
      }
    }

    [this.monster, this.monster2].forEach(monster => {
      if (!monster.isDead) {
        if (monster.body.blocked.right) {
          monster.setVelocityX(-50);
          monster.setFlipX(true);
        } else if (monster.body.blocked.left) {
          monster.setVelocityX(50);
          monster.setFlipX(false);
        }
      }
    });

    // Muerte por caída al vacío (con salto tipo Mario Bros)
    if (this.hero.y >= this.sys.game.config.height && !this.hero.isDead) {
      this.hero.isDead = true;
      this.hero.setVelocityY(-300); // salto hacia arriba
      this.hero.anims.play('hero-dead');

      this.time.delayedCall(1000, () => {
        this.scene.restart();
      });
    }
  }
}

// Configuración del juego
const config = {
  type: Phaser.AUTO,
  width: 500,
  height: 500,
  parent: 'game', // Asegúrate de tener <div id="game"></div> en tu HTML
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 400 },
      debug: false
    }
  },
  scene: [MainScene]
};

new Phaser.Game(config);