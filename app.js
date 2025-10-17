// Change these values to experiment with different color schemes
const COLOR_CONFIG = {
  // Shape colors (HSV: Hue, Saturation, Value/Brightness)
  shapes: {
    box: { h: 0, s: 0.8, v: 0.8 },          // Red-ish
    sphere: { h: 120, s: 0.8, v: 0.8 },     // Green-ish
    cylinder: { h: 240, s: 0.8, v: 0.8 },   // Blue-ish
    torus: { h: 280, s: 0.8, v: 0.8 },      // Purple-ish
    octahedron: { h: 40, s: 0.8, v: 0.8 }   // Yellow-ish
  },

  // Mountain/terrain colors (RGB: 0-1 scale)
  mountain: {
    r: 0.2,
    g: 0.2,
    b: 0.2
  },

  // Counter text color (RGB string)
  counterText: "rgb(220, 220, 220)",

  // Floating shape random colors (HSV range)
  floatingShapes: {
    hueMin: 0,
    hueMax: 360,
    saturation: 0.7,
    brightnessMin: 0.6,
    brightnessMax: 0.9
  },

  // Star particles (grayscale brightness range: 0-1)
  stars: {
    brightnessMin: 0.4,
    brightnessMax: 1.0
  }
};

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Counter scene setup - 5 separate engines for 5 canvases
const counterEngines = [];
const counterScenes = [];
for (let i = 0; i < 5; i++) {
  const counterCanvas = document.getElementById("counterCanvas" + i);
  const counterEngine = new BABYLON.Engine(counterCanvas, true, { preserveDrawingBuffer: true, stencil: true });
  counterEngines.push(counterEngine);
}

// Shape click counter tracking
const shapeClickCounts = {
  box: 0,
  sphere: 0,
  cylinder: 0,
  torus: 0,
  octahedron: 0
};

const counterTextBlocks = {};

function updateShapeCounter(shapeType) {
  shapeClickCounts[shapeType]++;
  const textBlock = counterTextBlocks[shapeType];
  if (textBlock) {
    textBlock.text = shapeClickCounts[shapeType].toString();
    // Pulse animation
    textBlock.fontSize = 22;
    textBlock.color = "white";
    setTimeout(() => {
      textBlock.fontSize = 18;
      textBlock.color = COLOR_CONFIG.counterText;
    }, 150);
  }
}

// Create individual counter scene for each canvas
const createCounterScene = function (engineIndex, shapeType, color) {
  const scene = new BABYLON.Scene(counterEngines[engineIndex]);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent background

  // Camera
  const camera = new BABYLON.FreeCamera("counterCamera", new BABYLON.Vector3(0, 0, -2), scene);
  camera.setTarget(BABYLON.Vector3.Zero());

  // Light
  const light = new BABYLON.HemisphericLight("counterLight", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 1;

  // Create GUI
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("CounterUI" + engineIndex, true, scene);

  // Prevent the canvas from receiving keyboard focus
  const counterCanvas = document.getElementById("counterCanvas" + engineIndex);
  if (counterCanvas) {
    counterCanvas.setAttribute('tabindex', '-1');
  }

  const size = 0.5;
  let shape;

  // Create shape at origin
  switch (shapeType) {
    case 'box':
      shape = BABYLON.MeshBuilder.CreateBox("counterBox", { size: size * 0.8 }, scene);
      break;
    case 'sphere':
      shape = BABYLON.MeshBuilder.CreateSphere("counterSphere", { diameter: size, segments: 4 }, scene);
      break;
    case 'cylinder':
      shape = BABYLON.MeshBuilder.CreateCylinder("counterCylinder", { height: size, diameter: size * 0.6 }, scene);
      break;
    case 'torus':
      shape = BABYLON.MeshBuilder.CreateTorus("counterTorus", { diameter: size, thickness: size * 0.3, tessellation: 10 }, scene);
      break;
    case 'octahedron':
      shape = BABYLON.MeshBuilder.CreatePolyhedron("counterOctahedron", { type: 1, size: size * 0.5 }, scene);
      break;
  }

  // Responsive positioning based on viewport
  const isMobile = window.innerWidth <= 768;
  const shapeXPosition = isMobile ? -0.3 : -0.2;
  const textOffset = isMobile ? -2 : -2;
  shape.position = new BABYLON.Vector3(shapeXPosition, 0, 0);

  // Create wireframe material
  const material = new BABYLON.StandardMaterial("counterMat", scene);
  material.wireframe = true;
  material.emissiveColor = color;
  material.diffuseColor = color;
  shape.material = material;

  // Create text block
  const textBlock = new BABYLON.GUI.TextBlock();
  textBlock.text = "0";
  textBlock.color = COLOR_CONFIG.counterText;
  textBlock.outlineWidth = 1; // Thickness of border
  textBlock.outlineColor = "#" + color.toHexString().substring(1);
  textBlock.fontSize = isMobile ? 14 : 16; // Smaller font on mobile
  textBlock.fontFamily = "Libre Baskerville";
  textBlock.fontWeight = "700";
  textBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
  textBlock.leftInPixels = textOffset;
  textBlock.widthInPixels = 30;
  textBlock.heightInPixels = 30;
  textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  textBlock.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
  advancedTexture.addControl(textBlock);

  // Store references for resize updates
  shape.initialXPosition = shapeXPosition;

  // Update positioning on resize
  window.addEventListener("resize", function () {
    const isMobileNow = window.innerWidth <= 768;
    const newShapeX = isMobileNow ? -0.15 : -0.2;
    const newTextOffset = isMobileNow ? -2 : -2;
    const newFontSize = isMobileNow ? 14 : 16;

    shape.position.x = newShapeX;
    textBlock.leftInPixels = newTextOffset;
    textBlock.fontSize = newFontSize;
  });

  counterTextBlocks[shapeType] = textBlock;

  // Animate shape
  scene.registerBeforeRender(function () {
    shape.rotation.x += 0.005;
    shape.rotation.y += 0.01;
  });

  return scene;
};

// Initialize all 5 counter scenes
const shapeTypes = ['box', 'sphere', 'cylinder', 'torus', 'octahedron'];
const counterColors = shapeTypes.map(shapeType => {
  const config = COLOR_CONFIG.shapes[shapeType];
  return new BABYLON.Color3.FromHSV(config.h, config.s, config.v);
});

shapeTypes.forEach((shapeType, index) => {
  const scene = createCounterScene(index, shapeType, counterColors[index]);
  counterScenes.push(scene);
});

const createScene = function () {
  const scene = new BABYLON.Scene(engine);
  // Radial gradient background will be handled by CSS
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent to show CSS background

  // Camera: Fixed camera angled downward
  const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 5, -10), scene);
  camera.setTarget(new BABYLON.Vector3(0, 0, 20));
  // Disable user controls for fixed camera angle
  // camera.attachControl(canvas, true);

  // Light
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  // Mountain noise function (static) - More jagged and contrasting
  function mountainNoise(x, z) {
    let value = 0;
    let amplitude = 2.5;
    let frequency = 0.08;
    let octaves = 6;

    // Add multiple layers of noise with sharper peaks
    for (let o = 0; o < octaves; o++) {
      // Use abs for sharp ridges
      let noise = Math.abs(Math.sin(x * frequency + z * frequency * 0.7));
      noise = Math.pow(noise, 1.5); // Sharpen the peaks
      value += noise * amplitude;
      frequency *= 2.3;
      amplitude *= 0.4;
    }

    // Add some random sharp spikes
    const spike1 = Math.pow(Math.abs(Math.sin(x * 0.3) * Math.cos(z * 0.3)), 3) * 3;
    const spike2 = Math.pow(Math.abs(Math.sin(x * 0.15 + z * 0.15)), 4) * 2;

    // Create valleys by subtracting base level
    value = value + spike1 + spike2 - 4.5;

    // Add some noise variation
    value += (Math.random() * 0.3 - 0.15);

    return value;
  }

  // Plane tiling parameters
  const numTiles = 4;
  const tileLength = 50;
  const tileWidth = 90;
  const tileSubdiv = 20; // Low-poly effect
  const planes = [];

  // Material with wireframe - configurable color
  const material = new BABYLON.StandardMaterial("material", scene);
  material.wireframe = true;
  material.emissiveColor = new BABYLON.Color3(
    COLOR_CONFIG.mountain.r,
    COLOR_CONFIG.mountain.g,
    COLOR_CONFIG.mountain.b
  );
  material.diffuseColor = new BABYLON.Color3(
    COLOR_CONFIG.mountain.r,
    COLOR_CONFIG.mountain.g,
    COLOR_CONFIG.mountain.b
  );

  // Floating shapes system
  const floatingShapes = [];
  const shapeTypes = ['box', 'sphere', 'cylinder', 'torus', 'octahedron'];

  // Audio context for click sounds
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  function playPopSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Randomize the pitch slightly for variety
    const pitchVariation = 0.2 + Math.random() * 0.4; // 0.8x to 1.2x pitch
    const startFreq = 800 * pitchVariation;
    const endFreq = 200 * pitchVariation;

    // Create a "pop" sound with pitch sweep
    oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + 0.1);

    // Volume envelope for pop effect
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  function createFloatingShape() {
    const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const size = Math.random() * 3 + 1;
    let shape;

    switch (shapeType) {
      case 'box':
        shape = BABYLON.MeshBuilder.CreateBox("box", { size: size }, scene);
        break;
      case 'sphere':
        shape = BABYLON.MeshBuilder.CreateSphere("sphere", {
          diameter: size,
          segments: 4  // Low-poly sphere
        }, scene);
        break;
      case 'cylinder':
        shape = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: size, diameter: size * 0.6 }, scene);
        break;
      case 'torus':
        shape = BABYLON.MeshBuilder.CreateTorus("torus", {
          diameter: size,
          thickness: size * 0.3,
          tessellation: 10  // Low-poly torus
        }, scene);
        break;
      case 'octahedron':
        shape = BABYLON.MeshBuilder.CreatePolyhedron("octahedron", { type: 1, size: size * 0.6 }, scene);
        break;
    }

    // Position further ahead of camera, floating above terrain
    shape.position.x = (Math.random() - 0.5) * 40;
    shape.position.y = Math.random() * 10 + 5;
    shape.position.z = camera.position.z + Math.random() * 100 + 80;

    // Random rotation
    shape.rotation.x = Math.random() * Math.PI * 2;
    shape.rotation.y = Math.random() * Math.PI * 2;
    shape.rotation.z = Math.random() * Math.PI * 2;

    // Store rotation speed
    shape.rotationSpeed = {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02
    };

    // Store shape type for counter
    shape.shapeType = shapeType;

    // Create unique material with random color for each shape
    const shapeMaterial = new BABYLON.StandardMaterial("shapeMat" + Math.random(), scene);
    shapeMaterial.wireframe = true;

    // Generate random vibrant color using config
    const randomColor = BABYLON.Color3.FromHSV(
      COLOR_CONFIG.floatingShapes.hueMin + Math.random() * (COLOR_CONFIG.floatingShapes.hueMax - COLOR_CONFIG.floatingShapes.hueMin),
      COLOR_CONFIG.floatingShapes.saturation,
      COLOR_CONFIG.floatingShapes.brightnessMin + Math.random() * (COLOR_CONFIG.floatingShapes.brightnessMax - COLOR_CONFIG.floatingShapes.brightnessMin)
    );

    shapeMaterial.emissiveColor = randomColor;
    shapeMaterial.diffuseColor = randomColor;
    shape.material = shapeMaterial;

    // Fade in effect
    shape.visibility = 0;
    shape.fadeInSpeed = 0.02;
    shape.isFadingIn = true;

    // Shrink and disappear properties
    shape.isClicked = false;
    shape.hasBeenCounted = false; // Prevent double-click counting
    shape.shrinkSpeed = 0.05;
    shape.originalScaling = shape.scaling.clone();

    // Make shape clickable
    shape.actionManager = new BABYLON.ActionManager(scene);
    shape.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        function () {
          // Prevent double-clicking
          if (shape.hasBeenCounted) {
            return;
          }

          shape.isClicked = true;
          shape.hasBeenCounted = true; // Mark as counted
          shape.clickScale = 0; // Track time since click for pop effect

          // Update counter
          updateShapeCounter(shape.shapeType);

          // Play pop sound
          playPopSound();

          // Speed up rotation on click
          shape.rotationSpeed.x *= 3;
          shape.rotationSpeed.y *= 3;
          shape.rotationSpeed.z *= 3;

          // Create particle burst effect
          const particleSystem = new BABYLON.ParticleSystem("particles_" + Math.random(), 200, scene);

          // Load texture with proper alpha handling (local file)
          const texture = new BABYLON.Texture("lib/babylon/textures/flare.png", scene);
          particleSystem.particleTexture = texture;

          // Emitter at the shape position
          particleSystem.emitter = shape.position.clone();
          particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
          particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

          // Bright colors that will tint the texture
          const shapeColor = shapeMaterial.emissiveColor;
          particleSystem.color1 = new BABYLON.Color4(shapeColor.r * 2, shapeColor.g * 2, shapeColor.b * 2, 1);
          particleSystem.color2 = new BABYLON.Color4(shapeColor.r * 1.5, shapeColor.g * 1.5, shapeColor.b * 1.5, 1);
          particleSystem.colorDead = new BABYLON.Color4(shapeColor.r, shapeColor.g, shapeColor.b, 0); // Fade out

          // Particle settings
          particleSystem.minSize = 1.5;
          particleSystem.maxSize = 3.0;
          particleSystem.minLifeTime = 0.5;
          particleSystem.maxLifeTime = 1.0;
          particleSystem.emitRate = 1000;
          particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE; // Proper alpha blending
          particleSystem.gravity = new BABYLON.Vector3(0, -8, 0);
          particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
          particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
          particleSystem.minEmitPower = 12;
          particleSystem.maxEmitPower = 25;
          particleSystem.updateSpeed = 0.01;

          // Add angular velocity for spinning particles
          particleSystem.minAngularSpeed = -2;
          particleSystem.maxAngularSpeed = 2;

          particleSystem.start();

          // Stop emitting quickly for burst effect
          setTimeout(function () {
            particleSystem.stop();
          }, 50); // Very short burst

          // Auto-dispose particle system after particles die
          setTimeout(function () {
            particleSystem.dispose();
          }, 2000); // Longer time since particles live longer
        }
      )
    );

    floatingShapes.push(shape);
  }

  // Create initial shapes
  for (let i = 0; i < 8; i++) {
    createFloatingShape();
  }

  // Flowing particles system - accent the radial gradient
  const flowingParticles = [];

  function createFlowingParticle() {
    const particle = BABYLON.MeshBuilder.CreateSphere("particle", {
      diameter: 0.05, // Tiny size to match thin trails
      segments: 4
    }, scene);

    // Start from far distance (center of radial gradient)
    particle.position.x = (Math.random() - 0.5) * 60;
    particle.position.y = Math.random() * 15;
    particle.position.z = camera.position.z + Math.random() * 150 + 100;

    // Create material - grayscale using config
    const particleMaterial = new BABYLON.StandardMaterial("flowParticleMat" + Math.random(), scene);
    const brightness = COLOR_CONFIG.stars.brightnessMin +
                      Math.random() * (COLOR_CONFIG.stars.brightnessMax - COLOR_CONFIG.stars.brightnessMin);
    const particleColor = new BABYLON.Color3(brightness, brightness, brightness);
    particleMaterial.emissiveColor = particleColor;
    particleMaterial.diffuseColor = particleColor;
    particle.material = particleMaterial;

    // Store color for later trail creation
    particle.particleColor = particleColor;

    // Trail will be created after particle has moved (don't create yet)
    particle.trail = null;

    // Fade in
    particle.visibility = 0;
    particle.fadeInSpeed = 0.02;
    particle.isFadingIn = true;
    particle.maxVisibility = 0.6 + Math.random() * 0.4; // Vary opacity

    // Movement speed - consistent at 1.5x camera speed (camera moves at 0.2)
    particle.flowSpeed = 0.3;

    // Delay before creating trail (let particle move first)
    particle.frameCount = 0;
    particle.trailDelayFrames = 20; // Wait 20 frames before creating trail

    // Slight drift to sides
    particle.driftX = (Math.random() - 0.5) * 0.05;
    particle.driftY = (Math.random() - 0.5) * 0.02;

    flowingParticles.push(particle);
  }

  // Create initial flowing particles
  for (let i = 0; i < 25; i++) {
    createFlowingParticle();
  }

  // Create and noise each plane
  for (let t = 0; t < numTiles; t++) {
    const plane = BABYLON.MeshBuilder.CreateGround("ground" + t, {
      width: tileWidth,
      height: tileLength,
      subdivisions: tileSubdiv,
      updatable: true
    }, scene);
    plane.position.z = t * tileLength;
    plane.material = material;

    // Apply noise once
    let positions = plane.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] = mountainNoise(x, z + plane.position.z);
    }
    plane.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, plane.getIndices(), normals);
    plane.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

    // Set initial visibility (start visible for initial tiles)
    plane.visibility = 1;
    plane.isFadingIn = false;
    plane.fadeInSpeed = 0.015;

    planes.push(plane);
  }

  // Animate camera and recycle planes
  scene.registerBeforeRender(function () {
    camera.position.z += 0.2;
    camera.setTarget(new BABYLON.Vector3(0, 3, camera.position.z + 30));

    // Recycle planes behind camera
    for (let plane of planes) {
      // Fade in animation for planes
      if (plane.isFadingIn) {
        plane.visibility += plane.fadeInSpeed;
        if (plane.visibility >= 1) {
          plane.visibility = 1;
          plane.isFadingIn = false;
        }
      }

      if (plane.position.z + tileLength < camera.position.z - 10) {
        // Move plane ahead
        plane.position.z += numTiles * tileLength;
        // Re-noise for new Z
        let positions = plane.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const z = positions[i + 2];
          positions[i + 1] = mountainNoise(x, z + plane.position.z);
        }
        plane.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        const normals = [];
        BABYLON.VertexData.ComputeNormals(positions, plane.getIndices(), normals);
        plane.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

        // Start fade in for recycled plane
        plane.visibility = 0;
        plane.isFadingIn = true;
      }
    }

    // Animate and recycle floating shapes
    for (let i = floatingShapes.length - 1; i >= 0; i--) {
      const shape = floatingShapes[i];

      // Shrink and fade out when clicked
      if (shape.isClicked) {
        shape.clickScale = shape.clickScale || 0;

        // Brief scale-up "pop" effect for first few frames
        if (shape.clickScale < 5) {
          const popScale = 1 + (0.3 * Math.sin(shape.clickScale * Math.PI / 5));
          shape.scaling.x = shape.originalScaling.x * popScale;
          shape.scaling.y = shape.originalScaling.y * popScale;
          shape.scaling.z = shape.originalScaling.z * popScale;
          shape.clickScale++;
        } else {
          // Then shrink
          shape.scaling.x -= shape.shrinkSpeed;
          shape.scaling.y -= shape.shrinkSpeed;
          shape.scaling.z -= shape.shrinkSpeed;
          shape.visibility -= 0.03;
        }

        // Remove when too small or invisible
        if (shape.scaling.x <= 0 || shape.visibility <= 0) {
          shape.dispose();
          floatingShapes.splice(i, 1);
          continue;
        }
      }

      // Fade in animation
      if (shape.isFadingIn) {
        shape.visibility += shape.fadeInSpeed;
        if (shape.visibility >= 1) {
          shape.visibility = 1;
          shape.isFadingIn = false;
        }
      }

      // Rotate shapes
      shape.rotation.x += shape.rotationSpeed.x;
      shape.rotation.y += shape.rotationSpeed.y;
      shape.rotation.z += shape.rotationSpeed.z;

      // Remove shapes that are behind camera
      if (shape.position.z < camera.position.z - 20) {
        shape.dispose();
        floatingShapes.splice(i, 1);
      }
    }

    // Spawn new shapes occasionally
    if (Math.random() < 0.02) {
      createFloatingShape();
    }

    // Animate and recycle flowing particles
    for (let i = flowingParticles.length - 1; i >= 0; i--) {
      const particle = flowingParticles[i];

      // Fade in animation
      if (particle.isFadingIn) {
        particle.visibility += particle.fadeInSpeed;
        if (particle.visibility >= particle.maxVisibility) {
          particle.visibility = particle.maxVisibility;
          particle.isFadingIn = false;
        }
      }

      // Create trail after delay (so particle has moved and no long initial streak)
      particle.frameCount++;
      if (particle.frameCount === particle.trailDelayFrames && !particle.trail) {
        const trail = new BABYLON.TrailMesh("trail", particle, scene, 0.05, 30, true);
        const trailMaterial = new BABYLON.StandardMaterial("trailMat" + Math.random(), scene);
        trailMaterial.emissiveColor = particle.particleColor;
        trailMaterial.alpha = 0.3;
        trail.material = trailMaterial;
        particle.trail = trail;
      }

      // Move particle (relative to camera movement, appears to flow past)
      particle.position.z -= particle.flowSpeed;
      particle.position.x += particle.driftX;
      particle.position.y += particle.driftY;

      // Remove particles that passed the camera
      if (particle.position.z < camera.position.z - 30) {
        if (particle.trail) {
          particle.trail.dispose();
        }
        particle.dispose();
        flowingParticles.splice(i, 1);
      }
    }

    // Spawn new flowing particles occasionally
    if (Math.random() < 0.05) {
      createFlowingParticle();
    }
  });

  return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
  scene.render();
});

// Run render loop for each counter engine
counterEngines.forEach((counterEngine, index) => {
  counterEngine.runRenderLoop(function () {
    counterScenes[index].render();
  });
});

window.addEventListener("resize", function () {
  engine.resize();
  counterEngines.forEach(engine => engine.resize());
});
