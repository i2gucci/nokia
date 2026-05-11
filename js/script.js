// Import Three.js and addons as ES modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createPhoneController } from './phone/controller.js';
import {
  createButtonHotspots,
  createNumberKeyHotspots,
  createNavLocalMapper,
  createKeypadLocalMapper
} from './controls/phoneControls.js';
import { mapKeyboardEventToAction } from './controls/keyboardInput.js';
import { createPointerInputAdapter } from './controls/pointerInput.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = null;

// Camera
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0.62, 1.12, 4.18);

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.5;
controls.maxDistance = 5;
controls.target.set(0, 0.56, 0);
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

let phone;
let screenMesh;
let buttonHotspots = [];
let numberKeyHotspots = [];
let navLocalMapper = null;
let keypadLocalMapper = null;
let retroCanvas;
let retroCtx;
let retroTexture;
const lorePanelGroup = new THREE.Group();

const lorePanels = [
  {
    title: '不滅の存在 / INDESTRUCTIBLE',
    accent: '#ff2d35',
    body: 'Your $1200 GLASS SLAB cracks if you BREATHE on it wrong. 画面割れた？ You drop it once and the screen spiderwebs like your FRAGILE LIFE CHOICES. The 3310? DROP IT FROM A BUILDING-still works. 使えるんだよ！ Use it as a HAMMER and the NAIL survives, the PHONE survives, reality bends around it because IT DOESN\'T BREAK. Modern phones are PATHETIC. 本当に情けない。'
  },
  {
    title: 'バッテリー寿命 / BATTERY LIFE',
    accent: '#2de6ff',
    body: 'Oh you need to charge your phone THREE TIMES A DAY? 可哀想ね！ Your battery dies after 2 years? PLANNED OBSOLESCENCE garbage 廃棄物 designed to extract money from your WALLET. The 3310? Charge it ONCE in the year 2000-STILL RUNNING IN 2026. 二十六年間！ Scientists believe it may OUTLIVE THE SUN. NASA wanted to use it for Mars rovers because NOTHING ELSE LASTS. お前らの携帯は TRASH.'
  },
  {
    title: '軍事グレード / MILITARY GRADE',
    accent: '#2de6ff',
    body: 'Modern phones FOLD IN HALF like a JOKE. 冗談だろう？ They EXPLODE on airplanes. 爆発する！ The 3310 was BANNED in 37 countries as a POTENTIAL WEAPON. 武器として！ Can survive NUCLEAR BLAST. Only phone approved for ZOMBIE APOCALYPSE survival kits because everything else is WORTHLESS PLASTIC. Your phone is a TOY. これは兵器だ。 This is a WEAPON.'
  },
  {
    title: '重量感 / WEIGHT & PRESENCE',
    accent: '#ff2d35',
    body: 'Your phone weighs NOTHING because it IS nothing. 何もない。 Thin pathetic WAFER that SNAPS in your pocket. The 3310? 133 grams of PURE DOMINANCE. 支配だ！ You FEEL it in your hand. It\'s not a phone-it\'s a STATEMENT. A BRICK. 煉瓦だ！ An HEIRLOOM. Pass it down to your grandchildren (STILL CHARGED btw). 現代の携帯は GARBAGE with no SOUL.'
  },
  {
    title: '着信音 / RINGTONES',
    accent: '#2de6ff',
    body: 'Your phone makes 47 ANNOYING NOTIFICATION SOUNDS every 3 seconds. ピンポンピンポン！ DINGS and BUZZES and VIBRATIONS driving you INSANE. 狂ってる！ The Nokia Tune? MONOPHONIC. ICONIC. 象徴的だ。 You can HEAR this text RIGHT NOW can\'t you? お前の頭の中で鳴ってるだろう？ It echoes in the COLLECTIVE UNCONSCIOUS of humanity. That\'s REAL sound design. Everything else is NOISE. 雑音だけ。'
  }
];

const loader = new GLTFLoader();
const boxHelper = new THREE.Box3();

// Audio elements
let ringtoneAudio;
let numbersAudio;
let hasPlayedRingtone = false;

const phoneController = createPhoneController();

// Raycaster input dependencies
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const pointerInput = createPointerInputAdapter({
  camera,
  raycaster,
  mouse,
  getPhone: () => phone,
  getScreenMesh: () => screenMesh,
  getButtonHotspots: () => buttonHotspots,
  getNumberKeyHotspots: () => numberKeyHotspots,
  getNavLocalMapper: () => navLocalMapper,
  getKeypadLocalMapper: () => keypadLocalMapper
});

function setupRetroDisplayTexture() {
  retroCanvas = document.createElement('canvas');
  retroCanvas.width = 320;
  retroCanvas.height = 220;
  retroCtx = retroCanvas.getContext('2d');

  retroTexture = new THREE.CanvasTexture(retroCanvas);
  retroTexture.minFilter = THREE.NearestFilter;
  retroTexture.magFilter = THREE.NearestFilter;
  retroTexture.generateMipmaps = false;
  retroTexture.flipY = false;
  retroTexture.colorSpace = THREE.SRGBColorSpace;
}

function fitTextureToMeshUVRect(texture, mesh) {
  if (!mesh || !mesh.geometry || !mesh.geometry.getAttribute('uv') || !texture) {
    return;
  }

  const uvAttr = mesh.geometry.getAttribute('uv');
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (let i = 0; i < uvAttr.count; i += 1) {
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  const rangeU = Math.max(maxU - minU, 0.000001);
  const rangeV = Math.max(maxV - minV, 0.000001);

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / rangeU, -1 / rangeV);
  texture.offset.set(-minU / rangeU, maxV / rangeV);
  texture.needsUpdate = true;
}

function drawRetroScreen() {
  if (!retroCtx) {
    return;
  }

  const appState = phoneController.getState();
  const menuItems = phoneController.getMenuItems();

  const w = retroCanvas.width;
  const h = retroCanvas.height;
  const contentTop = 56;
  const contentBottom = h - 26;

  retroCtx.fillStyle = '#9bbc0f';
  retroCtx.fillRect(0, 0, w, h);

  retroCtx.fillStyle = 'rgba(35, 70, 20, 0.12)';
  for (let y = 0; y < h; y += 4) {
    retroCtx.fillRect(0, y, w, 1);
  }

  retroCtx.strokeStyle = '#1f3f12';
  retroCtx.lineWidth = 4;
  retroCtx.strokeRect(4, 4, w - 8, h - 8);

  retroCtx.fillStyle = '#1b3710';
  retroCtx.font = 'bold 21px monospace';
  retroCtx.fillText('NOKIA', 14, 30);

  for (let i = 0; i < 4; i += 1) {
    retroCtx.fillStyle = '#1b3710';
    retroCtx.fillRect(w - 60 + i * 10, 18 + (3 - i) * 4, 8, 16 - (3 - i) * 4);
  }

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const clockText = `${hh}:${mm}`;
  retroCtx.font = '16px monospace';
  const signalStartX = w - 60;
  const clockWidth = retroCtx.measureText(clockText).width;
  const clockX = signalStartX - 8 - clockWidth;
  retroCtx.fillText(clockText, clockX, 34);

  retroCtx.fillRect(10, contentTop - 14, w - 20, 2);

  let softLeft = 'Menu';
  let softRight = 'Back';

  retroCtx.font = 'bold 18px monospace';

  if (appState.view === 'home') {
    softLeft = 'Menu';
    softRight = '';
    retroCtx.fillText('Ready', 16, 92);
    retroCtx.fillText(`Inbox: ${appState.inbox.length}`, 16, 122);
    retroCtx.fillText('Press Select', 16, 152);
  }

  if (appState.view === 'menu') {
    softLeft = 'Open';
    softRight = 'Back';
    retroCtx.fillText('Main Menu', 16, 80);
    retroCtx.font = '17px monospace';
    for (let i = 0; i < menuItems.length; i += 1) {
      const y = 106 + i * 20;
      if (i === appState.menuIndex) {
        retroCtx.fillStyle = '#1b3710';
        retroCtx.fillRect(14, y - 14, w - 28, 18);
        retroCtx.fillStyle = '#9bbc0f';
        retroCtx.fillText(`> ${menuItems[i]}`, 18, y);
        retroCtx.fillStyle = '#1b3710';
      } else {
        retroCtx.fillText(`  ${menuItems[i]}`, 18, y);
      }
    }
  }

  if (appState.view === 'messages') {
    softLeft = 'Open';
    softRight = 'Back';
    retroCtx.fillText('Messages', 16, 80);
    retroCtx.font = '16px monospace';
    for (let i = 0; i < appState.inbox.length; i += 1) {
      const y = 108 + i * 20;
      const line = `${i + 1}. ${appState.inbox[i].from}`;
      if (i === appState.listIndex) {
        retroCtx.fillRect(14, y - 14, w - 28, 18);
        retroCtx.fillStyle = '#9bbc0f';
        retroCtx.fillText(line, 18, y);
        retroCtx.fillStyle = '#1b3710';
      } else {
        retroCtx.fillText(line, 18, y);
      }
    }
  }

  if (appState.view === 'contacts') {
    softLeft = 'Call';
    softRight = 'Back';
    retroCtx.fillText('Contacts', 16, 80);
    retroCtx.font = '16px monospace';
    const start = Math.max(0, appState.listIndex - 2);
    const end = Math.min(appState.contacts.length, start + 5);
    for (let i = start; i < end; i += 1) {
      const y = 108 + (i - start) * 20;
      const line = `${i + 1}. ${appState.contacts[i]}`;
      if (i === appState.listIndex) {
        retroCtx.fillRect(14, y - 14, w - 28, 18);
        retroCtx.fillStyle = '#9bbc0f';
        retroCtx.fillText(line, 18, y);
        retroCtx.fillStyle = '#1b3710';
      } else {
        retroCtx.fillText(line, 18, y);
      }
    }
  }

  if (appState.view === 'compose') {
    softLeft = 'Send';
    softRight = 'Clr';
    retroCtx.fillText('Compose', 16, 80);
    retroCtx.font = '16px monospace';
    retroCtx.fillText('Type: 0-9 keys', 16, 106);
    retroCtx.fillText('Text:', 16, 130);
    retroCtx.fillRect(14, 138, w - 28, 38);
    retroCtx.fillStyle = '#9bbc0f';
    const message = appState.draftText || '_';
    retroCtx.fillText(message.slice(-22), 20, 162);
    retroCtx.fillStyle = '#1b3710';
  }

  if (appState.view === 'detail') {
    softLeft = '';
    softRight = 'Back';
    retroCtx.fillText('Message', 16, 80);
    retroCtx.font = '16px monospace';
    const lines = appState.detailText.match(/.{1,26}/g) || [''];
    for (let i = 0; i < Math.min(lines.length, 5); i += 1) {
      retroCtx.fillText(lines[i], 16, 108 + i * 20);
    }
  }

  if (appState.view === 'snake') {
    softLeft = 'Play';
    softRight = 'Back';
    retroCtx.fillText('Snake', 16, 80);
    retroCtx.font = '16px monospace';
    retroCtx.fillText('Classic mode demo', 16, 108);
    retroCtx.fillText('High Score: 042', 16, 130);
    retroCtx.fillText('Press Select', 16, 152);
  }

  if (appState.view === 'settings') {
    softLeft = 'Save';
    softRight = 'Back';
    retroCtx.fillText('Settings', 16, 80);
    retroCtx.font = '16px monospace';
    retroCtx.fillText('Ringtone: Retro', 16, 108);
    retroCtx.fillText('Theme: LCD Green', 16, 130);
    retroCtx.fillText('Vibration: On', 16, 152);
  }

  retroCtx.fillRect(10, contentBottom - 2, w - 20, 2);
  retroCtx.font = '16px monospace';
  retroCtx.fillText(softLeft, 16, h - 10);
  const rightTextWidth = retroCtx.measureText(softRight).width;
  retroCtx.fillText(softRight, w - rightTextWidth - 16, h - 10);

  retroTexture.needsUpdate = true;
}

function wrapPanelText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const lines = getWrappedLines(ctx, text, maxWidth);
  const drawCount = Math.min(lines.length, maxLines);

  for (let i = 0; i < drawCount; i += 1) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }

  return drawCount;
}

function getWrappedLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (let i = 0; i < words.length; i += 1) {
    const candidate = current ? `${current} ${words[i]}` : words[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = words[i];
    } else {
      lines.push(words[i]);
      current = '';
    }

  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function createLorePanelTexture(panel) {
  const scratchCanvas = document.createElement('canvas');
  const scratchCtx = scratchCanvas.getContext('2d');
  const width = 1024;
  const sidePadding = 86;
  const textWidth = width - 160;

  scratchCtx.font = '700 34px "Press Start 2P", monospace';
  const titleLines = getWrappedLines(scratchCtx, panel.title, textWidth);
  scratchCtx.font = '32px "VT323", monospace';
  const bodyLines = getWrappedLines(scratchCtx, panel.body, textWidth);

  const titleLineHeight = 42;
  const bodyLineHeight = 36;
  const topPadding = 40;
  const titleBlockHeight = Math.max(1, titleLines.length) * titleLineHeight;
  const dividerY = topPadding + titleBlockHeight + 20;
  const bodyStartY = dividerY + 54;
  const bodyBlockHeight = Math.max(1, bodyLines.length) * bodyLineHeight;
  const bottomPadding = 46;
  const computedHeight = bodyStartY + bodyBlockHeight + bottomPadding;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.max(480, computedHeight);
  const ctx = canvas.getContext('2d');

  const bgGradient = ctx.createLinearGradient(0, 0, width, canvas.height);
  bgGradient.addColorStop(0, 'rgba(8, 23, 61, 0.96)');
  bgGradient.addColorStop(1, 'rgba(2, 9, 26, 0.98)');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#dce9ff';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

  ctx.strokeStyle = '#3b5a92';
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = panel.accent;
  ctx.fillRect(26, 26, 24, canvas.height - 52);

  ctx.fillStyle = '#ffe470';
  ctx.font = '700 34px "Press Start 2P", monospace';
  wrapPanelText(ctx, panel.title, sidePadding, 96, textWidth, titleLineHeight, 2);

  ctx.strokeStyle = 'rgba(195, 216, 255, 0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sidePadding, dividerY);
  ctx.lineTo(canvas.width - 74, dividerY);
  ctx.stroke();

  ctx.fillStyle = '#edf6ff';
  ctx.font = '32px "VT323", monospace';
  wrapPanelText(ctx, panel.body, sidePadding, bodyStartY, textWidth, bodyLineHeight, 18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function createLorePanels3D() {
  const panelWidth = 1.48;
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x132a59,
    metalness: 0.25,
    roughness: 0.55
  });

  const panelPositions = [
    new THREE.Vector3(-2.18, 0.9, -0.84),
    new THREE.Vector3(-2.16, -0.28, -0.84),
    new THREE.Vector3(2.18, 1.16, -0.84),
    new THREE.Vector3(2.2, 0.02, -0.84),
    new THREE.Vector3(2.18, -1.1, -0.84)
  ];

  lorePanelGroup.clear();

  for (let i = 0; i < lorePanels.length; i += 1) {
    const panel = lorePanels[i];
    const texture = createLorePanelTexture(panel);
    const texAspect = texture.image.height / texture.image.width;
    const panelHeight = panelWidth * texAspect;
    const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
    const frameGeometry = new THREE.BoxGeometry(panelWidth + 0.06, panelHeight + 0.06, 0.04);
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: false,
      toneMapped: false,
      side: THREE.DoubleSide
    });

    const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh.position.copy(panelPositions[i]);
    panelMesh.rotation.y = panelPositions[i].x < 0 ? 0.2 : -0.2;
    panelMesh.rotation.z = panelPositions[i].x < 0 ? -0.045 : 0.045;
    panelMesh.receiveShadow = true;

    const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    frameMesh.position.copy(panelMesh.position);
    frameMesh.position.z -= 0.03;
    frameMesh.rotation.copy(panelMesh.rotation);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;

    lorePanelGroup.add(frameMesh);
    lorePanelGroup.add(panelMesh);
  }

  scene.add(lorePanelGroup);
}

function bindDisplayToModel(model) {
  screenMesh = model.getObjectByName('Cube_screen_0');

  if (!screenMesh) {
    model.traverse((obj) => {
      if (!screenMesh && obj.isMesh && obj.material && obj.material.name === 'screen') {
        screenMesh = obj;
      }
    });
  }

  if (!screenMesh) {
    console.warn('No screen mesh found in model; display will not be visible.');
    return;
  }

  screenMesh.material = new THREE.MeshBasicMaterial({
    map: retroTexture,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  screenMesh.material.depthWrite = false;
  screenMesh.renderOrder = 10;

  fitTextureToMeshUVRect(retroTexture, screenMesh);
}

function loadPhoneModel() {
  loader.load(
    '../assets/old_nokia_phone_low_poly.glb',
    (gltf) => {
      phone = gltf.scene;

      phone.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      boxHelper.setFromObject(phone);
      const size = boxHelper.getSize(new THREE.Vector3());
      const targetHeight = 1.9;
      const scale = targetHeight / Math.max(size.y, 0.0001);
      phone.scale.setScalar(scale);

      boxHelper.setFromObject(phone);
      const centered = boxHelper.getCenter(new THREE.Vector3());
      phone.position.sub(centered);
      phone.position.y += 0.35;

      scene.add(phone);
      createLorePanels3D();

      setupRetroDisplayTexture();
      drawRetroScreen(0);
      bindDisplayToModel(phone);
      buttonHotspots = createButtonHotspots(phone);
      numberKeyHotspots = createNumberKeyHotspots(phone);
      navLocalMapper = createNavLocalMapper(phone);
      keypadLocalMapper = createKeypadLocalMapper(phone);

      document.getElementById('loading').classList.add('hidden');

      if (!hasPlayedRingtone) {
        playRingtone();
      }
    },
    (progress) => {
      if (!progress.total) {
        return;
      }
      const percent = Math.round((progress.loaded / progress.total) * 100);
      const loadingText = document.querySelector('#loading p');
      loadingText.textContent = `Loading 3D Model... ${percent}%`;
    },
    (error) => {
      console.error('Error loading model:', error);
      const loadingText = document.querySelector('#loading p');
      loadingText.textContent = 'Failed to load model';
    }
  );
}

function initAudio() {
  ringtoneAudio = document.getElementById('ringtone');
  numbersAudio = document.getElementById('numbersSound');
}

function playRingtone() {
  if (!ringtoneAudio || hasPlayedRingtone) {
    return;
  }

  ringtoneAudio.volume = 0.6;
  ringtoneAudio.play().then(() => {
    hasPlayedRingtone = true;
  }).catch((err) => {
    console.log('Ringtone autoplay blocked:', err);
    document.addEventListener(
      'click',
      () => {
        if (!hasPlayedRingtone) {
          ringtoneAudio.play().then(() => {
            hasPlayedRingtone = true;
          }).catch(() => {});
        }
      },
      { once: true }
    );
  });
}

function playNumberSound() {
  if (!numbersAudio) {
    return;
  }

  numbersAudio.currentTime = 0;
  numbersAudio.volume = 0.7;
  numbersAudio.play().catch((err) => console.log('Number sound play error:', err));
}

function dispatchPhoneAction(actionEvent) {
  if (!actionEvent) {
    return;
  }

  if (actionEvent.isNumber) {
    playNumberSound();
  }

  phoneController.dispatch(actionEvent.action, actionEvent.value || '');
}

function onMouseClick(event) {
  dispatchPhoneAction(pointerInput.resolveActionFromClick(event));
}

renderer.domElement.addEventListener('click', onMouseClick);

window.addEventListener('keydown', (event) => {
  const actionEvent = mapKeyboardEventToAction(event);
  if (!actionEvent) {
    return;
  }

  event.preventDefault();
  dispatchPhoneAction(actionEvent);
});

// Button controls
document.getElementById('btn-screen').addEventListener('click', () => {
  dispatchPhoneAction({ action: 'select', source: 'ui' });
});

let autoRotating = false;
document.getElementById('btn-rotate').addEventListener('click', () => {
  autoRotating = !autoRotating;
  controls.autoRotate = autoRotating;
  document.getElementById('btn-rotate').textContent = autoRotating
    ? 'Stop Rotation'
    : 'Auto Rotate';
});

document.getElementById('btn-reset').addEventListener('click', () => {
  gsap.to(camera.position, {
    x: 0.62,
    y: 1.12,
    z: 4.18,
    duration: 1,
    ease: 'power2.inOut'
  });
  gsap.to(controls.target, {
    x: 0,
    y: 0.56,
    z: 0,
    duration: 1,
    ease: 'power2.inOut'
  });
  phoneController.resetToHome();
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  drawRetroScreen();
  controls.update();
  renderer.render(scene, camera);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAudio);
} else {
  initAudio();
}

loadPhoneModel();
animate();
