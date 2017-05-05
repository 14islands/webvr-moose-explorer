import 'whatwg-fetch'
import * as THREE from 'three'
import query from './utils/query'
import Ground from './ground'
import Treeline from './treeline'
import Moose from './moose'
import Snowfall from './snowfall'
import Torch from './torch'
import Hand from './hand'

import Snowpuff from './snowpuff'

// load shimmed plugins - access on THREE namespace
import _OBJLoader from 'OBJLoader' // eslint-disable-line no-unused-vars
import _VRControls from 'VRControls' // eslint-disable-line no-unused-vars
import _VREffect from 'VREffect' // eslint-disable-line no-unused-vars
import _ViveController from 'ViveController' // eslint-disable-line no-unused-vars

// Import WebVRManager npm module
import WebVRManager from 'webvr-boilerplate'

const SNOW_HEIGHT = 0.5

const clock = new THREE.Clock()
const jsonLoader = new THREE.JSONLoader()
const objectLoader = new THREE.ObjectLoader()

// user objects that need update on each frame
const updateObjects = []

let scene, camera, HEIGHT, WIDTH, renderer, container
let vrControls, vrEffect, vrManager, vrDisplay
let viveController1, viveController2

let ground // eslint-disable-line no-unused-vars
let treeline // eslint-disable-line no-unused-vars

const isNight = query.isNight
const bgColor = isNight ? 0x111122 : 0xc6ccff

function createScene () {
  HEIGHT = window.innerHeight
  WIDTH = window.innerWidth

  // Create the scene
  scene = new THREE.Scene()

  // Add a fog vrEffect to the scene using similar color as background
  // scene.fog = new THREE.Fog(0xc6ccff, 4, 11)
  scene.fog = new THREE.FogExp2(bgColor, 0.15)

  // Create the camera
  const aspectRatio = WIDTH / HEIGHT
  const fieldOfView = 60
  const nearPlane = 0.05
  const farPlane = 50
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  )

  // Create the renderer
  renderer = new THREE.WebGLRenderer({
    // Allow transparency to show the gradient background
    // we defined in the CSS
    alpha: false,
    // Activate the anti-aliasing this is less performant,
    // but, as our project is low-poly based, it should be fine :)
    antialias: true
  })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(bgColor, 1)

  // Define the size of the renderer in this case,
  // it will fill the entire screen
  renderer.setSize(WIDTH, HEIGHT)

  // Enable shadow rendering
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Add the DOM element of the renderer to the
  // container we created in the HTML
  container = document.getElementById('world')
  container.appendChild(renderer.domElement)
}

function handleWindowResize () {
  // update height and width of the renderer and the camera
  HEIGHT = window.innerHeight
  WIDTH = window.innerWidth
  vrEffect.setSize(WIDTH, HEIGHT)
  renderer.setSize(WIDTH, HEIGHT)
  camera.aspect = WIDTH / HEIGHT
  camera.updateProjectionMatrix()
}

function createLights () {
  // A directional light shines from a specific direction.
  // It acts like the sun, that means that all the rays produced are parallel.
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.1)

  // Set the direction of the light
  shadowLight.position.set(1, 2, -1)
  shadowLight.position.normalize()

  // Allow shadow casting
  shadowLight.castShadow = true

  // define the visible area of the projected shadow
  shadowLight.shadow.camera.left = -10
  shadowLight.shadow.camera.right = 10
  shadowLight.shadow.camera.top = 10
  shadowLight.shadow.camera.bottom = -10
  shadowLight.shadow.camera.near = -10
  shadowLight.shadow.camera.far = 10

  // debug light
  if (query.debug) {
    scene.add(new THREE.CameraHelper(shadowLight.shadow.camera))
  }

  // define the resolution of the shadow the higher the better,
  // but also the more expensive and less performant
  shadowLight.shadow.mapSize.width = 1024 * 2
  shadowLight.shadow.mapSize.height = 1024 * 2

  // an ambient light modifies the global color of a scene and makes the shadows softer
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
  if (isNight) {
    ambientLight.intensity = 0.1
  }

  scene.add(shadowLight)
  scene.add(ambientLight)
}

function createSnowFall () {
  const snowfall = new Snowfall(100000)
  snowfall.system.position.set(0, SNOW_HEIGHT, 0)
  scene.add(snowfall.system)
  return snowfall
}

function createHands () {
  if (viveController1) {
    const handL = new Hand(objectLoader, '/assets/models/hands/handsForOculus/handL.json')
    viveController1.add(handL)
    viveController1.addEventListener('triggerdown', () => handL.grip())
    viveController1.addEventListener('triggerup', () => handL.release())
    updateObjects.push(handL)

    if (isNight) {
      // temp: add stuff to hands
      const torch = new Torch()
      // torch.position.y = 1.35
      torch.position.z = 0.04
      torch.position.y = -0.02
      torch.rotation.z = -Math.PI / 2
      torch.rotation.y = Math.PI / 4

      // scene.add(torch)

      handL.add(torch)
      updateObjects.push(torch)
      // test rotate hand
      handL.rotation.z = Math.PI / 4
    }
  }

  if (viveController2) {
    const handR = new Hand(objectLoader, '/assets/models/hands/handsForOculus/handR.json')
    viveController2.add(handR)
    viveController2.addEventListener('triggerdown', () => handR.grip())
    viveController2.addEventListener('triggerup', () => handR.release())
    updateObjects.push(handR)
  }


  // window.addEventListener('mousedown', () => torch.on())
  // window.addEventListener('mouseup', () => torch.off())
  // viveController1.addEventListener('triggerdown', () => torch.on())
  // viveController1.addEventListener('triggerup', () => torch.off())
}

function loop () {
  var delta = clock.getDelta()
  var elapsed = clock.getElapsedTime()

  if (viveController1) {
    viveController1.update()
  }
  if (viveController2) {
    viveController2.update()
  }

  // update user objects
  for (let object of updateObjects) {
    object.update(delta, elapsed)
  }

  // Render the scene through the vrManager.
  vrControls.update(delta)
  vrManager.render(scene, camera, delta)

  // call the loop function again
  vrDisplay.requestAnimationFrame(loop)
}

function loadViveControllerModels () {
  var loader = new THREE.OBJLoader()
  loader.setPath('assets/models/vive-controller/')
  loader.load('vr_controller_vive_1_5.obj', function (object) {
    console.log('loaded controller OBJ')
    var loader = new THREE.TextureLoader()
    loader.setPath('assets/models/vive-controller/')

    var controller = object.children[0]
    controller.material.map = loader.load('onepointfive_texture.png')
    controller.material.specularMap = loader.load('onepointfive_spec.png')

    viveController1.add(object.clone())
    viveController2.add(object.clone())
  })
}

function showControllerGuideRays () {
  // show ray for debug
  var geometry = new THREE.Geometry()
  geometry.vertices.push(new THREE.Vector3(0, 0, 0))
  geometry.vertices.push(new THREE.Vector3(0, 0, -1))

  var line = new THREE.Line(geometry)
  line.name = 'line'
  line.scale.z = 5

  viveController1.add(line.clone())
  viveController2.add(line.clone())
}

// VIVE CONTROLLER
function initViveControllers () {
  if (!navigator.getGamepads) {
    console.warn('GAMEPAD API not enabled?')
    return
  }

  viveController1 = new THREE.ViveController(0)
  viveController1.standingMatrix = vrControls.getStandingMatrix()
  scene.add(viveController1)

  viveController2 = new THREE.ViveController(1)
  viveController2.standingMatrix = vrControls.getStandingMatrix()
  scene.add(viveController2)

  // loadViveControllerModels()

  if (query.debug) {
    showControllerGuideRays()
  }
}

function initVR () {
  // Apply VR headset positional data to camera.
  vrControls = new THREE.VRControls(camera)
  vrControls.standing = true

  // Apply VR stereo rendering to renderer.
  vrEffect = new THREE.VREffect(renderer)
  vrEffect.setSize(window.innerWidth, window.innerHeight)

  // Create a VR vrManager helper to enter and exit VR mode.
  var params = {
    hideButton: false, // Default: false.
    isUndistorted: false // Default: false.
  }
  vrManager = new WebVRManager(renderer, vrEffect, params)

  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  setupStage()

  // init controllers
  initViveControllers()

  // Listen to the screen: if the user resizes it
  // we have to update the camera and the renderer size
  window.addEventListener('resize', handleWindowResize, false)
  window.addEventListener('vrdisplaypresentchange', handleWindowResize, true)
}

function init () {
  // set up the scene, the camera and the renderer
  createScene()

  initVR()

  // add the lights
  createLights()

  // create user objects
  ground = new Ground(scene, objectLoader, SNOW_HEIGHT)
  treeline = new Treeline(scene)

  createHands()

  // keep track of objects that need to update
  updateObjects.push(createSnowFall())
  updateObjects.push(new Moose(scene, jsonLoader))

  // debug puff
  // const puff = new Snowpuff(scene)
  // puff.system.position.set(0, 0, -2)
  // scene.add(puff.system)
  // updateObjects.push(puff)
}

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage () {
  navigator.getVRDisplays().then((displays) => {
    if (displays.length > 0) {
      vrDisplay = displays[0]
      if (vrDisplay.stageParameters) {
        setStageDimensions(vrDisplay.stageParameters)
      }
      // start a loop that will update the objects' positions
      // and render the scene on each frame
      vrDisplay.requestAnimationFrame(loop)
    }
  })
}

function setStageDimensions (stage) {
  // Size the skybox according to the size of the actual stage.
  // var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
}

window.addEventListener('load', init, false)
