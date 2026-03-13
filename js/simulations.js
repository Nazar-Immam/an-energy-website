/**
 * AN.Energy — Digital Twin 3D Simulation
 * Three.js offshore wind turbine with component health overlay
 */

'use strict';

(function () {
  if (!window.THREE) {
    console.warn('Three.js not loaded');
    return;
  }

  const canvas = document.getElementById('twin-canvas');
  if (!canvas) return;

  // ============================================================
  // SCENE SETUP
  // ============================================================
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2(0x020508, 0.04);

  const camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 500);
  camera.position.set(12, 8, 20);
  camera.lookAt(0, 6, 0);

  // ============================================================
  // LIGHTS
  // ============================================================
  const ambientLight = new THREE.AmbientLight(0x0a1a2a, 1.5);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x00e5ff, 2);
  keyLight.position.set(10, 20, 10);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x0066ff, 0.8);
  fillLight.position.set(-10, 5, -5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x00ff88, 0.5);
  rimLight.position.set(0, 10, -15);
  scene.add(rimLight);

  // ============================================================
  // MATERIALS
  // ============================================================
  const M = {
    tower: new THREE.MeshStandardMaterial({
      color: 0x1a2a3a, metalness: 0.9, roughness: 0.3,
      emissive: 0x001122, emissiveIntensity: 0.1
    }),
    nacelle: new THREE.MeshStandardMaterial({
      color: 0x0d1f2d, metalness: 0.95, roughness: 0.2,
      emissive: 0x002244, emissiveIntensity: 0.15
    }),
    blade: new THREE.MeshStandardMaterial({
      color: 0x0a1520, metalness: 0.4, roughness: 0.6,
      emissive: 0x001133, emissiveIntensity: 0.05
    }),
    hub: new THREE.MeshStandardMaterial({
      color: 0x152535, metalness: 0.95, roughness: 0.15
    }),
    glowCyan: new THREE.MeshStandardMaterial({
      color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2,
      transparent: true, opacity: 0.85
    }),
    glowGreen: new THREE.MeshStandardMaterial({
      color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 2,
      transparent: true, opacity: 0.85
    }),
    glowAmber: new THREE.MeshStandardMaterial({
      color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 2,
      transparent: true, opacity: 0.85
    }),
    sea: new THREE.MeshStandardMaterial({
      color: 0x040e1a, metalness: 0.1, roughness: 0.8,
      transparent: true, opacity: 0.6
    }),
    platform: new THREE.MeshStandardMaterial({
      color: 0x0c1c2c, metalness: 0.8, roughness: 0.4
    })
  };

  // ============================================================
  // TURBINE COMPONENTS
  // ============================================================
  const turbineGroup = new THREE.Group();
  scene.add(turbineGroup);

  // — Sea surface —
  const seaGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
  const seaPos = seaGeo.attributes.position;
  for (let i = 0; i < seaPos.count; i++) {
    seaPos.setZ(i, rand(-0.15, 0.15));
  }
  seaGeo.computeVertexNormals();
  const sea = new THREE.Mesh(seaGeo, M.sea);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0;
  scene.add(sea);

  // — Offshore platform / monopile base —
  const pileGeo = new THREE.CylinderGeometry(0.6, 0.8, 8, 16);
  const pile = new THREE.Mesh(pileGeo, M.tower);
  pile.position.y = -4;
  turbineGroup.add(pile);

  const platformGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.4, 8);
  const platform = new THREE.Mesh(platformGeo, M.platform);
  platform.position.y = 0.2;
  turbineGroup.add(platform);

  // Platform legs
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 4, 8);
    const leg = new THREE.Mesh(legGeo, M.platform);
    leg.position.set(Math.cos(angle) * 2.5, -2, Math.sin(angle) * 2.5);
    turbineGroup.add(leg);
  }

  // — Tower —
  const towerGeo = new THREE.CylinderGeometry(0.45, 0.85, 18, 20);
  const tower = new THREE.Mesh(towerGeo, M.tower);
  tower.position.y = 9.2;
  tower.castShadow = true;
  turbineGroup.add(tower);

  // Tower ring details
  for (let i = 0; i < 4; i++) {
    const ringGeo = new THREE.TorusGeometry(0.6 - i * 0.04, 0.04, 8, 32);
    const ring = new THREE.Mesh(ringGeo, M.nacelle);
    ring.position.y = 2 + i * 4.5;
    ring.rotation.x = Math.PI / 2;
    turbineGroup.add(ring);
  }

  // — Nacelle —
  const nacelleGroup = new THREE.Group();
  nacelleGroup.position.y = 18.5;
  turbineGroup.add(nacelleGroup);

  const nacelleGeo = new THREE.BoxGeometry(4, 1.6, 2.2);
  const nacelle = new THREE.Mesh(nacelleGeo, M.nacelle);
  nacelle.position.set(-0.5, 0, 0);
  nacelleGroup.add(nacelle);

  // Nacelle cowling (curved shape via scaled sphere)
  const cowlGeo = new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const cowl = new THREE.Mesh(cowlGeo, M.nacelle);
  cowl.scale.set(2, 0.8, 1);
  cowl.position.set(-0.5, 0.4, 0);
  nacelleGroup.add(cowl);

  // — Generator glow indicator (rear nacelle) —
  const genGlowGeo = new THREE.SphereGeometry(0.25, 12, 12);
  const generatorGlow = new THREE.Mesh(genGlowGeo, M.glowGreen.clone());
  generatorGlow.position.set(-2.2, 0.2, 0);
  nacelleGroup.add(generatorGlow);
  generatorGlow.userData = { component: 'Generator', health: 94, temp: '68°C', rpm: '12.4 RPM', status: 'NOMINAL' };

  // — Converter glow indicator —
  const convGlowGeo = new THREE.SphereGeometry(0.2, 12, 12);
  const converterGlow = new THREE.Mesh(convGlowGeo, M.glowAmber.clone());
  converterGlow.position.set(-0.5, -0.6, 0.9);
  nacelleGroup.add(converterGlow);
  converterGlow.userData = { component: 'Converter', health: 74, temp: '82°C', voltage: '690V DC', status: 'WARNING' };

  // — Transformer glow indicator —
  const transGlowGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const transformerGlow = new THREE.Mesh(transGlowGeo, M.glowCyan.clone());
  transformerGlow.position.set(0.8, -0.6, -0.8);
  nacelleGroup.add(transformerGlow);
  transformerGlow.userData = { component: 'Transformer', health: 88, temp: '54°C', ratio: '690V/33kV', status: 'NOMINAL' };

  const glowComponents = [generatorGlow, converterGlow, transformerGlow];

  // — Hub —
  const hubGroup = new THREE.Group();
  hubGroup.position.set(1.8, 0, 0);
  nacelleGroup.add(hubGroup);

  const hubGeo = new THREE.SphereGeometry(0.55, 16, 12);
  const hub = new THREE.Mesh(hubGeo, M.hub);
  hubGroup.add(hub);

  // — Blades —
  function createBlade() {
    const bladeGroup = new THREE.Group();
    const points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const w = lerp(0.25, 0.05, t * t);
      const twist = t * 0.3;
      points.push(new THREE.Vector3(Math.cos(twist) * w, t * 7.5, Math.sin(twist) * w * 0.3));
    }
    const bladeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.08, 6, false);
    const blade = new THREE.Mesh(bladeGeo, M.blade);
    bladeGroup.add(blade);

    // Blade tip light
    const tipGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xff3355, emissive: 0xff3355, emissiveIntensity: 3 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 7.5;
    bladeGroup.add(tip);

    return bladeGroup;
  }

  const rotorGroup = new THREE.Group();
  hubGroup.add(rotorGroup);

  for (let i = 0; i < 3; i++) {
    const blade = createBlade();
    blade.rotation.z = (i / 3) * Math.PI * 2;
    rotorGroup.add(blade);
  }

  // — Grid lines / scan effect —
  const gridMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.04 });
  for (let i = -5; i <= 5; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i * 2, -1, -20),
      new THREE.Vector3(i * 2, -1, 20)
    ]);
    scene.add(new THREE.Line(geo, gridMat));
  }

  // ============================================================
  // ORBIT CONTROLS (manual implementation)
  // ============================================================
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let spherical = { theta: 0.5, phi: 0.6, radius: 28 };

  canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    spherical.theta -= dx * 0.01;
    spherical.phi = clamp(spherical.phi - dy * 0.01, 0.1, Math.PI - 0.1);
    prevMouse = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('wheel', e => {
    spherical.radius = clamp(spherical.radius + e.deltaY * 0.05, 10, 60);
    e.preventDefault();
  }, { passive: false });

  // Touch support
  let lastTouch = null;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });
  canvas.addEventListener('touchend', () => { isDragging = false; lastTouch = null; });
  canvas.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - prevMouse.x;
    const dy = e.touches[0].clientY - prevMouse.y;
    spherical.theta -= dx * 0.01;
    spherical.phi = clamp(spherical.phi - dy * 0.01, 0.1, Math.PI - 0.1);
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
  }, { passive: false });

  // ============================================================
  // HOVER / TOOLTIP
  // ============================================================
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = document.getElementById('twinTooltip');

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(glowComponents);
    if (hits.length && tooltip) {
      const d = hits[0].object.userData;
      const healthColor = d.health > 85 ? '#00ff88' : d.health > 65 ? '#ffaa00' : '#ff3355';
      tooltip.innerHTML = `
        <div class="twin-tooltip-title">⬡ ${d.component.toUpperCase()}</div>
        <div style="margin-bottom:4px">
          <span style="color:var(--text-muted)">Health: </span>
          <span style="color:${healthColor};font-weight:700">${d.health}%</span>
        </div>
        <div><span style="color:var(--text-muted)">Status: </span><span style="color:${healthColor}">${d.status}</span></div>
        <div><span style="color:var(--text-muted)">Temp: </span><span style="color:var(--text-secondary)">${d.temp}</span></div>
        ${d.rpm ? `<div><span style="color:var(--text-muted)">Speed: </span><span style="color:var(--text-secondary)">${d.rpm}</span></div>` : ''}
        ${d.voltage ? `<div><span style="color:var(--text-muted)">Voltage: </span><span style="color:var(--text-secondary)">${d.voltage}</span></div>` : ''}
        ${d.ratio ? `<div><span style="color:var(--text-muted)">Ratio: </span><span style="color:var(--text-secondary)">${d.ratio}</span></div>` : ''}
      `;
      tooltip.style.left = (e.clientX - rect.left + 16) + 'px';
      tooltip.style.top  = (e.clientY - rect.top - 20) + 'px';
      tooltip.classList.add('visible');
      canvas.style.cursor = 'pointer';
    } else {
      if (tooltip) tooltip.classList.remove('visible');
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    }
  });

  // ============================================================
  // ANIMATION LOOP
  // ============================================================
  const clock = new THREE.Clock();
  let rotorRPM = 10;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Wind speed drives rotor RPM
    if (window.State) {
      rotorRPM = lerp(rotorRPM, State.windSpeed * 0.9, 0.01);
    }
    rotorGroup.rotation.x += (rotorRPM / 60) * 2 * Math.PI * 0.016;

    // Sea wave animation
    const pos = seaGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.5 + t * 0.8) * 0.12 + Math.cos(y * 0.4 + t * 0.6) * 0.08);
    }
    pos.needsUpdate = true;
    seaGeo.computeVertexNormals();

    // Glow pulse
    glowComponents.forEach((comp, i) => {
      const pulse = 0.8 + 0.4 * Math.sin(t * 2 + i * 1.5);
      comp.material.emissiveIntensity = pulse * 1.5;
      comp.scale.setScalar(0.9 + 0.15 * Math.sin(t * 1.8 + i));
    });

    // Camera orbit
    const cx = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    const cy = spherical.radius * Math.cos(spherical.phi) + 6;
    const cz = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.position.set(cx, cy, cz);
    camera.lookAt(0, 6, 0);

    renderer.render(scene, camera);
  }

  animate();

  // ============================================================
  // RESIZE
  // ============================================================
  const resizeObserver = new ResizeObserver(() => {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(canvas);

  // ============================================================
  // UTILITY (local copies)
  // ============================================================
  function rand(a, b) { return Math.random() * (b - a) + a; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

})();
