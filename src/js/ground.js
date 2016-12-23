import {convertMaterialsToLambert} from './utils/material-util'

export default class Ground {

  constructor (scene, objectLoader, snowHeight) {
    window.fetch('/assets/models/snowcap.json')
    .then(
      function (response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' + response.status)
          return
        }
        // Examine the text in the response
        response.json().then(function (data) {
          convertMaterialsToLambert(data)
          const obj = objectLoader.parse(data)
          obj.position.y = snowHeight + 0.1
          obj.scale.setScalar(0.35)
          // for (let i = 0; i < obj.children.length; i++) {
          //   obj.children[i].geometry.computeFlatVertexNormals()
          // }
          scene.add(obj)
        })
      }
    )
  }
}
