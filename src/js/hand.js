import * as THREE from 'three'
import {convertMaterialsToLambert} from './utils/material-util'

export default class Hand extends THREE.Object3D {

  constructor (objectLoader, modelSrc) {
    super()

    this.objectLoader = objectLoader
    this.modelSrc = modelSrc
    this.action = {}

    this.load()
  }

  load () {
    window.fetch(this.modelSrc)
    .then((response) => {
      if (response.status !== 200) {
        console.log('Looks like there was a problem. Status Code: ' + response.status)
        return
      }
      // parse json
      response.json().then(this.handleData.bind(this))
    })
  }

  handleData (data) {
    convertMaterialsToLambert(data)

    // enable skinned animation
    for (let i = 0; i < data.materials.length; i++) {
      data.materials[i].skinning = true
    }

    const obj = this.objectLoader.parse(data)

    // make flat shaded
    for (let i = 0; i < obj.children.length; i++) {
      obj.children[i].geometry.computeFlatVertexNormals()
    }

    const skinnedMesh = obj.children[0]
    const animations = skinnedMesh.geometry.animations

    this.mixer = new THREE.AnimationMixer(skinnedMesh)
    for (let animation of animations) {
      this.action[animation.name] = this.mixer.clipAction(animation, skinnedMesh)
      this.action[animation.name].setLoop(THREE.LoopOnce, 0)
      this.action[animation.name].clampWhenFinished = true
    }

    this.add(obj)
  }

  update (delta) {
    if (this.mixer) {
      this.mixer.update(delta)
    }
  }

  grip () {
    this.action['Grip'].play()
  }

  release () {
    this.action['Grip'].stop()
  }
}
