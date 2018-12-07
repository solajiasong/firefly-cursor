// ==UserScript==
// @name         Fabulous Cursor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match       *://*/*
// @grant        none
// @require     https://code.jquery.com/jquery-3.3.1.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/three.js/99/three.min.js


// ==/UserScript==

(function () {
    'use strict';


    jQuery('body').prepend('<div id="particleOverlay" onmousemove="getCoordinates(event)"></div>');
    jQuery('#particleOverlay').css('position', 'absolute').css('top', '0px').css('pointer-events', 'none');

    var camera, tick = 0,
        scene, renderer, clock = new THREE.Clock(),
        controls, container,
        options, spawnerOptions, particleSystem;
    var stats;
    var vec = new THREE.Vector3(); // create once and reuse
    var pos = new THREE.Vector3(); // create once and reuse

    init();
    animate();

    function init() {
        //
        container = document.getElementById('particleOverlay');
        camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 100;
        scene = new THREE.Scene();
        particleSystem = new THREE.GPUParticleSystem({
            maxParticles: 250000
        });
        scene.add(particleSystem);
        // options passed during each spawned
        options = {
            position: new THREE.Vector3(),
            positionRandomness: .3,
            velocity: new THREE.Vector3(),
            velocityRandomness: .5,
            color: 0x33ff33,
            colorRandomness: .2,
            turbulence: .5,
            lifetime: 5,
            size: 10,
            sizeRandomness: 1
        };
        spawnerOptions = {
            spawnRate: 15000,
            horizontalSpeed: 1.5,
            verticalSpeed: 1.33,
            timeScale: 1
        };
        renderer = new THREE.WebGLRenderer({
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('mousemove', getCoordinates, false);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function getCoordinates(event) {
        vec.set(
            (event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1,
            0.5);
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        var distance = -camera.position.z / vec.z;
        pos.copy(camera.position).add(vec.multiplyScalar(distance));
        options.position.x = pos.x;
        options.position.y = pos.y;
    };

    function animate() {
        requestAnimationFrame(animate);
        var delta = clock.getDelta() * spawnerOptions.timeScale;
        tick += delta;
        if (tick < 0) tick = 0;
        if (delta > 0) {
            for (var x = 0; x < spawnerOptions.spawnRate * delta; x++) {
                particleSystem.spawnParticle(options);
            }
        }
        particleSystem.update(tick);
        render();
    }

    function render() {
        renderer.render(scene, camera);
    }



    // Your code here...
})();