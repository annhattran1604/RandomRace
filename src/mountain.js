import * as THREE from 'three';

export class MountainScene {
  constructor(scene) {
    this.scene = scene;
    this.totalHeight = 800; // Mặc định 800m
    this.climbWidth = 75;
    
    this.obstacles = [];
    this.boulders = [];
    this.crystals = [];
    this.platforms = [];
    this.clouds = [];
    
    // Dedicated group for track meshes to allow dynamic rebuilding
    this.trackGroup = new THREE.Group();
    this.scene.add(this.trackGroup);

    this.buildLightingAndSky();
    this.buildValleyBackground();
    this.rebuildTrack();
  }

  setTrackLength(height) {
    const val = parseInt(height, 10);
    if (!val || val <= 0 || this.totalHeight === val) return;
    this.totalHeight = val;
    this.rebuildTrack();
  }

  rebuildTrack() {
    // Clear and dispose existing track elements
    while (this.trackGroup.children.length > 0) {
      const obj = this.trackGroup.children[0];
      this.trackGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    this.obstacles = [];
    this.boulders = [];
    this.platforms = [];

    this.buildMountainSpire();
    this.buildWoodenPlatformsAndRopes();
    this.buildSummit();
    this.buildObstacles();
  }

  // Exact function for mountain surface Z at (x, y)
  getSurfaceZ(x, y) {
    // Tapering mountain spire: wider at bottom, narrower at summit
    const progress = Math.max(0, Math.min(1, y / this.totalHeight));
    const slantZ = - (y * 0.14);
    
    // Low-poly faceted rock ridges
    const ridgeNoise = Math.sin(x * 0.12) * Math.cos(y * 0.04) * 3.5;
    const terrace = Math.sin(y * 0.08) * 1.2;
    return slantZ + ridgeNoise + terrace;
  }

  buildLightingAndSky() {
    // Hemisphere Sky/Ground Ambient
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3f5135, 0.95);
    this.scene.add(hemiLight);

    // Warm Golden Sun (Crisp Pixar-style lighting)
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    sunLight.position.set(90, 280, 160);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0008;
    const d = 180;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 800;
    this.scene.add(sunLight);

    // Soft Cyan Rim Light to pop silhouettes
    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
    rimLight.position.set(-100, 180, 50);
    this.scene.add(rimLight);
  }

  buildValleyBackground() {
    // 1. Lush Green Valley Floor with Winding River
    const groundGeo = new THREE.PlaneGeometry(600, 500, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f, // Rich alpine meadow green
      roughness: 0.85,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -10, -50);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Winding Blue River in Valley
    const riverCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(70, -9.5, -180),
      new THREE.Vector3(120, -9.5, -90),
      new THREE.Vector3(80, -9.5, 30),
      new THREE.Vector3(140, -9.5, 150)
    ]);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 24, 14, 8, false);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.5,
      flatShading: true
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    this.scene.add(river);

    // 2. Rolling Green Hills & Pine Forests in Background
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, flatShading: true });
    [-200, -120, 110, 210].forEach((hx, idx) => {
      const hillGeo = new THREE.ConeGeometry(80 + Math.random() * 30, 90 + Math.random() * 40, 7);
      const hill = new THREE.Mesh(hillGeo, hillMat);
      hill.position.set(hx, 15, -160 - Math.random() * 80);
      hill.scale.set(1.4, 0.7, 1.2);
      this.scene.add(hill);
    });

    // Pine Trees across Valley
    for (let i = 0; i < 45; i++) {
      const tree = this.createStylizedTree();
      const tx = (Math.random() - 0.5) * 360;
      const tz = -180 + Math.random() * 260;
      if (Math.abs(tx) > 45) { // Keep center clear for main mountain
        tree.position.set(tx, -8, tz);
        this.scene.add(tree);
      }
    }

    // 3. Drifting Fluffy White Low-Poly Clouds in Sky
    for (let i = 0; i < 9; i++) {
      const cloud = this.createFluffyCloud();
      cloud.position.set(
        (Math.random() - 0.5) * 350,
        140 + Math.random() * 260,
        -120 - Math.random() * 90
      );
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  createStylizedTree() {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.8, 3.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x54361e, flatShading: true })
    );
    trunk.position.y = 1.75;
    tree.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x166534, flatShading: true, roughness: 0.8 });
    [ { r: 3.8, h: 4.5, y: 4.5 }, { r: 2.8, h: 3.8, y: 7.5 }, { r: 1.6, h: 3.2, y: 10.2 } ].forEach(l => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(l.r, l.h, 6), foliageMat);
      cone.position.y = l.y;
      cone.castShadow = true;
      tree.add(cone);
    });

    const scale = 0.9 + Math.random() * 0.5;
    tree.scale.set(scale, scale, scale);
    return tree;
  }

  createFluffyCloud() {
    const cloud = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true
    });

    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(6 + Math.random() * 4, 1), mat);
      puff.position.set((i - count / 2) * 6, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4);
      cloud.add(puff);
    }
    cloud.userData = { speedX: 0.5 + Math.random() * 1.2 };
    return cloud;
  }

  // 🏔️ STYLIZED LOW-POLY MOUNTAIN SPIRE WITH FACETED CLIFF & GREEN LEDGES
  buildMountainSpire() {
    const cliffHeight = this.totalHeight;
    const segmentsY = Math.max(95, Math.round(cliffHeight / 4.5));
    const segmentsX = 40;
    const cliffGeo = new THREE.PlaneGeometry(this.climbWidth * 2.6, cliffHeight, segmentsX, segmentsY);
    
    const pos = cliffGeo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    // Warm Stylized Palette: Earthy Grey Rock, Grass Ledges, Snow Top
    const rockColor = new THREE.Color(0x78716c);   // Warm cliff granite
    const grassColor = new THREE.Color(0x4d7c0f);  // Alpine grass ledge
    const snowColor = new THREE.Color(0xf8fafc);   // Peak snow

    const snowThreshold = cliffHeight * 0.82;
    const grassCeiling = cliffHeight * 0.70;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i) + cliffHeight / 2;
      const z = this.getSurfaceZ(x, y);
      pos.setZ(i, z);

      // Color mapping: rock with lush grass ledges and snowy top
      const vertexColor = new THREE.Color().copy(rockColor);

      // Grass on ledges & lower zones
      const isLedge = Math.sin(y * 0.08) > 0.38 && y < grassCeiling;
      if (y < 90 || isLedge) {
        vertexColor.lerp(grassColor, 0.7);
      } else if (y > snowThreshold) {
        // Snowy summit
        const snowT = (y - snowThreshold) / (cliffHeight - snowThreshold);
        vertexColor.lerp(snowColor, Math.min(1, Math.max(0, snowT)));
      }

      // Add subtle lighting facet variance
      const shade = (Math.sin(x * 0.3) + Math.cos(y * 0.25)) * 0.04;
      vertexColor.offsetHSL(0, 0, shade);

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    cliffGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    cliffGeo.computeVertexNormals();

    const cliffMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.08,
      flatShading: true
    });

    this.cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
    this.cliffMesh.position.set(0, cliffHeight / 2, 0);
    this.cliffMesh.receiveShadow = true;
    this.cliffMesh.castShadow = true;
    this.trackGroup.add(this.cliffMesh);

    // Add colorful Rock Climbing Handholds
    this.buildClimbingHolds();
  }

  buildClimbingHolds() {
    const holdColors = [0xef4444, 0xfacc15, 0x3b82f6, 0xf97316, 0xa855f7];
    const holdGeo = new THREE.DodecahedronGeometry(0.7, 0);

    for (let y = 15; y < this.totalHeight - 15; y += 8) {
      for (let k = 0; k < 3; k++) {
        const color = holdColors[Math.floor(Math.random() * holdColors.length)];
        const holdMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, flatShading: true });
        const hold = new THREE.Mesh(holdGeo, holdMat);
        
        const hx = (Math.random() - 0.5) * (this.climbWidth * 1.35);
        const hz = this.getSurfaceZ(hx, y) + 0.8;
        hold.position.set(hx, y, hz);
        hold.scale.set(1.1, 0.7, 0.9);
        this.trackGroup.add(hold);
      }
    }
  }

  // 🪵 WOODEN SCAFFOLDING PLATFORMS & HANGING CLIMBING ROPES
  buildWoodenPlatformsAndRopes() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.75, flatShading: true });
    const woodSupportMat = new THREE.MeshStandardMaterial({ color: 0x54361e, roughness: 0.9 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

    // Dynamic Wooden Ledge Platforms every ~65m up to summit
    const platformHeights = [];
    for (let py = 60; py < this.totalHeight - 55; py += 65) {
      platformHeights.push(py);
    }

    platformHeights.forEach((py, idx) => {
      const px = (idx % 2 === 0 ? 1 : -1) * (14 + (idx % 3) * 6);
      const pz = this.getSurfaceZ(px, py) + 2.0;

      const plat = new THREE.Group();
      plat.position.set(px, py, pz);

      // Plank deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(11, 1.0, 5.5), woodMat);
      deck.castShadow = true;
      plat.add(deck);

      // Support struts underneath
      const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), woodSupportMat);
      strutL.position.set(-4, -2.2, -1.8);
      strutL.rotation.x = Math.PI / 5;
      plat.add(strutL);

      const strutR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), woodSupportMat);
      strutR.position.set(4, -2.2, -1.8);
      strutR.rotation.x = Math.PI / 5;
      plat.add(strutR);

      this.trackGroup.add(plat);
      this.platforms.push(plat);
    });

    // Hanging Climbing Ropes
    [-18, -4, 12, 22].forEach(rx => {
      const ropeGeo = new THREE.CylinderGeometry(0.18, 0.18, this.totalHeight * 0.94, 6);
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.position.set(rx, this.totalHeight * 0.48, this.getSurfaceZ(rx, this.totalHeight * 0.48) + 1.2);
      this.trackGroup.add(rope);
    });
  }

  // 🏆 GLORIOUS SUMMIT WITH CHECKERED RACING ARCH & GOLD TROPHY
  buildSummit() {
    const summitY = this.totalHeight;
    const summitZ = this.getSurfaceZ(0, summitY);

    // Snowy Summit Plateau
    const peakGeo = new THREE.BoxGeometry(this.climbWidth * 1.7, 10, 32);
    const peakMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      flatShading: true
    });
    const peak = new THREE.Mesh(peakGeo, peakMat);
    peak.position.set(0, summitY + 5, summitZ - 8);
    this.trackGroup.add(peak);

    // Summit Archway
    const archGroup = new THREE.Group();
    archGroup.position.set(0, summitY, summitZ);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    [-this.climbWidth * 0.4, this.climbWidth * 0.4].forEach(x => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 20, 8), postMat);
      pole.position.set(x, 10, 0);
      archGroup.add(pole);
    });

    // Checkered Racing Finish Banner Canvas (Black & White checkered flag just like concept!)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Draw Checkerboard Pattern
    const rows = 4;
    const cols = 16;
    const sqW = 1024 / cols;
    const sqH = 256 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#111827' : '#f8fafc';
        ctx.fillRect(c * sqW, r * sqH, sqW, sqH);
      }
    }

    // Centered Gold Title Badge
    ctx.fillStyle = '#f59e0b';
    ctx.roundRect(180, 48, 664, 160, 24);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🏆 ĐÍCH ĐẾN ${this.totalHeight}M 🏆`, 512, 128);

    const tex = new THREE.CanvasTexture(canvas);
    const bannerMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(this.climbWidth * 0.85, 7.5), bannerMat);
    banner.position.set(0, 18, 1.5);
    archGroup.add(banner);

    this.trackGroup.add(archGroup);

    // Majestic Golden Trophy Cup with Star
    this.trophy = this.createMajesticTrophy();
    this.trophy.position.set(0, summitY + 12, summitZ - 12);
    this.trackGroup.add(this.trophy);
  }

  createMajesticTrophy() {
    const trophy = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xffb700,
      emissiveIntensity: 0.25
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 3, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    trophy.add(base);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4.5, 16), goldMat);
    stem.position.y = 3.5;
    trophy.add(stem);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 2.5, 7, 16), goldMat);
    bowl.position.y = 8.5;
    trophy.add(bowl);

    [-1, 1].forEach(side => {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.6, 8, 16, Math.PI), goldMat);
      handle.position.set(side * 4.8, 9, 0);
      handle.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      trophy.add(handle);
    });

    const starGeo = new THREE.DodecahedronGeometry(1.8, 0);
    const star = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85 }));
    star.position.y = 9.5;
    trophy.add(star);

    trophy.scale.set(1.7, 1.7, 1.7);
    return trophy;
  }

  // 🍄 BOUNCY MUSHROOMS WITH 3D COILED SPRINGS & 🍌 GOLDEN BANANAS
  buildObstacles() {
    this.obstacles = [];
    const heightFactor = this.totalHeight / 450;
    const countBouncers = Math.round(20 * heightFactor);
    const countBananas = Math.round(18 * heightFactor);
    const countWind = Math.round(14 * heightFactor);

    const startObsY = this.totalHeight * 0.18;
    const endObsY = this.totalHeight * 0.94;

    // 1. Mario-style Bouncy Mushrooms with real 3D Coiled Spring
    for (let i = 0; i < countBouncers; i++) {
      const y = startObsY + Math.random() * (endObsY - startObsY);
      const x = (Math.random() - 0.5) * (this.climbWidth * 1.3);
      const z = this.getSurfaceZ(x, y) + 1.2;

      const mushroom = new THREE.Group();
      mushroom.position.set(x, y, z);
      mushroom.rotation.x = Math.PI / 4;

      // Wooden base plank
      const basePlank = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.8, 4.2),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
      );
      mushroom.add(basePlank);

      // Silver Coiled Spring (Helical tube)
      const springCurve = new THREE.Curve();
      springCurve.getPoint = function (t) {
        const turns = 3.5;
        const angle = t * Math.PI * 2 * turns;
        const radius = 1.0;
        const height = 2.2 * t;
        return new THREE.Vector3(Math.cos(angle) * radius, height + 0.4, Math.sin(angle) * radius);
      };
      const springGeo = new THREE.TubeGeometry(springCurve, 40, 0.22, 8, false);
      const springMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
      const spring = new THREE.Mesh(springGeo, springMat);
      mushroom.add(spring);

      // Red or Purple Dome Cap
      const capColor = i % 2 === 0 ? 0xef4444 : 0xa855f7;
      const capGeo = new THREE.SphereGeometry(2.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.25 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 2.8;
      mushroom.add(cap);

      // White Polka Dots
      const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const dotPositions = [
        [0, 5.2, 0],
        [1.6, 4.4, 1.0],
        [-1.6, 4.4, 1.0],
        [1.6, 4.4, -1.0],
        [-1.6, 4.4, -1.0],
        [0, 4.4, 1.8],
        [0, 4.4, -1.8]
      ];
      dotPositions.forEach(p => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), dotMat);
        dot.position.set(p[0], p[1], p[2]);
        mushroom.add(dot);
      });

      this.trackGroup.add(mushroom);

      this.obstacles.push({
        type: 'BOUNCE',
        x, y, z,
        radius: 4.8,
        mesh: mushroom
      });
    }

    // 2. 🍌 Golden Bananas
    for (let i = 0; i < countBananas; i++) {
      const y = startObsY + 5 + Math.random() * (endObsY - startObsY - 10);
      const x = (Math.random() - 0.5) * (this.climbWidth * 1.3);
      const z = this.getSurfaceZ(x, y) + 2.0;

      const banana = this.createBananaMesh();
      banana.position.set(x, y, z);
      this.trackGroup.add(banana);

      this.obstacles.push({
        type: 'BANANA',
        x, y, z,
        radius: 4.5,
        mesh: banana
      });
    }

    // 3. 🌀 Cyan Swirling Wind Vortex (Helical Spiral Trail)
    for (let i = 0; i < countWind; i++) {
      const y = startObsY + 15 + Math.random() * (endObsY - startObsY - 20);
      const x = (Math.random() - 0.5) * (this.climbWidth * 1.25);
      const z = this.getSurfaceZ(x, y) + 2.5;

      const windGroup = new THREE.Group();
      windGroup.position.set(x, y, z);

      // Spiral ribbon curve
      const spiralCurve = new THREE.Curve();
      spiralCurve.getPoint = function (t) {
        const angle = t * Math.PI * 4;
        const radius = 2.0 + t * 2.2;
        const height = t * 4.0;
        return new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      };
      const windGeo = new THREE.TubeGeometry(spiralCurve, 36, 0.35, 6, false);
      const windMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.75,
        roughness: 0.2
      });
      const windMesh = new THREE.Mesh(windGeo, windMat);
      windGroup.add(windMesh);

      this.trackGroup.add(windGroup);

      this.obstacles.push({
        type: 'WIND',
        x, y, z,
        radius: 5.2,
        mesh: windGroup,
        direction: Math.random() > 0.5 ? 1 : -1
      });
    }

    // 4. Falling Boulders (Chiseled magma/granite hazard stones)
    this.createHazardBoulders();
  }

  createBananaMesh() {
    const bunch = new THREE.Group();
    const bananaMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.1
    });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.8 });

    [-0.5, 0, 0.5].forEach((offsetAngle, idx) => {
      const banana = new THREE.Group();
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.8, -1.4, 0),
        new THREE.Vector3(0.7, 0, 0),
        new THREE.Vector3(-0.6, 1.4, 0)
      );
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.55, 8, false), bananaMat);
      banana.add(tube);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 6), tipMat);
      stem.position.set(-0.65, 1.65, 0);
      banana.add(stem);

      banana.rotation.z = offsetAngle * 0.4;
      banana.position.set(idx * 0.5 - 0.5, 0, idx === 1 ? 0.3 : 0);
      bunch.add(banana);
    });

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.12, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.6 })
    );
    bunch.add(ring);

    bunch.scale.set(1.2, 1.2, 1.2);
    return bunch;
  }

  createHazardBoulders() {
    this.boulders = [];
    const boulderMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });
    
    const count = Math.max(6, Math.round(6 * (this.totalHeight / 450)));
    for (let i = 0; i < count; i++) {
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), boulderMat);
      boulder.castShadow = true;
      this.resetBoulder(boulder, true);
      this.trackGroup.add(boulder);
      this.boulders.push(boulder);
    }
  }

  resetBoulder(boulder, initial = false) {
    const minY = this.totalHeight * 0.62;
    const y = initial ? (minY + Math.random() * (this.totalHeight - minY - 15)) : this.totalHeight - 10;
    const x = (Math.random() - 0.5) * (this.climbWidth * 1.3);
    const z = this.getSurfaceZ(x, y) + 2.5;
    boulder.position.set(x, y, z);
    boulder.userData = {
      speedY: 20 + Math.random() * 16,
      rotSpeed: (Math.random() - 0.5) * 5,
      radius: 2.8
    };
  }

  update(delta) {
    if (this.trophy) {
      this.trophy.rotation.y += delta * 1.4;
    }

    // Drift sky clouds across the horizon
    this.clouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speedX * delta * 5;
      if (cloud.position.x > 220) cloud.position.x = -220;
    });

    // Animate Obstacles
    this.obstacles.forEach(obs => {
      if (obs.type === 'BOUNCE') {
        const squash = 1 + Math.sin(Date.now() * 0.006 + obs.y) * 0.08;
        obs.mesh.scale.set(1, squash, 1);
      } else if (obs.type === 'BANANA') {
        obs.mesh.rotation.y += delta * 2.5;
        obs.mesh.position.y = obs.y + Math.sin(Date.now() * 0.004 + obs.x) * 0.6;
      } else if (obs.type === 'WIND') {
        obs.mesh.rotation.y += delta * obs.direction * 3.5;
      }
    });

    // Boulders
    const boulderMinY = this.totalHeight * 0.5;
    this.boulders.forEach(b => {
      b.position.y -= b.userData.speedY * delta;
      b.position.z = this.getSurfaceZ(b.position.x, b.position.y) + 2.5;
      b.rotation.x += b.userData.rotSpeed * delta;
      b.rotation.y += b.userData.rotSpeed * delta;

      if (b.position.y < boulderMinY) {
        this.resetBoulder(b);
      }
    });
  }
}
