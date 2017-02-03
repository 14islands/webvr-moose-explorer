import * as THREE from 'three'

import Fire from './fire'

export default class Torch extends THREE.Object3D {

  constructor (color = 0xffcc99, intensity = 1.0) {
    super()

    this.color = color
    this.intensity = intensity

    this.light = new THREE.PointLight(color, intensity, 10, 1)
    this.light.castShadow = true
    this.light.shadow.camera.near = 1
    this.light.shadow.camera.far = 30
    this.light.shadow.bias = 0.01
    this.add(this.light)

    // handle
    var geometry = new THREE.CylinderGeometry(0.03, 0.01, 0.5, 16)
    var material = new THREE.MeshBasicMaterial({color: 0x220000})
    var handle = new THREE.Mesh(geometry, material)
    this.add(handle)

    // fire
    this.fire = new Fire()
    this.fire.init()
    this.light.position.y = 0.255
    this.fire.position.y = 0.255
    this.add(this.fire)

    // this.off()
  }

  update (delta, elapsed) {
    this.fire.update(delta, elapsed)
  }

  on () {
    this.light.intensity = this.intensity
    this.sphere.material.color.setHex(this.color)
  }

  off () {
    this.light.intensity = 0
    this.sphere.material.color.setHex(0x000000)
  }
}
