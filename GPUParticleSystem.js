/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

(function (global) {
    var module = global.noise = {};

    function Grad(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }

    Grad.prototype.dot2 = function (x, y) {
        return this.x * x + this.y * y;
    };

    Grad.prototype.dot3 = function (x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    };

    var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];

    var p = [151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    // To remove the need for index wrapping, double the permutation table length
    var perm = new Array(512);
    var gradP = new Array(512);

    // This isn't a very good seeding function, but it works ok. It supports 2^16
    // different seed values. Write something better if you need more seeds.
    module.seed = function (seed) {
        if (seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }

        seed = Math.floor(seed);
        if (seed < 256) {
            seed |= seed << 8;
        }

        for (var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = p[i] ^ (seed & 255);
            } else {
                v = p[i] ^ ((seed >> 8) & 255);
            }

            perm[i] = perm[i + 256] = v;
            gradP[i] = gradP[i + 256] = grad3[v % 12];
        }
    };

    module.seed(0);

    /*
    for(var i=0; i<256; i++) {
      perm[i] = perm[i + 256] = p[i];
      gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
    }*/

    // Skewing and unskewing factors for 2, 3, and 4 dimensions
    var F2 = 0.5 * (Math.sqrt(3) - 1);
    var G2 = (3 - Math.sqrt(3)) / 6;

    var F3 = 1 / 3;
    var G3 = 1 / 6;

    // 2D simplex noise
    module.simplex2 = function (xin, yin) {
        var n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin) * F2; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
        var y0 = yin - j + t;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
            i1 = 1; j1 = 0;
        } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
            i1 = 0; j1 = 1;
        }
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1 + 2 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        i &= 255;
        j &= 255;
        var gi0 = gradP[i + perm[j]];
        var gi1 = gradP[i + i1 + perm[j + j1]];
        var gi2 = gradP[i + 1 + perm[j + 1]];
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot2(x1, y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot2(x2, y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70 * (n0 + n1 + n2);
    };

    // 3D simplex noise
    module.simplex3 = function (xin, yin, zin) {
        var n0, n1, n2, n3; // Noise contributions from the four corners

        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * F3; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);

        var t = (i + j + k) * G3;
        var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
        var y0 = yin - j + t;
        var z0 = zin - k + t;

        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
            if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;

        var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
        var y2 = y0 - j2 + 2 * G3;
        var z2 = z0 - k2 + 2 * G3;

        var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
        var y3 = y0 - 1 + 3 * G3;
        var z3 = z0 - 1 + 3 * G3;

        // Work out the hashed gradient indices of the four simplex corners
        i &= 255;
        j &= 255;
        k &= 255;
        var gi0 = gradP[i + perm[j + perm[k]]];
        var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
        var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
        var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) {
            n3 = 0;
        } else {
            t3 *= t3;
            n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 32 * (n0 + n1 + n2 + n3);

    };

    // ##### Perlin noise stuff

    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }

    // 2D Perlin Noise
    module.perlin2 = function (x, y) {
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y);
        // Get relative xy coordinates of point within that cell
        x = x - X; y = y - Y;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255;

        // Calculate noise contributions from each of the four corners
        var n00 = gradP[X + perm[Y]].dot2(x, y);
        var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
        var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
        var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

        // Compute the fade curve value for x
        var u = fade(x);

        // Interpolate the four results
        return lerp(
            lerp(n00, n10, u),
            lerp(n01, n11, u),
            fade(y));
    };

    // 3D Perlin Noise
    module.perlin3 = function (x, y, z) {
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
        // Get relative xyz coordinates of point within that cell
        x = x - X; y = y - Y; z = z - Z;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255; Z = Z & 255;

        // Calculate noise contributions from each of the eight corners
        var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
        var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
        var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
        var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
        var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
        var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
        var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
        var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

        // Compute the fade curve value for x, y, z
        var u = fade(x);
        var v = fade(y);
        var w = fade(z);

        // Interpolate
        return lerp(
            lerp(
                lerp(n000, n100, u),
                lerp(n001, n101, u), w),
            lerp(
                lerp(n010, n110, u),
                lerp(n011, n111, u), w),
            v);
    };

})(this);


/*
 * GPU Particle System
 * @author flimshaw - Charlie Hoey - http://charliehoey.com
 *
 * A simple to use, general purpose GPU system. Particles are spawn-and-forget with
 * several options available, and do not require monitoring or cleanup after spawning.
 * Because the paths of all particles are completely deterministic once spawned, the scale
 * and direction of time is also variable.
 *
 * Currently uses a static wrapping perlin noise texture for turbulence, and a small png texture for
 * particles, but adding support for a particle texture atlas or changing to a different type of turbulence
 * would be a fairly light day's work.
 *
 * Shader and javascript packing code derrived from several Stack Overflow examples.
 *
 */
THREE.GPUParticleSystem = function (options) {

	THREE.Object3D.apply(this, arguments);

	options = options || {};

	// parse options and use defaults

	this.PARTICLE_COUNT = options.maxParticles || 1000000;
	this.PARTICLE_CONTAINERS = options.containerCount || 1;

	this.PARTICLE_NOISE_TEXTURE = options.particleNoiseTex || null;
	this.PARTICLE_SPRITE_TEXTURE = options.particleSpriteTex || null;

	this.PARTICLES_PER_CONTAINER = Math.ceil(this.PARTICLE_COUNT / this.PARTICLE_CONTAINERS);
	this.PARTICLE_CURSOR = 0;
	this.time = 0;
	this.particleContainers = [];
	this.rand = [];



	// custom vertex and fragement shader
	var GPUParticleShader = {

		vertexShader: [

			'uniform float uTime;',
			'uniform float uScale;',
			'uniform sampler2D tNoise;',

			'attribute vec3 positionStart;',
			'attribute float startTime;',
			'attribute vec3 velocity;',
			'attribute float turbulence;',
			'attribute vec3 color;',
			'attribute float size;',
			'attribute float lifeTime;',

			'varying vec4 vColor;',
			'varying float lifeLeft;',

			'void main() {',

			// unpack things from our attributes'

			'	vColor = vec4( color, 1.0 );',

			// convert our velocity back into a value we can use'

			'	vec3 newPosition;',
			'	vec3 v;',

			'	float timeElapsed = uTime - startTime;',

			'	lifeLeft = 1.0 - ( timeElapsed / lifeTime );',

			'	gl_PointSize = ( uScale * size ) * lifeLeft;',

			'	v.x = ( velocity.x - 0.5 ) * 3.0;',
			'	v.y = ( velocity.y - 0.5 ) * 3.0;',
			'	v.z = ( velocity.z - 0.5 ) * 3.0;',

			'	newPosition = positionStart + ( v * 10.0 ) * timeElapsed;',

			'	vec3 noise = texture2D( tNoise, vec2( newPosition.x * 0.015 + ( uTime * 0.05 ), newPosition.y * 0.02 + ( uTime * 0.015 ) ) ).rgb;',
			'	vec3 noiseVel = ( noise.rgb - 0.5 ) * 30.0;',

			'	newPosition = mix( newPosition, newPosition + vec3( noiseVel * ( turbulence * 5.0 ) ), ( timeElapsed / lifeTime ) );',

			'	if( v.y > 0. && v.y < .05 ) {',

			'		lifeLeft = 0.0;',

			'	}',

			'	if( v.x < - 1.45 ) {',

			'		lifeLeft = 0.0;',

			'	}',

			'	if( timeElapsed > 0.0 ) {',

			'		gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );',

			'	} else {',

			'		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'		lifeLeft = 0.0;',
			'		gl_PointSize = 0.;',

			'	}',

			'}'

		].join('\n'),

		fragmentShader: [

			'float scaleLinear( float value, vec2 valueDomain ) {',

			'	return ( value - valueDomain.x ) / ( valueDomain.y - valueDomain.x );',

			'}',

			'float scaleLinear( float value, vec2 valueDomain, vec2 valueRange ) {',

			'	return mix( valueRange.x, valueRange.y, scaleLinear( value, valueDomain ) );',

			'}',

			'varying vec4 vColor;',
			'varying float lifeLeft;',

			'uniform sampler2D tSprite;',

			'void main() {',

			'	float alpha = 0.;',

			'	if( lifeLeft > 0.995 ) {',

			'		alpha = scaleLinear( lifeLeft, vec2( 1.0, 0.995 ), vec2( 0.0, 1.0 ) );',

			'	} else {',

			'		alpha = lifeLeft * 0.75;',

			'	}',

			'	vec4 tex = texture2D( tSprite, gl_PointCoord );',
			'	gl_FragColor = vec4( vColor.rgb * tex.a, alpha * tex.a );',

			'}'

		].join('\n')

	};

	// preload a million random numbers

	var i;

	for (i = 1e5; i > 0; i--) {

		this.rand.push(Math.random() - 0.5);

	}

	this.random = function () {

		return ++i >= this.rand.length ? this.rand[i = 1] : this.rand[i];

	};

	// var textureLoader = new THREE.TextureLoader();
	//allow cross origin loading
	// textureLoader.crossOrigin = '';

	function generateSprite() {

		var canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;

		var context = canvas.getContext('2d');
		var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);

		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.3, 'rgba(255,255,255,0.60)');
		gradient.addColorStop(0.6, 'rgba(255,255,255,0.25)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');

		context.fillStyle = gradient;
		context.fillRect(0, 0, canvas.width, canvas.height);

		return canvas;
	}

	// var noise = generateNoise();
	// this.particleNoiseTex = new THREE.CanvasTexture(noise);
	// this.particleNoiseTex.wrapS = this.particleNoiseTex.wrapT = THREE.RepeatWrapping;

	var canvas = generateSprite();
	this.particleSpriteTex = new THREE.CanvasTexture(canvas);
	this.particleSpriteTex.wrapS = this.particleSpriteTex.wrapT = THREE.RepeatWrapping;

	this.particleShaderMat = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: {
			'uTime': {
				value: 0.0
			},
			'uScale': {
				value: 1.0
			},
			'tNoise': {
				value: this.particleNoiseTex
			},
			'tSprite': {
				value: this.particleSpriteTex
			}
		},
		blending: THREE.AdditiveBlending,
		vertexShader: GPUParticleShader.vertexShader,
		fragmentShader: GPUParticleShader.fragmentShader
	});

	// define defaults for all values

	this.particleShaderMat.defaultAttributeValues.particlePositionsStartTime = [0, 0, 0, 0];
	this.particleShaderMat.defaultAttributeValues.particleVelColSizeLife = [0, 0, 0, 0];

	this.init = function () {

		for (var i = 0; i < this.PARTICLE_CONTAINERS; i++) {

			var c = new THREE.GPUParticleContainer(this.PARTICLES_PER_CONTAINER, this);
			this.particleContainers.push(c);
			this.add(c);

		}

	};

	this.spawnParticle = function (options) {

		this.PARTICLE_CURSOR++;

		if (this.PARTICLE_CURSOR >= this.PARTICLE_COUNT) {

			this.PARTICLE_CURSOR = 1;

		}

		var currentContainer = this.particleContainers[Math.floor(this.PARTICLE_CURSOR / this.PARTICLES_PER_CONTAINER)];

		currentContainer.spawnParticle(options);

	};

	this.update = function (time) {

		for (var i = 0; i < this.PARTICLE_CONTAINERS; i++) {

			this.particleContainers[i].update(time);

		}

	};

	this.dispose = function () {

		this.particleShaderMat.dispose();
		this.particleNoiseTex.dispose();
		this.particleSpriteTex.dispose();

		for (var i = 0; i < this.PARTICLE_CONTAINERS; i++) {

			this.particleContainers[i].dispose();

		}

	};

	this.init();

};

THREE.GPUParticleSystem.prototype = Object.create(THREE.Object3D.prototype);
THREE.GPUParticleSystem.prototype.constructor = THREE.GPUParticleSystem;


// Subclass for particle containers, allows for very large arrays to be spread out

THREE.GPUParticleContainer = function (maxParticles, particleSystem) {

	THREE.Object3D.apply(this, arguments);

	this.PARTICLE_COUNT = maxParticles || 100000;
	this.PARTICLE_CURSOR = 0;
	this.time = 0;
	this.offset = 0;
	this.count = 0;
	this.DPR = window.devicePixelRatio;
	this.GPUParticleSystem = particleSystem;
	this.particleUpdate = false;

	// geometry

	this.particleShaderGeo = new THREE.BufferGeometry();

	this.particleShaderGeo.addAttribute('position', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
	this.particleShaderGeo.addAttribute('positionStart', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
	this.particleShaderGeo.addAttribute('startTime', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true));
	this.particleShaderGeo.addAttribute('velocity', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
	this.particleShaderGeo.addAttribute('turbulence', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true));
	this.particleShaderGeo.addAttribute('color', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
	this.particleShaderGeo.addAttribute('size', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true));
	this.particleShaderGeo.addAttribute('lifeTime', new THREE.BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true));

	// material

	this.particleShaderMat = this.GPUParticleSystem.particleShaderMat;

	var position = new THREE.Vector3();
	var velocity = new THREE.Vector3();
	var color = new THREE.Color();

	this.spawnParticle = function (options) {

		var positionStartAttribute = this.particleShaderGeo.getAttribute('positionStart');
		var startTimeAttribute = this.particleShaderGeo.getAttribute('startTime');
		var velocityAttribute = this.particleShaderGeo.getAttribute('velocity');
		var turbulenceAttribute = this.particleShaderGeo.getAttribute('turbulence');
		var colorAttribute = this.particleShaderGeo.getAttribute('color');
		var sizeAttribute = this.particleShaderGeo.getAttribute('size');
		var lifeTimeAttribute = this.particleShaderGeo.getAttribute('lifeTime');

		options = options || {};

		// setup reasonable default values for all arguments

		position = options.position !== undefined ? position.copy(options.position) : position.set(0, 0, 0);
		velocity = options.velocity !== undefined ? velocity.copy(options.velocity) : velocity.set(0, 0, 0);
		color = options.color !== undefined ? color.set(options.color) : color.set(0xffffff);

		var positionRandomness = options.positionRandomness !== undefined ? options.positionRandomness : 0;
		var velocityRandomness = options.velocityRandomness !== undefined ? options.velocityRandomness : 0;
		var colorRandomness = options.colorRandomness !== undefined ? options.colorRandomness : 1;
		var turbulence = options.turbulence !== undefined ? options.turbulence : 1;
		var lifetime = options.lifetime !== undefined ? options.lifetime : 5;
		var size = options.size !== undefined ? options.size : 10;
		var sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 0;
		var smoothPosition = options.smoothPosition !== undefined ? options.smoothPosition : false;

		if (this.DPR !== undefined) size *= this.DPR;

		var i = this.PARTICLE_CURSOR;

		// position

		positionStartAttribute.array[i * 3 + 0] = position.x + (particleSystem.random() * positionRandomness);
		positionStartAttribute.array[i * 3 + 1] = position.y + (particleSystem.random() * positionRandomness);
		positionStartAttribute.array[i * 3 + 2] = position.z + (particleSystem.random() * positionRandomness);

		if (smoothPosition === true) {

			positionStartAttribute.array[i * 3 + 0] += -(velocity.x * particleSystem.random());
			positionStartAttribute.array[i * 3 + 1] += -(velocity.y * particleSystem.random());
			positionStartAttribute.array[i * 3 + 2] += -(velocity.z * particleSystem.random());

		}

		// velocity

		var maxVel = 2;

		var velX = velocity.x + particleSystem.random() * velocityRandomness;
		var velY = velocity.y + particleSystem.random() * velocityRandomness;
		var velZ = velocity.z + particleSystem.random() * velocityRandomness;

		velX = THREE.Math.clamp((velX - (-maxVel)) / (maxVel - (-maxVel)), 0, 1);
		velY = THREE.Math.clamp((velY - (-maxVel)) / (maxVel - (-maxVel)), 0, 1);
		velZ = THREE.Math.clamp((velZ - (-maxVel)) / (maxVel - (-maxVel)), 0, 1);

		velocityAttribute.array[i * 3 + 0] = velX;
		velocityAttribute.array[i * 3 + 1] = velY;
		velocityAttribute.array[i * 3 + 2] = velZ;

		// color

		color.r = THREE.Math.clamp(color.r + particleSystem.random() * colorRandomness, 0, 1);
		color.g = THREE.Math.clamp(color.g + particleSystem.random() * colorRandomness, 0, 1);
		color.b = THREE.Math.clamp(color.b + particleSystem.random() * colorRandomness, 0, 1);

		colorAttribute.array[i * 3 + 0] = color.r;
		colorAttribute.array[i * 3 + 1] = color.g;
		colorAttribute.array[i * 3 + 2] = color.b;

		// turbulence, size, lifetime and starttime

		turbulenceAttribute.array[i] = turbulence;
		sizeAttribute.array[i] = size + particleSystem.random() * sizeRandomness;
		lifeTimeAttribute.array[i] = lifetime;
		startTimeAttribute.array[i] = this.time + particleSystem.random() * 2e-2;

		// offset

		if (this.offset === 0) {

			this.offset = this.PARTICLE_CURSOR;

		}

		// counter and cursor

		this.count++;
		this.PARTICLE_CURSOR++;

		if (this.PARTICLE_CURSOR >= this.PARTICLE_COUNT) {

			this.PARTICLE_CURSOR = 0;

		}

		this.particleUpdate = true;

	};

	this.init = function () {

		this.particleSystem = new THREE.Points(this.particleShaderGeo, this.particleShaderMat);
		this.particleSystem.frustumCulled = false;
		this.add(this.particleSystem);

	};

	this.update = function (time) {

		this.time = time;
		this.particleShaderMat.uniforms.uTime.value = time;

		this.geometryUpdate();

	};

	this.geometryUpdate = function () {

		if (this.particleUpdate === true) {

			this.particleUpdate = false;

			var positionStartAttribute = this.particleShaderGeo.getAttribute('positionStart');
			var startTimeAttribute = this.particleShaderGeo.getAttribute('startTime');
			var velocityAttribute = this.particleShaderGeo.getAttribute('velocity');
			var turbulenceAttribute = this.particleShaderGeo.getAttribute('turbulence');
			var colorAttribute = this.particleShaderGeo.getAttribute('color');
			var sizeAttribute = this.particleShaderGeo.getAttribute('size');
			var lifeTimeAttribute = this.particleShaderGeo.getAttribute('lifeTime');

			if (this.offset + this.count < this.PARTICLE_COUNT) {

				positionStartAttribute.updateRange.offset = this.offset * positionStartAttribute.itemSize;
				startTimeAttribute.updateRange.offset = this.offset * startTimeAttribute.itemSize;
				velocityAttribute.updateRange.offset = this.offset * velocityAttribute.itemSize;
				turbulenceAttribute.updateRange.offset = this.offset * turbulenceAttribute.itemSize;
				colorAttribute.updateRange.offset = this.offset * colorAttribute.itemSize;
				sizeAttribute.updateRange.offset = this.offset * sizeAttribute.itemSize;
				lifeTimeAttribute.updateRange.offset = this.offset * lifeTimeAttribute.itemSize;

				positionStartAttribute.updateRange.count = this.count * positionStartAttribute.itemSize;
				startTimeAttribute.updateRange.count = this.count * startTimeAttribute.itemSize;
				velocityAttribute.updateRange.count = this.count * velocityAttribute.itemSize;
				turbulenceAttribute.updateRange.count = this.count * turbulenceAttribute.itemSize;
				colorAttribute.updateRange.count = this.count * colorAttribute.itemSize;
				sizeAttribute.updateRange.count = this.count * sizeAttribute.itemSize;
				lifeTimeAttribute.updateRange.count = this.count * lifeTimeAttribute.itemSize;

			} else {

				positionStartAttribute.updateRange.offset = 0;
				startTimeAttribute.updateRange.offset = 0;
				velocityAttribute.updateRange.offset = 0;
				turbulenceAttribute.updateRange.offset = 0;
				colorAttribute.updateRange.offset = 0;
				sizeAttribute.updateRange.offset = 0;
				lifeTimeAttribute.updateRange.offset = 0;

				// Use -1 to update the entire buffer, see #11476
				positionStartAttribute.updateRange.count = -1;
				startTimeAttribute.updateRange.count = -1;
				velocityAttribute.updateRange.count = -1;
				turbulenceAttribute.updateRange.count = -1;
				colorAttribute.updateRange.count = -1;
				sizeAttribute.updateRange.count = -1;
				lifeTimeAttribute.updateRange.count = -1;

			}

			positionStartAttribute.needsUpdate = true;
			startTimeAttribute.needsUpdate = true;
			velocityAttribute.needsUpdate = true;
			turbulenceAttribute.needsUpdate = true;
			colorAttribute.needsUpdate = true;
			sizeAttribute.needsUpdate = true;
			lifeTimeAttribute.needsUpdate = true;

			this.offset = 0;
			this.count = 0;

		}

	};

	this.dispose = function () {

		this.particleShaderGeo.dispose();

	};

	this.init();

};
THREE.GPUParticleContainer.prototype = Object.create(THREE.Object3D.prototype);
THREE.GPUParticleContainer.prototype.constructor = THREE.GPUParticleContainer;