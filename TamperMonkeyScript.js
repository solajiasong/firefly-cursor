// ==UserScript==
// @name         Firefly Cursor
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

    //create overlay and set style
    jQuery('body').prepend('<div id="particleOverlay"></div>');
    jQuery('#particleOverlay').css('position', 'absolute').css('top', '0px').css('pointer-events', 'none');

    THREE.GPUParticleSystem=function(t){THREE.Object3D.apply(this,arguments),t=t||{},this.PARTICLE_COUNT=t.maxParticles||1e6,this.PARTICLE_CONTAINERS=t.containerCount||1,this.PARTICLE_NOISE_TEXTURE=t.particleNoiseTex||null,this.PARTICLE_SPRITE_TEXTURE=t.particleSpriteTex||null,this.PARTICLES_PER_CONTAINER=Math.ceil(this.PARTICLE_COUNT/this.PARTICLE_CONTAINERS),this.PARTICLE_CURSOR=0,this.time=0,this.particleContainers=[],this.rand=[];var e,i={vertexShader:["uniform float uTime;","uniform float uScale;","uniform sampler2D tNoise;","attribute vec3 positionStart;","attribute float startTime;","attribute vec3 velocity;","attribute float turbulence;","attribute vec3 color;","attribute float size;","attribute float lifeTime;","varying vec4 vColor;","varying float lifeLeft;","void main() {","\tvColor = vec4( color, 1.0 );","\tvec3 newPosition;","\tvec3 v;","\tfloat timeElapsed = uTime - startTime;","\tlifeLeft = 1.0 - ( timeElapsed / lifeTime );","\tgl_PointSize = ( uScale * size ) * lifeLeft;","\tv.x = ( velocity.x - 0.5 ) * 3.0;","\tv.y = ( velocity.y - 0.5 ) * 3.0;","\tv.z = ( velocity.z - 0.5 ) * 3.0;","\tnewPosition = positionStart + ( v * 10.0 ) * timeElapsed;","\tvec3 noise = texture2D( tNoise, vec2( newPosition.x * 0.015 + ( uTime * 0.05 ), newPosition.y * 0.02 + ( uTime * 0.015 ) ) ).rgb;","\tvec3 noiseVel = ( noise.rgb - 0.5 ) * 30.0;","\tnewPosition = mix( newPosition, newPosition + vec3( noiseVel * ( turbulence * 5.0 ) ), ( timeElapsed / lifeTime ) );","\tif( v.y > 0. && v.y < .05 ) {","\t\tlifeLeft = 0.0;","\t}","\tif( v.x < - 1.45 ) {","\t\tlifeLeft = 0.0;","\t}","\tif( timeElapsed > 0.0 ) {","\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );","\t} else {","\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","\t\tlifeLeft = 0.0;","\t\tgl_PointSize = 0.;","\t}","}"].join("\n"),fragmentShader:["float scaleLinear( float value, vec2 valueDomain ) {","\treturn ( value - valueDomain.x ) / ( valueDomain.y - valueDomain.x );","}","float scaleLinear( float value, vec2 valueDomain, vec2 valueRange ) {","\treturn mix( valueRange.x, valueRange.y, scaleLinear( value, valueDomain ) );","}","varying vec4 vColor;","varying float lifeLeft;","uniform sampler2D tSprite;","void main() {","\tfloat alpha = 0.;","\tif( lifeLeft > 0.995 ) {","\t\talpha = scaleLinear( lifeLeft, vec2( 1.0, 0.995 ), vec2( 0.0, 1.0 ) );","\t} else {","\t\talpha = lifeLeft * 0.75;","\t}","\tvec4 tex = texture2D( tSprite, gl_PointCoord );","\tgl_FragColor = vec4( vColor.rgb * tex.a, alpha * tex.a );","}"].join("\n")};for(e=1e5;0<e;e--)this.rand.push(Math.random()-.5);this.random=function(){return++e>=this.rand.length?this.rand[e=1]:this.rand[e]};new THREE.TextureLoader;var a=function(t){var e=document.createElement("canvas");e.width=16,e.height=16;var i=e.getContext("2d"),a=i.createRadialGradient(e.width/2,e.height/2,0,e.width/2,e.height/2,e.width/2);return"Yellow"==t?(a.addColorStop(0,"rgba(255,252,0,1)"),a.addColorStop(.3,"rgba(255,252,0,0.75)"),a.addColorStop(.6,"rgba(255,252,0,0.05)"),a.addColorStop(1,"rgba(255,252,0,0)")):"Green"==t?(a.addColorStop(0,"rgba(60,240,24,1)"),a.addColorStop(.3,"rgba(60,240,24,0.75)"),a.addColorStop(.6,"rgba(60,240,24,0.05)"),a.addColorStop(1,"rgba(60,240,24,0)")):"GrassGreen"==t&&(a.addColorStop(0,"rgba(173,223,101,1)"),a.addColorStop(.3,"rgba(173,223,101,0.75)"),a.addColorStop(.6,"rgba(173,223,101,0.05)"),a.addColorStop(1,"rgba(173,223,101,0)")),i.fillStyle=a,i.fillRect(0,0,e.width,e.height),e}("Yellow");this.particleSpriteTex=new THREE.Texture(a),this.particleSpriteTex.wrapS=this.particleSpriteTex.wrapT=THREE.RepeatWrapping,this.particleShaderMat=new THREE.ShaderMaterial({transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uScale:{value:1},tSprite:{value:this.particleSpriteTex}},blending:THREE.AdditiveBlending,vertexShader:i.vertexShader,fragmentShader:i.fragmentShader}),this.particleShaderMat.defaultAttributeValues.particlePositionsStartTime=[0,0,0,0],this.particleShaderMat.defaultAttributeValues.particleVelColSizeLife=[0,0,0,0],this.init=function(){for(var t=0;t<this.PARTICLE_CONTAINERS;t++){var e=new THREE.GPUParticleContainer(this.PARTICLES_PER_CONTAINER,this);this.particleContainers.push(e),this.add(e)}},this.spawnParticle=function(t){this.PARTICLE_CURSOR++,this.PARTICLE_CURSOR>=this.PARTICLE_COUNT&&(this.PARTICLE_CURSOR=1),this.particleContainers[Math.floor(this.PARTICLE_CURSOR/this.PARTICLES_PER_CONTAINER)].spawnParticle(t)},this.update=function(t){for(var e=0;e<this.PARTICLE_CONTAINERS;e++)this.particleContainers[e].update(t)},this.dispose=function(){this.particleShaderMat.dispose(),this.particleNoiseTex.dispose(),this.particleSpriteTex.dispose();for(var t=0;t<this.PARTICLE_CONTAINERS;t++)this.particleContainers[t].dispose()},this.init()},THREE.GPUParticleSystem.prototype=Object.create(THREE.Object3D.prototype),THREE.GPUParticleSystem.prototype.constructor=THREE.GPUParticleSystem,THREE.GPUParticleContainer=function(t,C){THREE.Object3D.apply(this,arguments),this.PARTICLE_COUNT=t||1e5,this.PARTICLE_CURSOR=0,this.time=0,this.offset=0,this.count=0,this.DPR=window.devicePixelRatio,this.GPUParticleSystem=C,this.particleUpdate=!1,this.particleShaderGeo=new THREE.BufferGeometry,this.particleShaderGeo.addAttribute("position",new THREE.BufferAttribute(new Float32Array(3*this.PARTICLE_COUNT),3).setDynamic(!0)),this.particleShaderGeo.addAttribute("positionStart",new THREE.BufferAttribute(new Float32Array(3*this.PARTICLE_COUNT),3).setDynamic(!0)),this.particleShaderGeo.addAttribute("startTime",new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT),1).setDynamic(!0)),this.particleShaderGeo.addAttribute("velocity",new THREE.BufferAttribute(new Float32Array(3*this.PARTICLE_COUNT),3).setDynamic(!0)),this.particleShaderGeo.addAttribute("turbulence",new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT),1).setDynamic(!0)),this.particleShaderGeo.addAttribute("color",new THREE.BufferAttribute(new Float32Array(3*this.PARTICLE_COUNT),3).setDynamic(!0)),this.particleShaderGeo.addAttribute("size",new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT),1).setDynamic(!0)),this.particleShaderGeo.addAttribute("lifeTime",new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT),1).setDynamic(!0)),this.particleShaderMat=this.GPUParticleSystem.particleShaderMat;var v=new THREE.Vector3,g=new THREE.Vector3,P=new THREE.Color;this.spawnParticle=function(t){var e=this.particleShaderGeo.getAttribute("positionStart"),i=this.particleShaderGeo.getAttribute("startTime"),a=this.particleShaderGeo.getAttribute("velocity"),r=this.particleShaderGeo.getAttribute("turbulence"),o=this.particleShaderGeo.getAttribute("color"),s=this.particleShaderGeo.getAttribute("size"),n=this.particleShaderGeo.getAttribute("lifeTime");v=void 0!==(t=t||{}).position?v.copy(t.position):v.set(0,0,0),g=void 0!==t.velocity?g.copy(t.velocity):g.set(0,0,0),P=void 0!==t.color?P.set(t.color):P.set(16777215);var l=void 0!==t.positionRandomness?t.positionRandomness:0,d=void 0!==t.velocityRandomness?t.velocityRandomness:0,h=void 0!==t.colorRandomness?t.colorRandomness:1,c=void 0!==t.turbulence?t.turbulence:1,p=void 0!==t.lifetime?t.lifetime:5,u=void 0!==t.size?t.size:10,R=void 0!==t.sizeRandomness?t.sizeRandomness:0,f=void 0!==t.smoothPosition&&t.smoothPosition;void 0!==this.DPR&&(u*=this.DPR);var E=this.PARTICLE_CURSOR;e.array[3*E+0]=v.x+C.random()*l,e.array[3*E+1]=v.y+C.random()*l,e.array[3*E+2]=v.z+C.random()*l,!0===f&&(e.array[3*E+0]+=-g.x*C.random(),e.array[3*E+1]+=-g.y*C.random(),e.array[3*E+2]+=-g.z*C.random());var T=g.x+C.random()*d,m=g.y+C.random()*d,S=g.z+C.random()*d;T=THREE.Math.clamp((T- -2)/4,0,1),m=THREE.Math.clamp((m- -2)/4,0,1),S=THREE.Math.clamp((S- -2)/4,0,1),a.array[3*E+0]=T,a.array[3*E+1]=m,a.array[3*E+2]=S,P.r=THREE.Math.clamp(P.r+C.random()*h,0,1),P.g=THREE.Math.clamp(P.g+C.random()*h,0,1),P.b=THREE.Math.clamp(P.b+C.random()*h,0,1),o.array[3*E+0]=P.r,o.array[3*E+1]=P.g,o.array[3*E+2]=P.b,r.array[E]=c,s.array[E]=u+C.random()*R,n.array[E]=p,i.array[E]=this.time+.02*C.random(),0===this.offset&&(this.offset=this.PARTICLE_CURSOR),this.count++,this.PARTICLE_CURSOR++,this.PARTICLE_CURSOR>=this.PARTICLE_COUNT&&(this.PARTICLE_CURSOR=0),this.particleUpdate=!0},this.init=function(){this.particleSystem=new THREE.Points(this.particleShaderGeo,this.particleShaderMat),this.particleSystem.frustumCulled=!1,this.add(this.particleSystem)},this.update=function(t){this.time=t,this.particleShaderMat.uniforms.uTime.value=t,this.geometryUpdate()},this.geometryUpdate=function(){if(!0===this.particleUpdate){this.particleUpdate=!1;var t=this.particleShaderGeo.getAttribute("positionStart"),e=this.particleShaderGeo.getAttribute("startTime"),i=this.particleShaderGeo.getAttribute("velocity"),a=this.particleShaderGeo.getAttribute("turbulence"),r=this.particleShaderGeo.getAttribute("color"),o=this.particleShaderGeo.getAttribute("size"),s=this.particleShaderGeo.getAttribute("lifeTime");this.offset+this.count<this.PARTICLE_COUNT?(t.updateRange.offset=this.offset*t.itemSize,e.updateRange.offset=this.offset*e.itemSize,i.updateRange.offset=this.offset*i.itemSize,a.updateRange.offset=this.offset*a.itemSize,r.updateRange.offset=this.offset*r.itemSize,o.updateRange.offset=this.offset*o.itemSize,s.updateRange.offset=this.offset*s.itemSize,t.updateRange.count=this.count*t.itemSize,e.updateRange.count=this.count*e.itemSize,i.updateRange.count=this.count*i.itemSize,a.updateRange.count=this.count*a.itemSize,r.updateRange.count=this.count*r.itemSize,o.updateRange.count=this.count*o.itemSize,s.updateRange.count=this.count*s.itemSize):(t.updateRange.offset=0,e.updateRange.offset=0,i.updateRange.offset=0,a.updateRange.offset=0,r.updateRange.offset=0,o.updateRange.offset=0,s.updateRange.offset=0,t.updateRange.count=-1,e.updateRange.count=-1,i.updateRange.count=-1,a.updateRange.count=-1,r.updateRange.count=-1,o.updateRange.count=-1,s.updateRange.count=-1),t.needsUpdate=!0,e.needsUpdate=!0,i.needsUpdate=!0,a.needsUpdate=!0,r.needsUpdate=!0,o.needsUpdate=!0,s.needsUpdate=!0,this.offset=0,this.count=0}},this.dispose=function(){this.particleShaderGeo.dispose()},this.init()},THREE.GPUParticleContainer.prototype=Object.create(THREE.Object3D.prototype),THREE.GPUParticleContainer.prototype.constructor=THREE.GPUParticleContainer;

    var camera, tick = 0,
        scene, renderer, clock = new THREE.Clock(),
        container,
        options, spawnerOptions, particleSystem;
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



})();