import * as THREE from 'three'

import {randomBetween, randomPick} from './utils/random-util'

export default class Ground {

  constructor (scene) {
    const loader = new THREE.JSONLoader()
    loader.load(
      // resource URL
      'assets/models/treeGenericLower.js',
      // Function when resource is loaded
      function (geometry) {
        const treeMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
          vertexColors: THREE.FaceColors,
          transparent: true,
          opacity: 0.8
        }))
        treeMesh.scale.setScalar(0.01)
        treeMesh.castShadow = true

        for (let i = 0; i < 40; i++) {
          const randomX = randomBetween(6, 11) * randomPick([-1, 1])
          const randomZ = randomBetween(6, 11) * randomPick([-1, 1])
          const tree = treeMesh.clone()
          tree.position.set(randomX, -0.5, randomZ)
          scene.add(tree)
        }
      }
    )
  }
}
