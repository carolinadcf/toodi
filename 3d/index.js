import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { Stats } from '../stats.js';

class App {

    constructor() {
        
        this.fps = 0;
        this.elapsedTime = 0; // clock is ok but might need more time control to dinamicaly change signing speed
        this.clock = new THREE.Clock();
		this.day = 0;
		this.dayData = 0;

        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.controls = null;        

        this.spheres = [];
	}

	init( ) {

		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
		this.camera.position.set( 0, 0.2, 1.5 );

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0x000000 );

		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		document.body.appendChild( this.renderer.domElement );

		this.controls = new OrbitControls( this.camera, this.renderer.domElement );
		this.controls.target.set( 0, 0.2, 0 );
		this.controls.update();

		window.addEventListener( 'resize', this.onWindowResize.bind(this) );

		let that = this;
		this.loader = new FontLoader();
			
		// include lights
		let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
		this.scene.add( hemiLight );

		let dirLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
		dirLight.castShadow = true;
		dirLight.position.set( 1.5, 5, 2 );
		this.scene.add( dirLight );

		// add entities
		let ground = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshStandardMaterial( { color: 0x0c2436, depthWrite: true, roughness: 0, metalness: 0 } ) );
		ground.rotation.x = -Math.PI / 2;
		ground.receiveShadow = true;
		this.scene.add( ground );

		this.stats = new Stats("../data/StreamingHistory.json", () => {

			// let top5 = {
			//     "Iskender": 2282,
			//     "Enol": 2211,
			//     "Lluc": 1818,
			//     "FLETCHER": 1509,
			//     "Taylor Swift": 901
			// };

			let top5 = this.stats.top5a;

			let i = -0.5;

			let total = 0;
			top5.forEach( num => {
				total += num[1];
			});

			for (const artist in top5) {   
				let sphere = new THREE.Mesh( new THREE.SphereGeometry(0.2,16,16), new THREE.MeshStandardMaterial( { depthWrite:true, depthTest:true, color: (Math.random() * 0.5 + 0.5) * 0xffffff } ) );
				sphere.position.set(i, 0.2, 0);
				sphere.scale.multiplyScalar(top5[artist][1] / total);
				sphere.castShadow = true;
				sphere.receiveShadow = true;
				this.scene.add(sphere);
				this.spheres.push(sphere);
				i += 0.25;
			}

			top5.forEach((label, index) => {
				this.loader.load( "../data/fonts/helvetiker_bold.typeface.json", function ( font ) {
					const matLite = new THREE.MeshBasicMaterial( {
						color: new THREE.Color( 0x006699 ),
						side: THREE.DoubleSide
					} );

					const shapes = font.generateShapes( label[0], 0.02 );

					const geometry = new THREE.ShapeGeometry( shapes );

					const text = new THREE.Mesh( geometry, matLite );
					text.position.set(that.spheres[index].position.x, that.spheres[index].position.y + 0.1, 0);
					that.scene.add( text );
					that.animate();

				} ); //end load function
			});
		});

		this.animate();

	} // end init

	onWindowResize() {

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( window.innerWidth, window.innerHeight );

		this.animate();

	}

	createChart() {
		
		let top5 = this.stats.top5a;

        let i = -0.5;

        let total = 0;
        top5.forEach( num => {
            total += num[1];
        });

        for (let i = 0; i < top5.length; i++) {   
            let sphere = new THREE.Mesh( new THREE.SphereGeometry(0.2,16,16), new THREE.MeshStandardMaterial( { depthWrite:true, depthTest:true, color: (Math.random() * 0.5 + 0.5) * 0xffffff } ) );
            sphere.position.set(i, 0.2, 0);
            sphere.scale.multiplyScalar(top5[artist] / total);
			sphere.castShadow = true;
			sphere.receiveShadow = true;
            this.scene.add(sphere);
            this.spheres.push(sphere);
            i += 0.25;
        }
	}
		
    animate() {

        requestAnimationFrame( this.animate.bind(this) );

		// this.elapsedTime = this.clock.getElapsedTime() / 10;
		// for (let i = 0; i < this.spheres.length; i++) {
		// 	this.spheres[i].scale.set(1,this.elapsedTime,1);
		// }
        
		this.renderer.render( this.scene, this.camera );
    }
}

let app = new App();
app.init();
window.global = {app:app};
export { app, App };
