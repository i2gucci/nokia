import { mapHotspotNameToAction, mapScreenUvToAction } from './phoneControls.js';

export function createPointerInputAdapter(deps) {
  const {
    camera,
    raycaster,
    mouse,
    getPhone,
    getScreenMesh,
    getButtonHotspots,
    getNumberKeyHotspots,
    getNavLocalMapper,
    getKeypadLocalMapper
  } = deps;

  function resolveActionFromClick(event) {
    const phone = getPhone();
    if (!phone) {
      return null;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const interactiveTargets = [
      ...getButtonHotspots(),
      ...getNumberKeyHotspots()
    ];

    if (interactiveTargets.length > 0) {
      const hotspotHits = raycaster.intersectObjects(interactiveTargets, false);
      if (hotspotHits.length > 0) {
        const mappedHotspot = mapHotspotNameToAction(hotspotHits[0].object.name);
        if (mappedHotspot) {
          return { ...mappedHotspot, source: 'hotspot' };
        }
      }
    }

    const intersects = raycaster.intersectObject(phone, true);
    if (intersects.length === 0) {
      return null;
    }

    const hit = intersects[0];
    if (hit.point) {
      const localPoint = phone.worldToLocal(hit.point.clone());

      const navLocalMapper = getNavLocalMapper ? getNavLocalMapper() : null;
      if (navLocalMapper) {
        const mappedNav = navLocalMapper(localPoint);
        if (mappedNav) {
          return { ...mappedNav, source: 'nav-region' };
        }
      }

      const keypadLocalMapper = getKeypadLocalMapper ? getKeypadLocalMapper() : null;
      if (keypadLocalMapper) {
        const mappedKeypad = keypadLocalMapper(localPoint);
        if (mappedKeypad) {
          return { ...mappedKeypad, source: 'keypad-region' };
        }
      }
    }

    const screenMesh = getScreenMesh();
    if (!screenMesh) {
      return null;
    }

    if (hit.object !== screenMesh || !hit.uv) {
      return null;
    }

    const mappedScreen = mapScreenUvToAction(hit.uv.x, hit.uv.y);
    return { ...mappedScreen, source: 'screen' };
  }

  return {
    resolveActionFromClick
  };
}
