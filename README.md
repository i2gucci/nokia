# 3D Phone Interactive Model

An interactive 3D Nokia-style phone built with Three.js, featuring a retro LCD interface, physical button controls, and keypad audio feedback.

## Features

- 3D phone model with realistic materials
- Retro LCD canvas screen with menu states
- Interactive camera controls (orbit, zoom, pan)
- Physical phone controls and keypad interactions
- Deterministic click mapping for keypad and nav controls
- Number key sound effects and ringtone support
- Smooth GSAP animations
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

This will automatically open your browser at `http://localhost:3000`

### Project Structure

```
phone/
├── assets/                  # Media and 3D model assets
│   ├── nokia.gif
│   ├── numbers.mp3
│   ├── old_nokia_phone_low_poly.glb
│   └── ringtone.mp3
├── js/
│   ├── controls/
│   │   ├── keyboardInput.js # Keyboard-to-action adapter
│   │   ├── phoneControls.js # Hotspots and control mapping helpers
│   │   └── pointerInput.js  # Pointer/click-to-action adapter
│   ├── phone/
│   │   └── controller.js    # Phone domain state + action dispatch
│   └── script.js            # App orchestration (scene + wiring)
├── phone-3d-starter.html    # Main HTML file
├── styles.css               # Global styles
├── package.json             # Project dependencies
└── README.md                # This file
```

## Usage

- **Drag** to rotate the phone
- **Scroll** to zoom in/out
- **Click** physical phone keys to navigate
- **Use keyboard**: Arrow keys, Enter, Backspace, and 0-9
- **Auto Rotate** button - Enable/disable automatic rotation
- **Reset View** button - Return camera to default position

## Customization

### Adding Your Own 3D Model

Uncomment and modify the GLTF loader code in `js/script.js`:

```javascript
const loader = new THREE.GLTFLoader();
loader.load('path/to/your-phone-model.glb', (gltf) => {
  phone = gltf.scene;
  scene.add(phone);
  
  screen = phone.getObjectByName('Screen');
  if (screen) {
    setupScreenVideo();
  }
});
```

## Technologies

- [Three.js](https://threejs.org/) - 3D rendering library
- [GSAP](https://greensock.com/gsap/) - Animation library
- [live-server](https://www.npmjs.com/package/live-server) - Development server

## Architecture Notes

- `js/phone/controller.js` is the phone domain boundary. It owns phone state and action transitions.
- `js/controls/phoneControls.js` contains physical-control geometry and input mapping helpers.
- `js/controls/keyboardInput.js` and `js/controls/pointerInput.js` normalize raw input into action events.
- `js/script.js` uses one action pipeline to run side effects (such as number-key sounds) and dispatch actions.
- `js/script.js` orchestrates rendering, model loading, and bridges UI events to the phone controller.

## Next Steps

1. Replace placeholder phone with a real 3D model
2. Add more interactive elements
3. Implement additional camera animations
4. Add audio effects
5. Create multiple content screens

## License

MIT
