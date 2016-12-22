import * as THREE from 'three'

export default class Torch extends THREE.Object3D {

  constructor (color = 0xffcc99, intensity = 0.1) {
    super()

    this.color = color
    this.intensity = intensity

    this.light = new THREE.PointLight(color, intensity, 20, 2)
    this.light.castShadow = true
    this.light.shadow.camera.near = 1
    this.light.shadow.camera.far = 30
    this.light.shadow.bias = 0.01

    var geometry = new THREE.SphereGeometry(0.05, 16, 16)
    var material = new THREE.MeshBasicMaterial({ color })
    this.sphere = new THREE.Mesh(geometry, material)

    var geometry = new THREE.CylinderGeometry( 0.03, 0.01, 0.5, 16 );
    var material = new THREE.MeshBasicMaterial( {color: 0x220000} );
    var cylinder = new THREE.Mesh( geometry, material );

    // cylinder.rotation.x = -Math.PI / 2
    cylinder.position.y = -0.25
    this.add( cylinder );

    this.sphere.add(this.light)
    this.add(this.sphere)

    // this.off()
  }

  update () {
    // TODO animate flame
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
