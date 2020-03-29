import Phaser from 'phaser';
import { GzDialog } from '../plugins/GzDialog';
import { Script } from '../script';

export class GameScene extends Phaser.Scene {
	constructor() {
		super({
			key: 'GameScene'
		});

		this.controls = null; // User controls
		this.cursors = null;
		this.player = null;

		this.spawnPoint = null;
	}
	
	init(data){
		this.spawnPoint = {
			x:450,
			y:1200
		}
		if(data.hasOwnProperty('origin')){
			if(data.origin === 'Lab1') this.spawnPoint = {
				x:688,
				y:236
			}
		}
	}

	preload() {
		this.load.scenePlugin('gzDialog', GzDialog);

		this.load.image("tiles", "assets/images/Area-51.png");
		this.load.tilemapTiledJSON("map", "assets/tilemaps/area-51.json");

		this.load.atlas("atlas", "assets/images/zeta_walk.png", "assets/sprites/atlas.json");
		this.load.image("saucer", "assets/images/saucer.png");
	}

	create() {
		const map = this.make.tilemap({ key: "map" });

		// Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
		// Phaser's cache (i.e. the name you used in preload)
		const tileset = map.addTilesetImage("Area-51", "tiles");

		// Parameters: layer name (or index) from Tiled, tileset, x, y
		const belowLayer = map.createStaticLayer("Background", tileset, 0, 0);
		const worldLayer = map.createStaticLayer("Interactive", tileset, 0, 0);
		const scriptLayer = map.createStaticLayer("Script", tileset, 0, 0);

		const objects = map.getObjectLayer('Script'); //find the object layer in the tilemap named 'objects'

		worldLayer.setCollisionByProperty({ collide: true });
		const debugGraphics = this.add.graphics().setAlpha(0.75);
		// worldLayer.renderDebug(debugGraphics, {
		//     tileColor: null, // Color of non-colliding tiles
		//     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
		//     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
		// });

		this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "atlas", "misa-front").setSize(30, 40).setOffset(0, 24);
		this.player.name = 'zeta';

		this.physics.add.collider(this.player, worldLayer, this.HitInteractiveLayer.bind(this));

		objects.objects.forEach(
			(object) => {
				let tmp = this.add.rectangle((object.x+(object.width/2)), (object.y+(object.height/2)), object.width, object.height);
				tmp.properties = object.properties.reduce(
					(obj, item) => Object.assign(obj, { [item.name]: item.value }), {}
				);
				this.physics.world.enable(tmp, 1);
				this.physics.add.collider(this.player, tmp, this.HitScript, null, this);
				//debugger;
				//this.objects.push(tmp);

				// Add pad label
				//if(tmp.properties.padnum !== 0){
					this.add.text((tmp.x), (tmp.y-tmp.height), 'script', { color: '#ffffff', textAlagn: 'center' });
				//}
			}
		);

		const aboveLayer = map.createStaticLayer("Rooftops", tileset, 0, 0);

		// Phaser supports multiple cameras, but you can access the default camera like this:
		const camera = this.cameras.main;
		camera.startFollow(this.player);
		camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

		// Set up the arrows to control the camera
		this.cursors = this.input.keyboard.createCursorKeys();
		// this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
		//     camera: camera,
		//     left: cursors.left,
		//     right: cursors.right,
		//     up: cursors.up,
		//     down: cursors.down,
		//     speed: 0.5
		// });

		// Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
		camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

		const anims = this.anims;
		anims.create({
			key: "misa-left-walk",
			frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
			frameRate: 10,
			repeat: -1
		});
		anims.create({
			key: "misa-right-walk",
			frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
			frameRate: 10,
			repeat: -1
		});
		anims.create({
			key: "misa-front-walk",
			frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
			frameRate: 10,
			repeat: -1
		});
		anims.create({
			key: "misa-back-walk",
			frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
			frameRate: 10,
			repeat: -1
		});

		this.gzDialog.init();

		this.gzDialog.setText('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', true);

	}

	update(time, delta) {
		const speed = 225;
		const prevVelocity = this.player.body.velocity.clone();
		// Apply the controls to the camera each update tick of the game
		//this.controls.update(delta);

		// Stop any previous movement from the last frame
		this.player.body.setVelocity(0);

		if( this.gzDialog.visible ){
			if( this.cursors.space.isDown ){
				this.gzDialog.display(false);
			}
		}else{
			// Horizontal movement
			if (this.cursors.left.isDown) {
				console.log('left');
				this.player.body.setVelocityX(-speed);
			} else if (this.cursors.right.isDown) {
				this.player.body.setVelocityX(speed);
			}

			// Vertical movement
			if (this.cursors.up.isDown) {
				this.player.body.setVelocityY(-speed);
			} else if (this.cursors.down.isDown) {
				this.player.body.setVelocityY(speed);
			}
		}

		// Normalize and scale the velocity so that player can't move faster along a diagonal
		this.player.body.velocity.normalize().scale(speed);

		// Update the animation last and give left/right animations precedence over up/down animations
		if (this.cursors.left.isDown) {
			this.player.anims.play("misa-left-walk", true);
		} else if (this.cursors.right.isDown) {
			this.player.anims.play("misa-right-walk", true);
		} else if (this.cursors.up.isDown) {
			this.player.anims.play("misa-back-walk", true);
		} else if (this.cursors.down.isDown) {
			this.player.anims.play("misa-front-walk", true);
		} else {
			this.player.anims.stop();

			// If we were moving, pick and idle frame to use
			if (prevVelocity.x < 0) this.player.setTexture("atlas", "misa-left");
			else if (prevVelocity.x > 0) this.player.setTexture("atlas", "misa-right");
			else if (prevVelocity.y < 0) this.player.setTexture("atlas", "misa-back");
			else if (prevVelocity.y > 0) this.player.setTexture("atlas", "misa-front");
		}
	}


	HitInteractiveLayer(player, target){
		if(target.properties 
			&& target.properties.portal 
			&& target.properties.portal === 'lab') this.scene.start('Lab1', {origin:'Area51'});
		
	}

	HitScript(player, target){
		//console.log('target', target.properties);
		if(target.properties.name && !this.gzDialog.visible)
			this.gzDialog.setText(Script[player.name][target.properties.name], true);
	}
	
}
