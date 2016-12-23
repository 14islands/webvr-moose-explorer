import * as THREE from 'three'

export default class Snowpuff {
  constructor (scene, offset = 0) {
    this.scene = scene
    this.numParticles = 20000

    this.maxHeight = 1.3
    this.minHeight = 0.2
    this.offset = offset

    var textureLoader = new THREE.TextureLoader()
    textureLoader.load('/assets/textures/snowflake.png', (texture) => {
      this.texture = texture
      this.system.material.uniforms.texture.value = texture
    })
    this.init()
  }

  init () {
    // var uniforms = {
    //   // texture:     { type: "t", value: texture},
    //   fogColor:    { type: "c", value: this.scene.fog.color },
    //   fogNear:     { type: "f", value: this.scene.fog.near },
    //   fogFar:      { type: "f", value: this.scene.fog.far },
    //   fogDensity: { type: "f", value: this.scene.fog.density }
    // };

    // var vertexShader = document.getElementById('fogVertexShader').textContent;
    var fragmentShader = document.getElementById('fogFragmentShader').textContent

    const systemGeometry = new THREE.BufferGeometry()
    const systemMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { type: 'c', value: new THREE.Color(0xFFFFFF) },
        height: { type: 'f', value: this.height },
        speed: { type: 'f', value: 4 },
        elapsedTime: { type: 'f', value: 0.0 },
        radius: { type: 'f', value: 0.2 },
        scale: { type: 'f', value: 4.0 },
        size: { type: 'f', value: 8.0 },
        opacity: { type: 'f', value: 0.05 },
        fogColor: { type: 'c', value: this.scene.fog.color },
        fogNear: { type: 'f', value: this.scene.fog.near },
        fogFar: { type: 'f', value: this.scene.fog.far },
        fogDensity: { type: 'f', value: this.scene.fog.density },
        texture: { type: 't', value: null }
      //   "c": {
      //     type: "f",
      //     value: 0
      //   },
      //   "p": {
      //     type: "f",
      //     value: 4.5
      //   },
      //   glowColor: {
      //     type: "c",
      //     value: new THREE.Color(0x0061c2)
      //   },
      //   fogC: {
      //     type: "c",
      //     value: new THREE.Color(0x000000)
      //   },
      //   viewVector: {
      //     type: "v3",
      //     value: {
      //       x: 0,
      //       y: 0,
      //       z: 400
      //     }
      //   },
      //   fogColor: {
      //     type: "c",
      //     value: this.scene.fog.color
      //   },
      //   fogFar: {
      //     type: "f",
      //     value: this.scene.fog.far
      //   },
      //   fogNear: {
      //     type: "f",
      //     value: this.scene.fog.near
      //   }
      },
      // uniforms : uniforms,
      transparent: true,
      // depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      // vertexShader : vertexShader,
      // fragmentShader: fragmentShader,
      fragmentShader: `
        varying vec2 vUv;

        uniform vec3 color;
        uniform float opacity;

        uniform sampler2D texture;
        uniform float fogDensity;
        ${THREE.ShaderChunk[ "common" ]}
        ${THREE.ShaderChunk[ "fog_pars_fragment" ]}
        void main() {
          vec4 texColor = texture2D( texture, gl_PointCoord );
          gl_FragColor = texColor * vec4( color, opacity );
          ${THREE.ShaderChunk['fog_fragment']}

          // addative blending bleeds through fog so let's reduce even more
          // if ( fogFactor > 0.5 ) gl_FragColor.w *= 0.1;
          gl_FragColor.w *= mix(1.0, 0.05, fogFactor);
        }
      `,
      fog: true,
      vertexShader: document.getElementById('snowpuff_vs').textContent
      // fragmentShader: document.getElementById('snowpuff_fs').textContent,
      // vertexShader: [
      //  'uniform vec3 viewVector;',
      //  'uniform float c;',
      //  'uniform float p;',
      //  'varying float intensity;',
      //  'void main()',
      //  '{',
      //    'vec3 vNormal = normalize( normalMatrix * normal );',
      //    'vec3 vNormel = normalize( normalMatrix * viewVector );',
      //    'intensity = pow( c - dot(vNormal, vNormel), p );',
      //    'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      //  '}'
      // ].join("\n"),
      // fragmentShader: [
      //   'uniform vec3 glowColor;',
      //   'uniform vec3 fogC;',
      //   'varying float intensity;',
      //   THREE.ShaderChunk[ "common" ],
      //   THREE.ShaderChunk[ "fog_pars_fragment" ],
      //   'void main()',
      //   '{',
      //     'vec3 glow = glowColor * intensity;',
      //     'gl_FragColor = vec4(glow, 1.0 );',
      //     'float depth = gl_FragCoord.z / gl_FragCoord.w;',
      //     'float fogFactor = smoothstep( fogNear, fogFar, depth );',
      //     'gl_FragColor = mix( gl_FragColor, vec4( fogC, gl_FragColor.w ), fogFactor );',
      //
      //   '}'
      // ].join('\n'),
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
      const theta = this.randCenter(Math.PI/* * 0.66*/)
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
