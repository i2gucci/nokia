import * as THREE from 'three';

const keypadConfig = {
  startX: 0.29,
  startY: 0.33,
  spacingX: 0.22,
  spacingY: 0.105,
  radius: 0.055,
  depth: 0.03,
  scaleX: 1.35,
  scaleY: 0.8
};

const keypadLayout = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#']
];

const navButtonCenters = [
  { action: 'back', x: 0.34, y: 0.39 },
  { action: 'select', x: 0.51, y: 0.43 },
  { action: 'up', x: 0.73, y: 0.46 },
  { action: 'down', x: 0.58, y: 0.40 }
];

export function createButtonHotspots(model) {
  const buttonHotspots = [];
  const worldBounds = new THREE.Box3().setFromObject(model);
  const min = model.worldToLocal(worldBounds.min.clone());
  const max = model.worldToLocal(worldBounds.max.clone());
  const size = max.clone().sub(min);

  const baseRadius = size.x * 0.11;
  const geometry = new THREE.SphereGeometry(baseRadius, 20, 20);

  const makeHotspot = (name, x, y, scaleX = 1, scaleY = 1) => {
    const hotspot = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.001,
        depthWrite: false
      })
    );

    hotspot.name = name;
    hotspot.position.set(x, y, max.z + size.z * 0.06);
    hotspot.scale.set(scaleX, scaleY, 1);
    model.add(hotspot);
    buttonHotspots.push(hotspot);
  };

  makeHotspot('hotspot-back', min.x + size.x * 0.34, min.y + size.y * 0.39, 0.95, 1.0);
  makeHotspot('hotspot-select', min.x + size.x * 0.51, min.y + size.y * 0.43, 1.7, 0.8);
  makeHotspot('hotspot-up', min.x + size.x * 0.73, min.y + size.y * 0.46);
  makeHotspot('hotspot-down', min.x + size.x * 0.58, min.y + size.y * 0.40);

  return buttonHotspots;
}

export function createNumberKeyHotspots(model) {
  const numberKeyHotspots = [];
  const worldBounds = new THREE.Box3().setFromObject(model);
  const min = model.worldToLocal(worldBounds.min.clone());
  const max = model.worldToLocal(worldBounds.max.clone());
  const size = max.clone().sub(min);

  const baseRadius = size.x * keypadConfig.radius;
  const geometry = new THREE.SphereGeometry(baseRadius, 16, 16);

  const makeNumberKey = (number, row, col) => {
    const hotspot = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.001,
        depthWrite: false
      })
    );

    hotspot.name = `numkey-${number}`;
    const x = min.x + size.x * (keypadConfig.startX + col * keypadConfig.spacingX);
    const y = min.y + size.y * (keypadConfig.startY - row * keypadConfig.spacingY);
    hotspot.position.set(x, y, max.z + size.z * keypadConfig.depth);
    hotspot.scale.set(keypadConfig.scaleX, keypadConfig.scaleY, 1);
    model.add(hotspot);
    numberKeyHotspots.push(hotspot);
  };

  for (let row = 0; row < keypadLayout.length; row += 1) {
    for (let col = 0; col < keypadLayout[row].length; col += 1) {
      makeNumberKey(keypadLayout[row][col], row, col);
    }
  }

  return numberKeyHotspots;
}

export function createKeypadLocalMapper(model) {
  const worldBounds = new THREE.Box3().setFromObject(model);
  const min = model.worldToLocal(worldBounds.min.clone());
  const max = model.worldToLocal(worldBounds.max.clone());
  const size = max.clone().sub(min);

  const centers = [];
  for (let row = 0; row < keypadLayout.length; row += 1) {
    for (let col = 0; col < keypadLayout[row].length; col += 1) {
      centers.push({
        key: keypadLayout[row][col],
        x: keypadConfig.startX + col * keypadConfig.spacingX,
        y: keypadConfig.startY - row * keypadConfig.spacingY
      });
    }
  }

  const regionMarginX = keypadConfig.spacingX * 0.55;
  const regionMarginY = keypadConfig.spacingY * 0.55;
  const regionXMin = keypadConfig.startX - regionMarginX;
  const regionXMax = keypadConfig.startX + keypadConfig.spacingX * 2 + regionMarginX;
  const regionYMax = keypadConfig.startY + regionMarginY;
  const regionYMin = keypadConfig.startY - keypadConfig.spacingY * 3 - regionMarginY;
  const maxDx = keypadConfig.spacingX * 0.48;
  const maxDy = keypadConfig.spacingY * 0.48;

  return (localPoint) => {
    if (!localPoint || size.x <= 0 || size.y <= 0) {
      return null;
    }

    const xNorm = (localPoint.x - min.x) / size.x;
    const yNorm = (localPoint.y - min.y) / size.y;

    if (xNorm < regionXMin || xNorm > regionXMax || yNorm < regionYMin || yNorm > regionYMax) {
      return null;
    }

    let best = null;
    let bestScore = Infinity;

    for (const center of centers) {
      const dx = Math.abs(xNorm - center.x);
      const dy = Math.abs(yNorm - center.y);
      if (dx <= maxDx && dy <= maxDy) {
        const score = dx * dx + dy * dy;
        if (score < bestScore) {
          best = center;
          bestScore = score;
        }
      }
    }

    if (!best) {
      return null;
    }

    return { action: 'digit', value: best.key, isNumber: true };
  };
}

export function createNavLocalMapper(model) {
  const worldBounds = new THREE.Box3().setFromObject(model);
  const min = model.worldToLocal(worldBounds.min.clone());
  const max = model.worldToLocal(worldBounds.max.clone());
  const size = max.clone().sub(min);

  const regionXMin = 0.24;
  const regionXMax = 0.80;
  const regionYMin = 0.31;
  const regionYMax = 0.50;
  const maxDx = 0.11;
  const maxDy = 0.08;

  return (localPoint) => {
    if (!localPoint || size.x <= 0 || size.y <= 0) {
      return null;
    }

    const xNorm = (localPoint.x - min.x) / size.x;
    const yNorm = (localPoint.y - min.y) / size.y;

    if (xNorm < regionXMin || xNorm > regionXMax || yNorm < regionYMin || yNorm > regionYMax) {
      return null;
    }

    let best = null;
    let bestScore = Infinity;

    for (const center of navButtonCenters) {
      const dx = Math.abs(xNorm - center.x);
      const dy = Math.abs(yNorm - center.y);
      if (dx <= maxDx && dy <= maxDy) {
        const score = dx * dx + dy * dy;
        if (score < bestScore) {
          best = center;
          bestScore = score;
        }
      }
    }

    if (!best) {
      return null;
    }

    return { action: best.action };
  };
}

export function isNumberKeyName(name = '') {
  return /^numkey-[0-9*#]$/.test(name);
}

export function mapHotspotNameToAction(hitName) {
  if (hitName === 'hotspot-back') {
    return { action: 'back' };
  }
  if (hitName === 'hotspot-select') {
    return { action: 'select' };
  }
  if (hitName === 'hotspot-up') {
    return { action: 'up' };
  }
  if (hitName === 'hotspot-down') {
    return { action: 'down' };
  }
  if (isNumberKeyName(hitName)) {
    return { action: 'digit', value: hitName.replace('numkey-', ''), isNumber: true };
  }
  return null;
}

export function mapScreenUvToAction(u, yTopOrigin) {
  if (yTopOrigin > 0.82) {
    return { action: u < 0.5 ? 'menu' : 'back' };
  }
  if (yTopOrigin < 0.32) {
    return { action: 'up' };
  }
  if (yTopOrigin > 0.62) {
    return { action: 'down' };
  }
  if (u < 0.33) {
    return { action: 'left' };
  }
  if (u > 0.66) {
    return { action: 'right' };
  }
  return { action: 'select' };
}
