import * as THREE from 'three'

import Snowpuff from './snowpuff'
import {randomBetween, randomPick} from './utils/random-util'

const MIN_DISTANCE = 1
const MAX_DISTANCE = 7

export default class Moose {

  constructor (scene, loader) {
    this.scene = scene
    this.snowpuffs = []
    this.loader = loader

    this.mooseStart = -20
    this.mooseDistance = 0
    this.mooseAngle = false

    this.mooseWrapper = undefined
    this.moose = undefined
    this.mesh = undefined
    this.mixer = undefined
    this.animationClip = undefined
    this.animationAction = undefined

    this.load()
  }

  load () {
    this.loader.load(
      // resource URL
      '/assets/models/moose_life.js',
      // Function when resource is loaded
      (geometry, materials) => {
        this.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
          vertexColors: THREE.FaceColors,
          morphTargets: true
        }))
        this.mesh.scale.setScalar(0.01)
        this.mesh.castShadow = true

        this.moose = new THREE.Object3D()
        this.moose.add(this.mesh)

        this.mooseWrapper = new THREE.Object3D()
        this.mooseWrapper.add(this.moose)

        // debug position
        // this.mooseWrapper.position.set(0, 0, -5)
        // this.moose.rotation.y = Math.PI / 2

        // add to scene
        this.scene.add(this.mooseWrapper)

        this.initAnimation(geometry)
        this.initSnowEffect()
      }
    )
  }

  initAnimation (geometry) {
    this.mixer = new THREE.AnimationMixer(this.mesh)
    this.animationClip = THREE.AnimationClip.CreateFromMorphTargetSequence('gallop', geometry.morphTargets, 60)
    this.animationAction = this.mixer.clipAction(this.animationClip).setDuration(1).play()
  }

  initSnowEffect () {
    const puff = new Snowpuff(this.scene)
    puff.system.position.set(0, 0, 0)
    this.moose.add(puff.system)
    this.snowpuffs.push(puff)

    const puff2 = new Snowpuff(this.scene, 0.15)
    puff2.system.position.set(0, 0, -1.5)
    this.moose.add(puff2.system)
    this.snowpuffs.push(puff2)
  }

  update (delta, elapsed) {
    if (!this.mixer) {
      return
    }

    // figure out distance since last frame
    this.mooseDistance += delta * 3
    const pos = this.mooseStart + this.mooseDistance

    // turn around when out of screen
    if (!this.mooseAngle || pos > Math.abs(this.mooseStart)) {
      // turn around at slightly different random angle
      this.mooseAngle += Math.PI + randomBetween(-Math.PI / 8, Math.PI / 8)
      this.mooseDistance = 0
      this.mooseWrapper.rotation.y = this.mooseAngle

      const distance = randomBetween(MIN_DISTANCE, MAX_DISTANCE)
      this.moose.position.x = randomPick([distance, -distance])
    }

    // move and animate
    this.moose.position.z = pos
    this.mixer.update(delta)
    for (let snowpuff of this.snowpuffs) {
      snowpuff.update(delta, elapsed)
    }
  }
}
