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
    this.load.spritesheet('monster2', 'Monster_Creatures_Fantasy(Version 1.3)/Skeleton/Attack3.png', {
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
        .refreshBody();
    }

    this.hero = this.physics.add.sprite(100, 350, 'hero')
      .setOrigin(0, 1)
      .setScale(1.5);
    this.hero.isDead = false;
    this.hero.isAttacking = false;
    this.hero.body.setSize(30, 50);
    this.hero.body.setOffset(10, 6);
    this.hero.lives = 3;
    this.hero.score = 0;
    this.physics.add.collider(this.hero, this.floor);

    this.monster = this.physics.add.sprite(300, 350, 'monster')
      .setScale(2)
      .setBounce(0)
      .setCollideWorldBounds(true)
      .setVelocityX(50);
    this.monster.isDead = false;
    this.monster.body.setSize(16, 16);
    this.monster.body.setOffset(0, 0);
    this.physics.add.collider(this.monster, this.floor);

    this.physics.add.overlap(this.hero, this.monster, () => {
      if (this.hero.isAttacking && !this.monster.isDead) {
        this.monster.isDead = true;
        this.monster.disableBody(true, true);
        this.hero.score += 100;
        this.updateHUD();
      } else if (!this.hero.isDead && !this.monster.isDead) {
        this.hero.lives--;
        this.updateHUD();

        if (this.hero.lives > 0) {
          this.hero.isDead = true;
          this.hero.setVelocity(0, 0);
          this.hero.anims.play('hero-dead');
          this.time.delayedCall(1000, () => {
            this.hero.setPosition(100, 350);
            this.hero.setVelocity(0, 0);
            this.hero.isDead = false;
            this.hero.anims.play('hero-idle');
          });
        } else {
          this.scene.start('GameOverScene', { score: this.hero.score });
        }
      }
    }, null, this);

    this.anims.create({ key: 'hero-walk', frames: this.anims.generateFrameNumbers('hero', { start: 17, end: 23 }), frameRate: 18, repeat: -1 });
    this.anims.create({ key: 'hero-idle', frames: [{ key: 'hero', frame: 0 }] });
    this.anims.create({ key: 'hero-jump', frames: this.anims.generateFrameNumbers('hero', { start: 24, end: 37 }), frameRate: 11, repeat: 0 });
    this.anims.create({ key: 'hero-dead', frames: this.anims.generateFrameNumbers('hero', { start: 39, end: 48 }), frameRate: 11, repeat: 0 });
    this.anims.create({ key: 'hero-attack', frames: this.anims.generateFrameNumbers('hero', { start: 8, end: 12 }), frameRate: 11, repeat: 0 });

    this.keys = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 2000, 500);

    // HUD
    this.hudText = this.add.text(16, 16, '', {
      fontSize: '20px',
      fill: '#fff',
      fontFamily: 'Arial'
    });
    this.hudText.setScrollFactor(0);
    this.updateHUD = () => {
      this.hudText.setText(`Vidas: ${this.hero.lives} | Puntos: ${this.hero.score}`);
    };
    this.updateHUD();
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

    if (!this.monster.isDead) {
      if (this.monster.body.blocked.right) {
        this.monster.setVelocityX(-50);
        this.monster.setFlipX(true);
      } else if (this.monster.body.blocked.left) {
        this.monster.setVelocityX(50);
        this.monster.setFlipX(false);
      }
    }

    if (this.hero.y >= this.sys.game.config.height) {
      this.hero.lives--;
      this.updateHUD();

      if (this.hero.lives > 0) {
        this.hero.isDead = true;
        this.hero.setVelocity(0, 0);
        this.hero.anims.play('hero-dead');
        this.time.delayedCall(1000, () => {
          this.hero.setPosition(100, 350);
          this.hero.setVelocity(0, 0);
          this.hero.isDead = false;
          this.hero.anims.play('hero-idle');
        });
      } else {
        this.scene.start('GameOverScene', { score: this.hero.score });
      }
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    this.add.text(150, 180, 'GAME OVER', {
      fontSize: '32px',
      fill: '#ff0000',
      fontFamily: 'Arial'
    });

    this.add.text(130, 230, `Puntuación final: ${this.finalScore}`, {
      fontSize: '20px',
      fill: '#ffffff'
    });

    this.add.text(100, 270, 'Presiona ESPACIO para reiniciar', {
      fontSize: '16px',
      fill: '#ffffff'
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MainScene');
    });
  }
}

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
  scene: [MainScene, GameOverScene]
};

new Phaser.Game(config);