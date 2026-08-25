import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

class CisternScene extends HTMLElement {
  connectedCallback() {
    if (this._booted) return;
    this._booted = true;
    this.style.display = 'block';
    this.style.position = 'relative';
    this.style.width = '100%';
    this.style.height = '100%';

    const accent = new THREE.Color(this.getAttribute('accent') || '#4fd6a8');
    const wall = new THREE.Color(this.getAttribute('wall') || '#2a2724');

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(clamp(window.devicePixelRatio, 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    Object.assign(renderer.domElement.style, { display: 'block', position: 'absolute', inset: '0', width: '100%', height: '100%' });
    this.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#141210');
    scene.fog = new THREE.Fog('#141210', 26, 64);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    camera.position.set(0.4, 0.9, 10.5);

    // ---- room: open cylinder, seen from inside
    const room = new THREE.Mesh(
      new THREE.CylinderGeometry(13, 13, 18, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: wall, roughness: 0.95, metalness: 0, side: THREE.BackSide })
    );
    room.position.y = 5;
    room.receiveShadow = true;
    scene.add(room);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(13, 96),
      new THREE.MeshStandardMaterial({ color: '#1b1917', roughness: 0.9, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -4;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- pedestal
    const pedestal = new THREE.Group();
    pedestal.position.y = -4;
    pedestal.position.x = 2.4;
    pedestal.scale.setScalar(0.52);
    scene.add(pedestal);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(4.1, 4.3, 3.4, 72),
      new THREE.MeshStandardMaterial({ color: '#2f2b28', roughness: 0.85, metalness: 0.05 })
    );
    plinth.position.y = 1.7;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    pedestal.add(plinth);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(4.35, 4.35, 0.28, 72),
      new THREE.MeshStandardMaterial({ color: '#3a3532', roughness: 0.55, metalness: 0.1 })
    );
    top.position.y = 3.5;
    top.castShadow = true;
    top.receiveShadow = true;
    pedestal.add(top);

    // ---- the artifact group sits on the pedestal top
    const stage = new THREE.Group();
    stage.position.y = 3.64;
    stage.scale.setScalar(0.9);
    pedestal.add(stage);

    // panelled cistern (solid): 6 arc panels, alternating materials
    const solid = new THREE.Group();
    solid.position.set(-1.45, 0, 0.1);
    stage.add(solid);

    const PANELS = 6;
    const gap = 0.035;
    for (let i = 0; i < PANELS; i++) {
      const seg = (Math.PI * 2) / PANELS;
      const geo = new THREE.CylinderGeometry(1.28, 1.28, 1.5, 24, 1, true, i * seg + gap, seg - gap * 2);
      const even = i % 2 === 0;
      const mat = new THREE.MeshStandardMaterial({
        color: even ? '#cfc7bd' : accent,
        roughness: even ? 0.42 : 0.28,
        metalness: even ? 0.15 : 0.35,
        side: THREE.DoubleSide
      });
      const panel = new THREE.Mesh(geo, mat);
      panel.position.y = 0.75;
      panel.castShadow = true;
      panel.receiveShadow = true;
      solid.add(panel);
    }
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.28, 0.035, 8, 72),
      new THREE.MeshStandardMaterial({ color: '#8f8880', roughness: 0.3, metalness: 0.6 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.5;
    solid.add(rim);
    const rim2 = rim.clone();
    rim2.position.y = 0.01;
    solid.add(rim2);

    // wireframe twin, floating just above
    const wire = new THREE.Group();
    wire.position.set(-1.45, 2.5, 0.1);
    stage.add(wire);
    const wireMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.55 });
    const shell = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.CylinderGeometry(1.28, 1.28, 1.5, 36, 3, true)),
      wireMat
    );
    shell.position.y = 0.75;
    wire.add(shell);
    const cap = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.RingGeometry(0.42, 1.28, 36, 2)),
      wireMat
    );
    cap.rotation.x = -Math.PI / 2;
    cap.position.y = 1.5;
    wire.add(cap);

    // placeholder mesh (stands in for suzanne)
    const suz = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.92, 1),
      new THREE.MeshStandardMaterial({ color: '#4a443f', roughness: 0.55, metalness: 0.2, flatShading: true })
    );
    suz.position.set(1.75, 0.95, 0.2);
    suz.castShadow = true;
    suz.receiveShadow = true;
    stage.add(suz);

    // the little emissive marker
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 32, 24),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4, roughness: 0.3 })
    );
    marker.position.set(0.15, 4.0, 0.6);
    stage.add(marker);
    const markerLight = new THREE.PointLight(accent, 8, 9, 2);
    markerLight.position.copy(marker.position);
    stage.add(markerLight);

    // ---- lighting
    scene.add(new THREE.HemisphereLight('#cbb9a4', '#191614', 0.55));
    const key = new THREE.DirectionalLight('#fff3e2', 2.1);
    key.position.set(5.5, 11, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    key.shadow.bias = -0.0015;
    key.shadow.radius = 3;
    scene.add(key);
    const wallGlow = new THREE.PointLight('#e0c49a', 90, 40, 2);
    wallGlow.position.set(0, 3, 0);
    scene.add(wallGlow);
    const fill = new THREE.DirectionalLight('#7fa8c9', 0.5);
    fill.position.set(-7, 4, -5);
    scene.add(fill);

    // ---- pointer parallax + resize
    let px = 0, py = 0, tx = 0, ty = 0;
    const onMove = (e) => {
      const r = this.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    this.addEventListener('pointermove', onMove);
    this.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

    const resize = () => {
      const w = this.clientWidth || 800, h = this.clientHeight || 600;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    new ResizeObserver(resize).observe(this);

    const spin = this.getAttribute('autorotate') !== 'false';
    const t0 = performance.now();
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      const t = (performance.now() - t0) / 1000;
      px += (tx - px) * 0.05;
      py += (ty - py) * 0.05;
      if (spin) {
        solid.rotation.y = t * 0.16;
        wire.rotation.y = -t * 0.1;
        suz.rotation.y = Math.sin(t * 0.3) * 0.5;
      }
      wire.position.y = 2.5 + Math.sin(t * 0.7) * 0.09;
      marker.position.y = 4.0 + Math.sin(t * 0.9 + 1) * 0.14;
      markerLight.position.copy(marker.position);
      camera.position.x = 0.4 + px * 1.1 + Math.sin(t * 0.08) * 0.6;
      camera.position.y = 0.9 - py * 0.8;
      camera.lookAt(2.2, -1.2, 0);
      renderer.render(scene, camera);
    };
    loop();
  }

  disconnectedCallback() { cancelAnimationFrame(this._raf); }
}

if (!customElements.get('cistern-scene')) customElements.define('cistern-scene', CisternScene);
