import * as THREE from 'three'

export default class Snowpuff {
  constructor (scene, offset = 0) {
    this.scene = scene
    this.numParticles = 20000

    this.maxHeight = 0.5
    this.minHeight = 0.2
    this.offset = offset

    var textureLoader = new THREE.TextureLoader()
    textureLoader.load('assets/textures/snowflake.png', (texture) => {
      this.texture = texture
      this.system.material.uniforms.texture.value = texture
    })
    this.init()
  }

  init () {
    const systemGeometry = new THREE.BufferGeometry()
    const systemMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { type: 'c', value: new THREE.Color(0xFFFFFF) },
        speed: { type: 'f', value: 4 },
        elapsedTime: { type: 'f', value: 0.0 },
        scale: { type: 'f', value: 4.0 },
        size: { type: 'f', value: 8.0 },
        opacity: { type: 'f', value: 0.7 },
        fogColor: { type: 'c', value: this.scene.fog.color },
        fogNear: { type: 'f', value: this.scene.fog.near },
        fogFar: { type: 'f', value: this.scene.fog.far },
        fogDensity: { type: 'f', value: this.scene.fog.density },
        texture: { type: 't', value: null }
      },
      transparent: true,
      // depthTest: false,
      depthWrite: false,
      // blending: THREE.AdditiveBlending,
      fragmentShader: `
        varying vec2 vUv;

        uniform vec3 color;
        uniform float opacity;
        uniform sampler2D texture;

        ${THREE.ShaderChunk['common']}
        ${THREE.ShaderChunk['fog_pars_fragment']}
        void main() {
          vec4 texColor = texture2D( texture, gl_PointCoord );
          gl_FragColor = texColor * vec4( color, opacity );
          ${THREE.ShaderChunk['fog_fragment']}

          // addative blending bleeds through fog so let's reduce even more
          // gl_FragColor.w *= mix(1.0, 0.05, fogFactor);
        }
      `,
      fog: true,
      vertexShader: `
        uniform float elapsedTime;
        uniform float speed;
        uniform float scale;
        uniform float size;
        attribute vec3 velocity;
        // attribute float uniqueness;

        varying vec2 vUv;
        varying vec3 vPosition;
        void main( void ) {
          vUv = uv;
          vPosition = position;

          // make time loop
          float time = mod(elapsedTime, 1.0);

          vec3 gravity = vec3(0, 1, 0) * time * speed * 0.4;
          vec3 direction = (velocity + vec3(0, 0, -0.5)) * time * speed * 1.0;
          vec3 pos = position + direction + pow(gravity, vec3(2.0)) * -1.0;

          vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
          gl_PointSize = size * ( scale / length( mvPosition.xyz ) );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
        }
      `
    })

    const positions = new Float32Array(this.numParticles * 3)
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = 0
    }
    const uniqueness = new Float32Array(this.numParticles)
    const velocity = new Float32Array(this.numParticles * 3)
    for (let i = 0; i < velocity.length; i += 3) {
      const len = Math.random() * this.maxHeight + this.minHeight
      const phi = this.randCenter(Math.PI * 0.66)
      const theta = this.randCenter(Math.PI)
      const sphereCoord = THREE.Spherical(len, phi, theta)

      const v = new THREE.Vector3()
      v.setFromSpherical(sphereCoord)
      velocity[i] = v.x
      velocity[i + 1] = v.y
      velocity[i + 2] = v.z
    }

    // push some uniqueness - because snowflakes...
    for (let i = 0; i < this.numParticles; i++) {
      uniqueness[i] = Math.random()
    }

    systemGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    systemGeometry.addAttribute('velocity', new THREE.BufferAttribute(velocity, 3))
    systemGeometry.addAttribute('uniqueness', new THREE.BufferAttribute(uniqueness, 1))
    systemGeometry.computeBoundingSphere()
    this.system = new THREE.Points(systemGeometry, systemMaterial)

    // help THREE place snow on top of transparent objects
    // this.system.renderOrder = 1
  }

  update (delta, elapsed) {
    this.system.material.uniforms.elapsedTime.value = elapsed + this.offset
  }

  randCenter (v) {
    return (v * (Math.random() - 0.5))
  }
}
