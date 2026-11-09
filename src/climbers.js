import * as THREE from 'three';
import { soundManager } from './sound.js';

// Color palette generator
function getVibrantColor(index, total) {
  const hue = (index * (360 / Math.max(total, 1))) % 360;
  return new THREE.Color(`hsl(${hue}, 92%, 52%)`);
}

export class ClimberManager {
  constructor(scene, mountain) {
    this.scene = scene;
    this.mountain = mountain;
    this.climbers = [];
    this.finishers = [];
    this.isRacing = false;
    this.speedMultiplier = 1.0;
  }

  setupClimbers(names) {
    this.climbers.forEach(c => {
      this.scene.remove(c.mesh);
      if (c.nameSprite) {
        c.nameSprite.material.map.dispose();
        c.nameSprite.material.dispose();
        this.scene.remove(c.nameSprite);
      }
    });
    this.climbers = [];
    this.finishers = [];
    this.isRacing = false;

    const total = names.length;
    // Bố trí trải đều trên chiều rộng vách núi, thẳng tắp 1 hàng ngang duy nhất
    const startSpan = Math.min(this.mountain.climbWidth * 1.7, Math.max(38, (total - 1) * 3.2));
    const startY = 3.5; // TẤT CẢ XUẤT PHÁT CÙNG MỘT ĐỘ CAO (CÙNG HÀNG NGANG)

    names.forEach((name, i) => {
      const color = getVibrantColor(i, total);
      const { group: mesh, parts } = this.createMonkeyMesh(color, i, name);

      // Thẳng hàng ngang cùng vạch xuất phát
      const startX = total <= 1 ? 0 : -startSpan / 2 + (i / (total - 1)) * startSpan;
      const startZ = this.mountain.getSurfaceZ(startX, startY) + 1.6;

      mesh.position.set(startX, startY, startZ);
      this.scene.add(mesh);

      // Create floating name sprite
      const nameSprite = this.createNameSprite(name, color);
      nameSprite.position.set(startX, startY + 3.8, startZ);
      this.scene.add(nameSprite);

      this.climbers.push({
        id: i,
        name: name.trim() || `Khỉ #${i + 1}`,
        color,
        mesh,
        parts,
        nameSprite,
        x: startX,
        y: startY,
        z: startZ,
        targetX: startX,
        // Cân bằng thể lực xuất phát đồng đều tuyệt đối
        baseSpeed: 7.2,
        currentSpeed: 7.2,
        burstTimer: 0.4 + Math.random() * 0.6,
        stunTimer: 0,
        finished: false,
        finishTime: 0,
        climbCycle: Math.random() * 10
      });
    });
  }

  // 🐒 Make Monkeys BIGGER and clearer on screen with Athletic/Cyber Outfits & Randomized Gear!
  createMonkeyMesh(bandanaColor, index = 0, name = '') {
    const group = new THREE.Group();
    const parts = {};

    // 🎨 Varied Natural Fur Palette
    const furPalette = [
      0x78350f, // Rich warm brown
      0x54260a, // Dark cocoa
      0xb45309, // Golden amber / Sun Wukong tint
      0x3f3f46, // Cyber slate / Dark charcoal
      0x9a3412, // Auburn / Rust
      0x64748b  // Silver ash
    ];
    const furColor = furPalette[index % furPalette.length];

    const furMat = new THREE.MeshStandardMaterial({
      color: furColor,
      roughness: 0.75,
      flatShading: true
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Tan / peach face & belly
      roughness: 0.55,
      flatShading: true
    });

    // Vibrant Outfit / Gear Material with gentle neon glow
    const gearMat = new THREE.MeshStandardMaterial({
      color: bandanaColor,
      roughness: 0.35,
      metalness: 0.2,
      emissive: bandanaColor,
      emissiveIntensity: 0.32
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.3
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.85
    });

    // 1. Monkey Torso
    const bodyGeo = new THREE.SphereGeometry(1.2, 14, 12);
    bodyGeo.scale(1.05, 1.3, 0.95);
    const body = new THREE.Mesh(bodyGeo, furMat);
    body.castShadow = true;
    group.add(body);

    // Tan Belly Patch (Facing the cliff, visible at slight angles)
    const bellyGeo = new THREE.SphereGeometry(0.92, 12, 10);
    bellyGeo.scale(0.85, 1.1, 0.35);
    const belly = new THREE.Mesh(bellyGeo, skinMat);
    belly.position.set(0, -0.05, -0.82);
    group.add(belly);

    // 2. Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.5, -0.15);

    const headGeo = new THREE.SphereGeometry(1.0, 14, 12);
    const head = new THREE.Mesh(headGeo, furMat);
    head.castShadow = true;
    headGroup.add(head);

    // Face / Muzzle
    const muzzleGeo = new THREE.SphereGeometry(0.72, 12, 10);
    muzzleGeo.scale(0.9, 0.75, 0.65);
    const muzzle = new THREE.Mesh(muzzleGeo, skinMat);
    muzzle.position.set(0, -0.15, -0.72);
    headGroup.add(muzzle);

    // Big Cute Monkey Ears
    [-1.1, 1.1].forEach(x => {
      const earOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 12), furMat);
      earOuter.rotation.z = Math.PI / 2;
      earOuter.position.set(x, 0.15, 0);
      headGroup.add(earOuter);

      const earInner = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 10), skinMat);
      earInner.rotation.z = Math.PI / 2;
      earInner.position.set(x > 0 ? x + 0.02 : x - 0.02, 0.15, 0);
      headGroup.add(earInner);
    });

    // Cartoon Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.3, 0.3].forEach(x => {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), eyeWhiteMat);
      eyeWhite.position.set(x, 0.12, -0.92);
      headGroup.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
      pupil.position.set(x, 0.14, -1.1);
      headGroup.add(pupil);
    });

    // 🧢 RANDOM HEADWEAR ACCESSORIES (4 Styles)
    const headwearType = index % 4;

    if (headwearType === 0) {
      // 0. Backwards Snapback Cap (Super cool rear view!)
      const capGroup = new THREE.Group();
      // Cap Dome
      const capGeo = new THREE.SphereGeometry(1.04, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.54);
      const capMesh = new THREE.Mesh(capGeo, gearMat);
      capMesh.position.set(0, 0.08, 0.05);
      capGroup.add(capMesh);

      // Backwards Brim pointing towards camera (Z+)
      const brimGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 12, 1, false, 0, Math.PI);
      const brim = new THREE.Mesh(brimGeo, darkAccentMat);
      brim.rotation.x = -Math.PI / 8;
      brim.position.set(0, 0.08, 0.95);
      capGroup.add(brim);

      // Cap Top Button
      const buttonGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const capButton = new THREE.Mesh(buttonGeo, darkAccentMat);
      capButton.position.set(0, 1.14, 0.05);
      capGroup.add(capButton);

      headGroup.add(capGroup);

    } else if (headwearType === 1) {
      // 1. Cyber Headphones (Gaming / Athleisure over-ear)
      const hpGroup = new THREE.Group();
      // Headband arc
      const arcGeo = new THREE.TorusGeometry(1.08, 0.12, 8, 18, Math.PI);
      const headband = new THREE.Mesh(arcGeo, darkAccentMat);
      headband.rotation.z = -Math.PI;
      headband.position.set(0, 0.28, 0);
      hpGroup.add(headband);

      // Ear cups with glowing neon accents
      [-1.18, 1.18].forEach(x => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.22, 14), darkAccentMat);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(x, 0.18, 0);
        hpGroup.add(cup);

        const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 6, 12), gearMat);
        glowRing.rotation.y = Math.PI / 2;
        glowRing.position.set(x > 0 ? x + 0.12 : x - 0.12, 0.18, 0);
        hpGroup.add(glowRing);
      });
      headGroup.add(hpGroup);

    } else if (headwearType === 2) {
      // 2. High-Tech Mountaineer Goggles
      const goggleGroup = new THREE.Group();
      // Elastic Strap
      const strapGeo = new THREE.TorusGeometry(1.03, 0.09, 8, 16);
      const strap = new THREE.Mesh(strapGeo, darkAccentMat);
      strap.rotation.x = Math.PI / 2.2;
      strap.position.set(0, 0.38, 0);
      goggleGroup.add(strap);

      // Dual Lenses tilted upward onto forehead
      [-0.42, 0.42].forEach(x => {
        const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.18, 10), darkAccentMat);
        frame.rotation.x = Math.PI / 2.8;
        frame.position.set(x, 0.45, -0.85);
        goggleGroup.add(frame);

        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 10), gearMat);
        lens.rotation.x = Math.PI / 2.8;
        lens.position.set(x, 0.45, -0.9);
        goggleGroup.add(lens);
      });
      headGroup.add(goggleGroup);

    } else {
      // 3. Ninja Sport Bandana with flowing tails
      const bandanaGeo = new THREE.TorusGeometry(1.02, 0.2, 8, 16);
      const bandana = new THREE.Mesh(bandanaGeo, gearMat);
      bandana.rotation.x = Math.PI / 2.3;
      bandana.position.set(0, 0.42, 0);
      headGroup.add(bandana);

      // Bandana fluttering ribbons at the back
      const ribbonGeo = new THREE.ConeGeometry(0.24, 1.15, 6);
      const knot1 = new THREE.Mesh(ribbonGeo, gearMat);
      knot1.position.set(-0.35, 0.2, 1.05);
      knot1.rotation.x = -Math.PI / 3;
      headGroup.add(knot1);
      parts.knot1 = knot1;

      const knot2 = new THREE.Mesh(ribbonGeo, gearMat);
      knot2.position.set(0.35, 0.2, 1.05);
      knot2.rotation.x = -Math.PI / 3;
      headGroup.add(knot2);
      parts.knot2 = knot2;
    }

    group.add(headGroup);
    parts.head = headGroup;

    // 🎒 RANDOM BACK GEAR / HARNESS (4 Styles - Look fantastic from camera!)
    const backGearType = (Math.floor(index / 2) + index) % 4;

    if (backGearType === 0) {
      // 0. Cyber Jetpack / Power Backpack
      const jetpackGroup = new THREE.Group();
      jetpackGroup.position.set(0, 0.1, 1.0);

      const mainPack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.52), darkAccentMat);
      jetpackGroup.add(mainPack);

      const centerCell = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.2), gearMat);
      centerCell.position.set(0, 0, 0.26);
      jetpackGroup.add(centerCell);

      // Dual Mini Thrusters with neon nozzles
      [-0.42, 0.42].forEach(x => {
        const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 10), metalMat);
        thruster.position.set(x, -0.65, 0);
        jetpackGroup.add(thruster);

        const flameNozzle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), gearMat);
        flameNozzle.position.set(x, -0.92, 0);
        jetpackGroup.add(flameNozzle);
      });
      group.add(jetpackGroup);
      parts.backGear = jetpackGroup;

    } else if (backGearType === 1) {
      // 1. Pro Climbing Harness + Chalk Bag (Dây đai leo núi + Túi phấn hông)
      const harnessGroup = new THREE.Group();

      // Chest cross straps (X-Harness)
      const strapMat = darkAccentMat;
      const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.0, 0.08), strapMat);
      strap1.position.set(0, 0.1, 0.92);
      strap1.rotation.z = Math.PI / 5;
      harnessGroup.add(strap1);

      const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.0, 0.08), strapMat);
      strap2.position.set(0, 0.1, 0.92);
      strap2.rotation.z = -Math.PI / 5;
      harnessGroup.add(strap2);

      // Waist Belt
      const beltGeo = new THREE.TorusGeometry(1.15, 0.14, 8, 16);
      const belt = new THREE.Mesh(beltGeo, strapMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.set(0, -0.4, 0);
      harnessGroup.add(belt);

      // Metal Carabiner clips
      const clip = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 10), metalMat);
      clip.position.set(-0.95, -0.45, 0.6);
      clip.rotation.y = Math.PI / 3;
      harnessGroup.add(clip);

      // Chalk Bag hanging on back waist (wiggles during climb!)
      const chalkBag = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.55, 10), gearMat);
      chalkBag.position.set(0.35, -0.58, 1.05);
      chalkBag.rotation.z = 0.15;
      harnessGroup.add(chalkBag);
      parts.chalkBag = chalkBag;

      group.add(harnessGroup);

    } else if (backGearType === 2) {
      // 2. Cute Rounded Explorer Backpack (Balo phượt căng phồng)
      const packGroup = new THREE.Group();
      packGroup.position.set(0, 0.15, 0.95);

      const packBody = new THREE.Mesh(new THREE.SphereGeometry(0.82, 12, 10), gearMat);
      packBody.scale.set(0.9, 1.15, 0.65);
      packGroup.add(packBody);

      // Outer pocket
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.55, 0.35), darkAccentMat);
      pocket.position.set(0, -0.25, 0.45);
      packGroup.add(pocket);

      // Side water bottle
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.6, 8), metalMat);
      bottle.position.set(-0.72, -0.05, 0.15);
      bottle.rotation.z = 0.2;
      packGroup.add(bottle);

      group.add(packGroup);
      parts.backGear = packGroup;

    } else {
      // 3. Aero Racing Cape / Scarf (Khăn gió thể thao bay phất phới)
      const scarfGroup = new THREE.Group();
      scarfGroup.position.set(0, 1.05, 0.7);

      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 8, 16), gearMat);
      collar.rotation.x = Math.PI / 2.1;
      scarfGroup.add(collar);

      // Flowing Scarf / Cape tail
      const capeGeo = new THREE.BoxGeometry(0.8, 1.5, 0.08);
      capeGeo.translate(0, -0.75, 0);
      const cape = new THREE.Mesh(capeGeo, gearMat);
      cape.position.set(0, -0.15, 0.3);
      cape.rotation.x = Math.PI / 6;
      scarfGroup.add(cape);
      parts.cape = cape;

      group.add(scarfGroup);
    }

    // 3. Arms + Sport Wristbands
    const armGeo = new THREE.CylinderGeometry(0.24, 0.28, 1.5, 6);
    armGeo.translate(0, -0.65, 0);

    const armL = new THREE.Mesh(armGeo, furMat);
    armL.position.set(-1.2, 0.65, 0);
    armL.rotation.x = -Math.PI / 3;

    // Left Neon Wristband
    const wristbandL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.26, 8), gearMat);
    wristbandL.position.set(0, -1.05, 0);
    armL.add(wristbandL);

    group.add(armL);
    parts.armL = armL;

    const armR = new THREE.Mesh(armGeo, furMat);
    armR.position.set(1.2, 0.65, 0);
    armR.rotation.x = -Math.PI / 3;

    // Right Neon Wristband
    const wristbandR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.26, 8), gearMat);
    wristbandR.position.set(0, -1.05, 0);
    armR.add(wristbandR);

    group.add(armR);
    parts.armR = armR;

    // 4. Legs
    const legGeo = new THREE.CylinderGeometry(0.26, 0.28, 1.3, 6);
    legGeo.translate(0, -0.55, 0);

    const legL = new THREE.Mesh(legGeo, furMat);
    legL.position.set(-0.7, -0.85, 0);
    legL.rotation.x = Math.PI / 6;
    group.add(legL);
    parts.legL = legL;

    const legR = new THREE.Mesh(legGeo, furMat);
    legR.position.set(0.7, -0.85, 0);
    legR.rotation.x = Math.PI / 6;
    group.add(legR);
    parts.legR = legR;

    // 5. Tail
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.6, 0.9),
      new THREE.Vector3(0.2, -0.9, 1.6),
      new THREE.Vector3(-0.3, -0.4, 2.2),
      new THREE.Vector3(0, 0.2, 2.0)
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 12, 0.18, 6, false);
    const tail = new THREE.Mesh(tailGeo, furMat);
    group.add(tail);
    parts.tail = tail;

    // Scale monkey up to 1.45 (Bigger & clearer on screen!)
    group.scale.set(1.45, 1.45, 1.45);
    return { group, parts };
  }

  createNameSprite(name, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.roundRect(10, 10, 364, 76, 20);
    ctx.fill();

    ctx.strokeStyle = `#${color.getHexString()}`;
    ctx.lineWidth = 6;
    ctx.roundRect(10, 10, 364, 76, 20);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const displayName = name.length > 14 ? name.substring(0, 13) + '…' : name;
    ctx.fillText(displayName, 192, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(7.2, 1.8, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  startRace() {
    this.isRacing = true;
    this.raceStartTime = performance.now();
  }

  update(delta) {
    if (!this.isRacing) return;

    const scaledDelta = delta * this.speedMultiplier;
    const totalHeight = this.mountain.totalHeight;
    const maxSpan = this.mountain.climbWidth * 0.78;

    // 🌟 Real-time dynamic ranking for 80% Mid-pack churn & Top 10 final showdown!
    const activeClimbers = this.climbers.filter(c => !c.finished).sort((a, b) => b.y - a.y);
    const rankMap = new Map();
    activeClimbers.forEach((c, idx) => {
      rankMap.set(c.id, idx + 1);
    });

    const totalActive = activeClimbers.length;
    // 80% đàn khỉ tham gia vùng đổi top liên tục ở đoạn giữa
    const churn80Cutoff = Math.max(10, Math.ceil(totalActive * 0.80));

    const stage1Threshold = totalHeight * 0.25; // 0 -> 25%: Xuất phát cùng hàng, phân tách nhịp nhàng
    const stage3Threshold = totalHeight * 0.75; // 75% -> 100%: 1/4 chặng cuối kịch tính

    this.climbers.forEach(c => {
      if (c.finished) return;

      if (c.stunTimer > 0) {
        c.stunTimer -= scaledDelta;
        c.mesh.rotation.y += scaledDelta * 14;
        c.mesh.rotation.z += scaledDelta * 8;
        return;
      }

      const currentRank = rankMap.get(c.id) || 99;
      const isTop10 = currentRank <= 10;
      const isIn80Percent = currentRank <= churn80Cutoff;

      c.burstTimer -= scaledDelta;
      if (c.burstTimer <= 0) {
        if (c.y < stage1Threshold) {
          // 🚀 Stage 1 (0 -> 25%): Xuất phát từ cùng 1 hàng ngang, bám sát nhau leo lên
          c.burstTimer = 0.6 + Math.random() * 0.8;
          const surge = 0.88 + Math.random() * 0.32; // 0.88x to 1.20x
          c.currentSpeed = c.baseSpeed * surge;
          c.targetX += (Math.random() - 0.5) * 8;
          c.targetX = Math.max(-maxSpan, Math.min(maxSpan, c.targetX));

        } else if (c.y < stage3Threshold) {
          // 🌪️ Stage 2 (25% -> 75%: ĐOẠN GIỮA - 80% ĐÀN KHỈ THAY ĐỔI TOP LIÊN TỤC!)
          if (isIn80Percent) {
            // Chu kỳ bứt phá cực ngắn (0.35s - 0.70s) để thứ bậc nhảy liên hồi từng giây
            c.burstTimer = 0.35 + Math.random() * 0.35;

            if (currentRank <= 2) {
              // Hai chú khỉ tạm thời dẫn đầu chịu lực cản gió nhẹ (chững lại để tốp sau vượt lên)
              const surge = 0.78 + Math.random() * 0.28; // 0.78x - 1.06x
              c.currentSpeed = c.baseSpeed * surge;
            } else {
              // Các chú khỉ từ #3 đến 80% đàn: Nhận lực đẩy hút gió Slipstream vượt mặt liên hoàn!
              let surge = 1.15 + Math.random() * 0.60; // 1.15x - 1.75x!
              
              // Nếu bị con khỉ đứng ngay trước mình bỏ cách > 1.2m -> Kích hoạt xung lực đuổi bắt tức thì!
              const monkeyAhead = activeClimbers[currentRank - 2];
              if (monkeyAhead && (monkeyAhead.y - c.y) > 1.2) {
                surge += 0.35; // Bứt tốc vượt qua ngay lập tức!
              }
              c.currentSpeed = c.baseSpeed * surge;
            }

            // Đánh võng lách qua nhau tạo hiệu ứng cả đàn nhộn nhịp đổi ngôi
            c.targetX += (Math.random() - 0.5) * 14;
            c.targetX = Math.max(-maxSpan, Math.min(maxSpan, c.targetX));
          } else {
            // 20% nhóm sau duy trì nhịp leo đều
            c.burstTimer = 0.8 + Math.random() * 0.8;
            const surge = 0.75 + Math.random() * 0.40;
            c.currentSpeed = c.baseSpeed * surge;
            c.targetX += (Math.random() - 0.5) * 10;
            c.targetX = Math.max(-maxSpan, Math.min(maxSpan, c.targetX));
          }

        } else {
          // 🏁 Stage 3 (75% -> 100%: 1/4 CHẶNG CUỐI - TOP 10 SO KÈ NGHẸT THỞ TRANH NGÔI VƯƠNG!)
          if (isTop10) {
            // Chu kỳ bùng nổ siêu nhạy (0.30s - 0.65s)
            c.burstTimer = 0.30 + Math.random() * 0.35;

            if (currentRank === 1) {
              // #1 chịu áp lực đầu đàn và gió ngược cản bước
              const surge = 0.74 + Math.random() * 0.34; // 0.74x - 1.08x
              c.currentSpeed = c.baseSpeed * surge;
            } else if (currentRank <= 3) {
              // #2 và #3 so kè nghẹt thở
              const surge = 0.95 + Math.random() * 0.55; // 0.95x - 1.50x
              c.currentSpeed = c.baseSpeed * surge;
            } else {
              // #4 đến #10: DRAFTING SLIPSTREAM cực mạnh phóng lên cướp vị trí!
              const surge = 1.35 + Math.random() * 0.60; // 1.35x - 1.95x!
              c.currentSpeed = c.baseSpeed * surge;
            }

            // Đánh võng vượt mặt kịch tính
            c.targetX += (Math.random() - 0.5) * 16;
            c.targetX = Math.max(-maxSpan, Math.min(maxSpan, c.targetX));
          } else {
            // Nhóm sau duy trì nhịp
            c.burstTimer = 0.7 + Math.random() * 0.8;
            const surge = 0.75 + Math.random() * 0.50;
            c.currentSpeed = c.baseSpeed * surge;
            c.targetX += (Math.random() - 0.5) * 10;
            c.targetX = Math.max(-maxSpan, Math.min(maxSpan, c.targetX));
          }
        }
      }

      // Smooth horizontal drifting
      c.x += (c.targetX - c.x) * (2.0 * scaledDelta);
      c.x = Math.max(-maxSpan, Math.min(maxSpan, c.x));

      // Vertical progress
      c.y += c.currentSpeed * scaledDelta;

      // Hug cliff tightly
      c.z = this.mountain.getSurfaceZ(c.x, c.y) + 1.8;
      c.mesh.position.set(c.x, c.y, c.z);

      // Climbing animation
      c.climbCycle += scaledDelta * (c.currentSpeed * 1.5);
      const armSwing = Math.sin(c.climbCycle) * 0.65;
      const legSwing = Math.cos(c.climbCycle) * 0.5;
      
      c.parts.armL.rotation.x = -Math.PI / 3 + armSwing;
      c.parts.armR.rotation.x = -Math.PI / 3 - armSwing;
      c.parts.legL.rotation.x = Math.PI / 6 - legSwing;
      c.parts.legR.rotation.x = Math.PI / 6 + legSwing;
      c.parts.tail.rotation.z = Math.sin(c.climbCycle * 0.7) * 0.35;

      // Accessory physics & motion
      if (c.parts.cape) {
        c.parts.cape.rotation.x = Math.PI / 5 + Math.sin(c.climbCycle * 1.8) * 0.25;
      }
      if (c.parts.knot1) {
        c.parts.knot1.rotation.z = Math.sin(c.climbCycle * 1.5) * 0.2;
      }
      if (c.parts.knot2) {
        c.parts.knot2.rotation.z = -Math.sin(c.climbCycle * 1.5) * 0.2;
      }
      if (c.parts.chalkBag) {
        c.parts.chalkBag.rotation.z = 0.15 + Math.sin(c.climbCycle * 1.2) * 0.18;
      }
      if (c.parts.backGear) {
        c.parts.backGear.rotation.z = Math.sin(c.climbCycle * 0.8) * 0.06;
      }

      c.mesh.rotation.z = Math.sin(c.climbCycle * 0.5) * 0.1;
      c.mesh.rotation.y = 0;

      // Update name tag
      c.nameSprite.position.set(c.x, c.y + 3.8, c.z);

      // Check Obstacles (Active after ~18% chặng đua)
      if (c.y >= totalHeight * 0.18) {
        this.checkObstacleCollisions(c);
      }

      // Finish Line
      if (c.y >= totalHeight) {
        c.finished = true;
        c.finishTime = (performance.now() - this.raceStartTime) / 1000;
        c.y = totalHeight + 1.5;
        c.z = this.mountain.getSurfaceZ(c.x, c.y) + 1.8;
        c.mesh.position.set(c.x, c.y, c.z);
        c.nameSprite.position.set(c.x, c.y + 4.0, c.z);
        this.finishers.push(c);

        if (this.finishers.length === 1) {
          soundManager.playVictory();
        }
      }
    });

    this.optimizeNameTagVisibility();
  }

  checkObstacleCollisions(c) {
    for (const obs of this.mountain.obstacles) {
      if (obs.type === 'BANANA') {
        const dx = c.x - obs.x;
        const dy = c.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < obs.radius) {
          c.y += 15;
          c.currentSpeed = c.baseSpeed * 1.8;
          c.burstTimer = 2.0;
          soundManager.playBanana();
          obs.mesh.scale.set(1.6, 0.6, 1.6);
          setTimeout(() => obs.mesh.scale.set(1.2, 1.2, 1.2), 300);
          break;
        }
      } else if (obs.type === 'BOUNCE') {
        const dx = c.x - obs.x;
        const dy = c.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < obs.radius) {
          c.y += 18;
          c.currentSpeed = c.baseSpeed * 1.8;
          c.burstTimer = 2.0;
          soundManager.playBounce();
          break;
        }
      } else if (obs.type === 'WIND') {
        const dx = c.x - obs.x;
        const dy = c.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < obs.radius) {
          const maxSpan = this.mountain.climbWidth * 0.78;
          c.targetX = Math.max(-maxSpan, Math.min(maxSpan, c.targetX + obs.direction * 14));
          soundManager.playWind();
          break;
        }
      }
    }

    for (const b of this.mountain.boulders) {
      const dx = c.x - b.position.x;
      const dy = c.y - b.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3.2) {
        c.y = Math.max(this.mountain.totalHeight * 0.15, c.y - 12);
        c.stunTimer = 0.9;
        soundManager.playHit();
        break;
      }
    }
  }

  optimizeNameTagVisibility() {
    if (this.climbers.length <= 40) return;

    const sorted = [...this.climbers].sort((a, b) => b.y - a.y);
    const topCount = 20;

    sorted.forEach((c, index) => {
      if (index < topCount || c.isSelected) {
        c.nameSprite.visible = true;
      } else {
        c.nameSprite.visible = false;
      }
    });
  }

  getLeaderboard() {
    return [...this.climbers].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.y - a.y;
    });
  }

  getLeaders(count = 10) {
    const list = this.getLeaderboard();
    return list.slice(0, count);
  }
}
