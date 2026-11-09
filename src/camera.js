import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement, mountain) {
    this.camera = camera;
    this.domElement = domElement;
    this.mountain = mountain;

    // Default Zoom Level: 0.6x (Góc nhìn siêu rộng - Ultra-Wide)
    this.zoomLevel = 0.6; 
    this.smoothY = 15;

    // Mouse wheel to adjust zoom freely on the fly (from 0.4x to 1.5x)
    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.0008;
      this.zoomLevel = Math.max(0.4, Math.min(1.4, this.zoomLevel + zoomDelta));
      const zoomSelect = document.getElementById('zoom-select');
      if (zoomSelect) {
        zoomSelect.value = "custom";
      }
    }, { passive: false });
  }

  setZoom(val) {
    this.zoomLevel = parseFloat(val);
  }

  update(delta, leaders) {
    // 🎥 LEAD PACK BROADCAST (0.6x ULTRA-WIDE PERSPECTIVE)
    let targetY = 15;
    if (leaders && leaders.length > 0) {
      // Frame top 8 leaders
      const topN = leaders.slice(0, Math.min(8, leaders.length));
      let sumY = 0;
      topN.forEach(c => sumY += c.y);
      targetY = sumY / topN.length;
    }

    // Smooth continuous vertical tracking
    const smoothFactor = Math.min(1.0, 2.4 * delta);
    this.smoothY += (targetY - this.smoothY) * smoothFactor;

    const targetSlopeZ = this.mountain.getSurfaceZ(0, this.smoothY);

    // 0.6x Ultra-Wide formula:
    // Base 1.0x distance is ~42; at 0.6x, distance scales out to ~70
    // Camera is elevated higher to see the entire pack spread across the cliff!
    const distanceScale = (1.0 / this.zoomLevel);
    const camDistZ = 42 * distanceScale;
    const camElevY = 8 * distanceScale;

    const camY = this.smoothY + camElevY;
    const camZ = targetSlopeZ + camDistZ;

    this.camera.position.set(0, camY, camZ);
    // Looking uphill at the pack and the track ahead
    this.camera.lookAt(0, this.smoothY + 4, targetSlopeZ);
  }
}
