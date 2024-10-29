import * as glMatrix from "gl-matrix"

type OrbitDirection = "left" | "right"

interface AnimationState {
  currentRotation: number
  targetRotation: number
  isTransitioning: boolean
  transitionStartTime: number
  transitionDuration: number
  totalRotation: number
  lastTargetRotation: number
}

let state: AnimationState = {
  currentRotation: Math.PI / 4,
  targetRotation: Math.PI / 4,
  isTransitioning: false,
  transitionStartTime: 0,
  transitionDuration: 1000,
  totalRotation: Math.PI / 4,
  lastTargetRotation: Math.PI / 4
}

function startRotationTransition(angle: number) {
  if (state.isTransitioning) {
    state.totalRotation += angle
    state.targetRotation = state.totalRotation
    state.transitionStartTime = performance.now()
    return
  }

  state.isTransitioning = true
  state.transitionStartTime = performance.now()
  state.totalRotation = state.currentRotation + angle
  state.targetRotation = state.totalRotation
}

function updateRotation(now: number) {
  if (!state.isTransitioning) return state.currentRotation

  const elapsed = now - state.transitionStartTime
  const progress = Math.min(elapsed / state.transitionDuration, 1)

  const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2

  const newRotation = state.currentRotation + (state.targetRotation - state.currentRotation) * eased

  if (progress >= 1) {
    state.isTransitioning = false
    state.currentRotation = state.targetRotation
    state.lastTargetRotation = state.targetRotation
  }

  return newRotation
}

let canvas: HTMLCanvasElement | null
let mouseX = 0
let mouseY = 0
let targetMouseX = 0
let targetMouseY = 0
let displayWidth = 1000
let displayHeight = 1000
const RETINA_ENABLED = true
const WIDTH = 80 // Must be even
const endRotationY = Math.PI / 4 // Ending rotation angle
const endRotationX = Math.PI / 4 // Ending rotation angle

const W2 = WIDTH / 2

// Perlin noise implementation
class PerlinNoise {
  private readonly permutation: number[]
  private readonly p: number[]

  constructor() {
    this.permutation = new Array(512)
    this.p = new Array(256).fill(0).map((_, i) => i)
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.p[i], this.p[j]] = [this.p[j], this.p[i]]
    }
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = this.p[i & 255]
    }
  }

  fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }

  grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  noise(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const Z = Math.floor(z) & 255

    x -= Math.floor(x)
    y -= Math.floor(y)
    z -= Math.floor(z)

    const u = this.fade(x)
    const v = this.fade(y)
    const w = this.fade(z)

    const A = this.permutation[X] + Y
    const AA = this.permutation[A] + Z
    const AB = this.permutation[A + 1] + Z
    const B = this.permutation[X + 1] + Y
    const BA = this.permutation[B] + Z
    const BB = this.permutation[B + 1] + Z

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.permutation[AA], x, y, z),
          this.grad(this.permutation[BA], x - 1, y, z)
        ),
        this.lerp(
          u,
          this.grad(this.permutation[AB], x, y - 1, z),
          this.grad(this.permutation[BB], x - 1, y - 1, z)
        )
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.permutation[AA + 1], x, y, z - 1),
          this.grad(this.permutation[BA + 1], x - 1, y, z - 1)
        ),
        this.lerp(
          u,
          this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
          this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    )
  }
}

function initWebGL() {
  canvas = document.getElementById("waveCanvas") as HTMLCanvasElement | null
  if (!canvas) {
    console.error("Canvas element not found")
    return
  }

  const gl: WebGLRenderingContext | null = canvas.getContext("webgl")
  if (!gl) {
    console.error("WebGL not supported")
    return
  }

  // Vertex shader
  const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec4 aVertexColor;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform float uYOffset;
      varying lowp vec4 vColor;
      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        float fadeAmount = smoothstep(-0.5, 0.5, uYOffset);
        vColor = vec4(mix(vec3(0.0, 0.05, 0.05), aVertexColor.rgb, fadeAmount), aVertexColor.a);
      }
    `

  // Fragment shader
  const fsSource = `
      precision mediump float;
      varying lowp vec4 vColor;
      void main(void) {
        gl_FragColor = vColor;
      }
    `

  // Initialize shaders
  function initShaderProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
  ): WebGLProgram | null {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

    if (!(vertexShader && fragmentShader)) {
      return null
    }

    const shaderProgram = gl.createProgram()
    if (!shaderProgram) {
      console.error("Unable to create shader program")
      return null
    }

    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error(
        `Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`
      )
      return null
    }

    return shaderProgram
  }

  function loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)
    if (shader === null) {
      console.error("Failed to create shader")
      return null
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
  if (!shaderProgram) {
    console.error("Failed to initialize shader program")
    return
  }

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      yOffset: gl.getUniformLocation(shaderProgram, "uYOffset")
    }
  }

  // Create cube geometry
  function initBuffers(gl: WebGLRenderingContext): {
    position: WebGLBuffer
    color: WebGLBuffer
    indices: WebGLBuffer
  } | null {
    const positionBuffer = gl.createBuffer()
    if (!positionBuffer) {
      console.error("Failed to create position buffer")
      return null
    }

    const colorBuffer = gl.createBuffer()
    if (!colorBuffer) {
      console.error("Failed to create color buffer")
      return null
    }

    const indexBuffer = gl.createBuffer()
    if (!indexBuffer) {
      console.error("Failed to create index buffer")
      return null
    }

    const positions = [
      // Front face
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
      // Back face
      -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,
      // Top face
      -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
      // Bottom face
      -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
      // Right face
      0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
      // Left face
      -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5
    ]

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    const CYAN = [0.71, 0.94, 0.99, 1.0]
    const MID_CYAN = [0.51, 0.94, 0.99, 1.0]
    const DARK_CYAN = [0.37, 0.87, 0.99, 1.0]
    const faceColors = [
      CYAN, // Front face
      CYAN, // Back face
      DARK_CYAN, // Top face
      DARK_CYAN, // Bottom face
      MID_CYAN, // Right face
      MID_CYAN // Left face
    ]

    // biome-ignore lint/suspicious/noEvolvingTypes: idc
    let colors: number[] = []

    for (let j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j]
      colors = colors.concat(c, c, c, c)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    const indices = [
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // back
      8,
      9,
      10,
      8,
      10,
      11, // top
      12,
      13,
      14,
      12,
      14,
      15, // bottom
      16,
      17,
      18,
      16,
      18,
      19, // right
      20,
      21,
      22,
      20,
      22,
      23 // left
    ]

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

    return {
      position: positionBuffer,
      color: colorBuffer,
      indices: indexBuffer
    }
  }

  const buffers = initBuffers(gl)

  const perlin = new PerlinNoise()

  // New function to calculate wave offset
  function calculateWaveOffset(x: number, z: number, time: number): number {
    const scale = 0.1
    const speed = 0.5
    const amplitude = 1.0

    const noiseValue = perlin.noise(x * scale, z * scale, time * speed)
    return noiseValue * amplitude
  }

  function drawScene(
    gl: WebGLRenderingContext,
    programInfo: {
      program: WebGLProgram
      attribLocations: {
        vertexPosition: number
        vertexColor: number
      }
      uniformLocations: {
        projectionMatrix: WebGLUniformLocation
        modelViewMatrix: WebGLUniformLocation
        yOffset: WebGLUniformLocation
      }
    },
    buffers: {
      position: WebGLBuffer
      color: WebGLBuffer
      indices: WebGLBuffer
    },
    cubePositions: Array<glMatrix.vec3>,
    totalTime: number
  ): void {
    gl.viewport(0, 0, displayWidth, displayHeight)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Adjusted field of view for better perspective
    const fieldOfView = (45 * Math.PI) / 180
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = glMatrix.mat4.create()

    glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    const modelViewMatrix = glMatrix.mat4.create()

    // Smooth out mouse movement
    mouseX += (targetMouseX - mouseX) * 0.1
    mouseY += (targetMouseY - mouseY) * 0.1

    glMatrix.mat4.lookAt(modelViewMatrix, [0, 12, 12], [0, -2, 0], [0, 1, 0])

    // Apply rotations
    const currentRotation = updateRotation(totalTime * 1000)
    glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, currentRotation, [0, 1, 0])

    // Reduced mouse movement sensitivity
    glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, mouseY * 0.05, [1, 0, 0])
    glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, mouseX * 0.05, [0, 1, 0])

    // Set up attribute buffers
    {
      const numComponents = 3
      const type = gl.FLOAT
      const normalize = false
      const stride = 0
      const offset = 0
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset
      )
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
    }

    {
      const numComponents = 4
      const type = gl.FLOAT
      const normalize = false
      const stride = 0
      const offset = 0
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset
      )
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    gl.useProgram(programInfo.program)

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)

    // Draw cubes
    for (let i = 0; i < cubePositions.length; i++) {
      const cubeMatrix = glMatrix.mat4.create()
      const [x, _, z] = cubePositions[i]
      glMatrix.mat4.translate(cubeMatrix, modelViewMatrix, cubePositions[i])

      // Apply wave motion with new calculation
      const waveOffset = calculateWaveOffset(x, z, totalTime)
      glMatrix.mat4.translate(cubeMatrix, cubeMatrix, [0, waveOffset * 1.2, 0])

      // Set y-offset uniform for fading
      gl.uniform1f(programInfo.uniformLocations.yOffset, waveOffset)

      // Scale down the cubes
      glMatrix.mat4.scale(cubeMatrix, cubeMatrix, [0.4, 0.4, 0.4])

      gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, cubeMatrix)

      {
        const vertexCount = 36
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
      }
    }
  }

  function onResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      let width: number
      let height: number
      let dpr = window.devicePixelRatio
      let dprSupport = false

      if (entry.devicePixelContentBoxSize?.[0]) {
        // NOTE: Only this path gives the correct answer
        // The other paths are an imperfect fallback
        // for browsers that don't provide anyway to do this
        width = entry.devicePixelContentBoxSize[0].inlineSize
        height = entry.devicePixelContentBoxSize[0].blockSize
        dpr = 1 // it's already in width and height
        dprSupport = true
      } else if (entry.contentBoxSize) {
        // Handle array or single object for contentBoxSize
        const contentBoxSize = Array.isArray(entry.contentBoxSize)
          ? entry.contentBoxSize[0]
          : entry.contentBoxSize
        width = contentBoxSize.inlineSize
        height = contentBoxSize.blockSize
      } else {
        // legacy
        width = entry.contentRect.width
        height = entry.contentRect.height
      }

      if (!RETINA_ENABLED) {
        dpr = 0.71
      }

      // ensure we have valid numbers
      if (typeof width !== "number" || typeof height !== "number") {
        console.error("Invalid dimensions received")
        return
      }

      // update global state reflecting ideal canvas size
      displayWidth = Math.round(width * dpr)
      displayHeight = Math.round(height * dpr)
    }
  }

  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(canvas, { box: "content-box" })

  // Initialize cube positions
  const cubePositions: Array<glMatrix.vec3> = []

  // Manhattan distance based rotation from square to diamond
  for (let x = -W2; x <= W2; x++) {
    for (let z = -W2; z <= W2; z++) {
      if (Math.abs(x) + Math.abs(z) <= W2) {
        cubePositions.push([x * 1.2 + 0.6, 0, z * 1.2 + 0.6])
      }
    }
  }
  // const cubePositions = []
  // for (let x = -28; x < 10; x++) {
  //   for (let z = -28; z < 10; z++) {
  //     cubePositions.push([x * 1.2 + 0.6, 0, z * 1.2 + 0.6])
  //   }
  // }

  // Animation loop
  let then = 0

  function render(now: DOMHighResTimeStamp): void {
    if (!canvas) return
    now *= 0.001 // convert to seconds
    const deltaTime = now - then
    then = now

    canvas.width = displayWidth
    canvas.height = displayHeight
    // gl.canvas.clientWidth = displayWidth;
    // gl.canvas.clientHeight = displayHeight;

    drawScene(gl, programInfo, buffers, cubePositions, now)

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)

  // Update mouse position
  function updateMousePosition(event: MouseEvent): void {
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const width = canvas.width || displayWidth // Fallback to displayWidth
    const height = canvas.height || displayHeight // Fallback to displayHeight

    if (width === 0 || height === 0) return // Prevent division by zero

    targetMouseX = ((event.clientX - rect.left) / width) * 4 - 1
    targetMouseY = -(((event.clientY - rect.top) / height) * 4) + 1
  }

  document.addEventListener("mousemove", updateMousePosition)

  // Cleanup function
  return () => {
    canvas.removeEventListener("mousemove", updateMousePosition)
  }
}

export function rotateCamera(direction: OrbitDirection) {
  const angle = direction === "right" ? Math.PI / 2 : -Math.PI / 2
  startRotationTransition(angle)
}

// Initialize WebGL when the component mounts
document.addEventListener("DOMContentLoaded", initWebGL)
