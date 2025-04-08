/* global Phaser */  // Indica que la variable Phaser es global, útil para evitar advertencias en algunos editores.

const config = { 
  type: Phaser.AUTO, // Permite que Phaser elija automáticamente entre WebGL o Canvas.
  width: 500, // Ancho de la pantalla del juego.
  height: 500, // Alto de la pantalla del juego.
  parent: 'game', // ID del contenedor HTML donde se insertará el juego.
  physics: {
    default: 'arcade', // Define el motor de físicas que usará el juego.
    arcade: { 
      gravity: { y: 400 }, // Aplica una gravedad de 400 en el eje Y.
      debug: false // Desactiva la visualización de depuración.
    }
  },
  scene: { preload, create, update } // Define las funciones de la escena.
};

new Phaser.Game(config); // Crea una nueva instancia del juego con la configuración definida.

function preload() {
  // Carga una imagen de fondo.
  this.load.image('background', './oak_woods_v1.0/background/background_layer_1.png');

  // Carga una hoja de sprites para el suelo con cada frame de 80x64 píxeles.
  this.load.spritesheet(
    'suelo',
    './LEGACY/Assets/Hive.png',
    { frameWidth: 80, frameHeight: 64 }
  );

  // Carga una hoja de sprites para el personaje con cada frame de 56x56 píxeles.
  this.load.spritesheet(
    'hero',
    './oak_woods_v1.0/character/char_blue.png',
    { frameWidth: 56, frameHeight: 56 }
  );
}

function create() {
  // Agrega la imagen de fondo y la ajusta al tamaño de la pantalla.
  this.add.image(0, 0, 'background')
    .setOrigin(0, 0)
    .setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

  // Crea un grupo estático para el suelo.
  this.floor = this.physics.add.staticGroup();

  // Genera 7 segmentos de suelo a lo largo de la parte inferior de la pantalla.
  for (let i = 0; i < 7; i++) {
    this.floor.create(i * 80, 500, 'suelo')
      .setOrigin(0, 1)
      .setScale(1);
  }

  // Agrega el personaje con físicas activadas.
  this.hero = this.physics.add.sprite(100, 350, 'hero')
    .setOrigin(0, 1) // Ajusta el punto de origen en la parte inferior.
    .setScale(1.5) // Escala el sprite para hacerlo más grande.
    //.setCollideWorldBounds(true);

  // Habilita la colisión entre el personaje y el suelo.
  this.physics.add.collider(this.hero, this.floor);

  // Define la animación de caminar.
  this.anims.create({
    key: 'hero-walk', // Nombre de la animación.
    frames: this.anims.generateFrameNumbers('hero', { start: 17, end: 23 }), // Rango de frames de la animación.
    frameRate: 18, // Velocidad de la animación.
    repeat: -1 // Repite indefinidamente.
  });

  // Define la animación de inactividad.
  this.anims.create({
    key: 'hero-idle',
    frames: [{ key: 'hero', frame: 0 }] // Usa solo el frame 0 para la animación de estar quieto.
  });

  // Define la animación de salto.
  this.anims.create({
    key: 'hero-jump',
    frames: this.anims.generateFrameNumbers('hero', { start: 24, end: 37 }), // Rango de frames de la animación de salto.
    frameRate: 11, // Velocidad de la animación.
    repeat: 0 // No se repite, solo se ejecuta una vez por cada salto.
  });

  // DEfinir la animacion muerte
  this.anims.create({
    key: 'hero-dead',
    frames: this.anims.generateFrameNumbers('hero', { start: 39, end: 48 }), // Rango de frames de la animación de salto.
    frameRate: 11, // Velocidad de la animación.
    repeat: 0
  });
  this.hero.isDead = false;
  // Captura las teclas de flecha para los controles.
  this.keys = this.input.keyboard.createCursorKeys();

  // Configura la cámara para que siga al personaje con suavidad.
  this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
  this.cameras.main.setBounds(0, 0, 2000, 500); // Establece los límites de la cámara en el mundo del juego.
}

function update() {
  let isOnGround = this.hero.body.blocked.down; // Verifica si el personaje está tocando el suelo.

  if (this.hero.isDead) return
  // Movimiento lateral hacia la izquierda.
  if (this.keys.left.isDown) {
    this.hero.setVelocityX(-160); // Aplica velocidad negativa en X para moverse a la izquierda.
    if (isOnGround) { // Solo reproduce la animación de caminar si está en el suelo.
      this.hero.anims.play('hero-walk', true);
    }
    this.hero.setFlipX(true); // Voltea el sprite horizontalmente para que mire a la izquierda.

  // Movimiento lateral hacia la derecha.
  } else if (this.keys.right.isDown) {
    this.hero.setVelocityX(160); // Aplica velocidad positiva en X para moverse a la derecha.
    if (isOnGround) { // Solo reproduce la animación de caminar si está en el suelo.
      this.hero.anims.play('hero-walk', true);
    }
    this.hero.setFlipX(false); // Mantiene la orientación normal.

  // Si no se presionan teclas de dirección, el personaje se detiene.
  } else {
    this.hero.setVelocityX(0);
    if (isOnGround) {
      this.hero.anims.play('hero-idle', true); // Reproduce la animación de inactividad.
    }
  }

  // Salto
  if (this.keys.up.isDown && isOnGround) {
    this.hero.setVelocityY(-300); // Aplica una fuerza hacia arriba para saltar.
    this.hero.anims.play('hero-jump', true); // Activa la animación de salto.
  }

  // Mantiene la animación de salto si el personaje sigue en el aire.
  if (!isOnGround) {
    if (!this.hero.anims.isPlaying || this.hero.anims.currentAnim.key !== 'hero-jump') {
      this.hero.anims.play('hero-jump', true);
    }
  }
  // Muerte del personaje
  if (this.hero.y >= config.height){
    this.hero.isDead = true;
    this.hero.setVelocity(0, 0);
    this.hero.anims.play('hero-dead');
    this.time.delayedCall(1000, () => {
      this.scene.restart(); 

    });
}
}