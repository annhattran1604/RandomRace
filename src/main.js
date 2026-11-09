import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { MountainScene } from './mountain.js';
import { ClimberManager } from './climbers.js';
import { CameraController } from './camera.js';
import { soundManager } from './sound.js';

// Default Sample Names
const SAMPLE_NAMES = [
  "Nguyễn Văn An", "Trần Thị Bích", "Lê Hoàng Nam", "Phạm Minh Tuấn",
  "Đỗ Quỳnh Chi", "Vũ Gia Bảo", "Hoàng Kim Ngân", "Đặng Quốc Huy",
  "Bùi Thị Mai", "Phan Anh Khoa", "Lý Hải Đăng", "Dương Ngọc Ánh",
  "Trịnh Văn Hùng", "Lâm Mỹ Duyên", "Mai Thế Vinh", "Cao Thùy Linh",
  "Trương Tấn Sang", "Đinh Tiến Đạt", "Hồ Bích Ngọc", "Tạ Quang Thắng"
];

class RaceApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.state = 'IDLE'; // 'IDLE', 'COUNTDOWN', 'RACING', 'FINISHED'
    
    this.initThree();
    this.initMountain();
    this.initUI();
    this.setupEventListeners();

    // Default setup
    this.loadNamesIntoInput(SAMPLE_NAMES);
    this.applyNewClimbers();

    // Animation Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7ec8f8); // Crisp bright alpine sky
    this.scene.fog = new THREE.FogExp2(0xbfe3f7, 0.00065); // Atmospheric depth for 800m+ spires

    this.camera = new THREE.PerspectiveCamera(
      65, // Ultra-wide perspective lens
      window.innerWidth / window.innerHeight,
      0.5,
      2800
    );
    this.camera.position.set(0, 18, 55);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Pixar/Game cinematic tone mapping
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initMountain() {
    this.mountain = new MountainScene(this.scene);
    this.climberManager = new ClimberManager(this.scene, this.mountain);
    this.cameraController = new CameraController(this.camera, this.renderer.domElement, this.mountain);
  }

  setTrackLength(val) {
    const len = parseInt(val, 10);
    if (!len || isNaN(len)) return;

    this.mountain.setTrackLength(len);

    const summitLabel = document.getElementById('meter-summit-label');
    if (summitLabel) {
      summitLabel.innerText = `🏆 ${len}m`;
    }

    const sel1 = document.getElementById('track-length-select');
    if (sel1 && sel1.value !== `${len}`) sel1.value = `${len}`;

    const sel2 = document.getElementById('modal-track-length-select');
    if (sel2 && sel2.value !== `${len}`) sel2.value = `${len}`;

    if (this.state === 'IDLE' || this.state === 'FINISHED') {
      this.applyNewClimbers();
    }
  }

  loadNamesIntoInput(names) {
    const textarea = document.getElementById('names-input');
    textarea.value = names.join('\n');
  }

  getNamesFromInput() {
    const text = document.getElementById('names-input').value;
    return text
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  }

  applyNewClimbers() {
    const names = this.getNamesFromInput();
    if (names.length === 0) return;

    // Apply duration setting
    const durationSelect = document.getElementById('duration-select');
    if (durationSelect) {
      const val = durationSelect.value;
      if (val === 'short') {
        this.climberManager.speedMultiplier = 1.6; // ~30s race
      } else if (val === 'long') {
        this.climberManager.speedMultiplier = 0.65; // ~80s dramatic race
      } else {
        this.climberManager.speedMultiplier = 1.0; // ~50s standard race
      }
    }

    this.climberManager.setupClimbers(names);
    this.updateLeaderboardUI();
    this.initAltitudeMeterUI();
  }

  initUI() {
    this.btnSound = document.getElementById('btn-sound');
    this.speedSelect = document.getElementById('speed-select');
    
    this.setupModal = document.getElementById('setup-modal');
    this.winnerModal = document.getElementById('winner-modal');
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');

    this.setupModal.classList.add('hidden');
  }

  setupEventListeners() {
    // Sound Button
    this.btnSound.addEventListener('click', () => {
      const on = soundManager.toggle();
      this.btnSound.innerText = on ? '🔊' : '🔇';
    });

    // Toggle Leaderboard HUD (Collapse/Expand)
    const leaderboardPanel = document.getElementById('leaderboard-panel');
    const btnToggleHud = document.getElementById('btn-toggle-hud');
    btnToggleHud.classList.add('active');

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
      leaderboardPanel.classList.add('collapsed');
      btnToggleHud.classList.remove('active');
    });

    btnToggleHud.addEventListener('click', () => {
      const isCollapsed = leaderboardPanel.classList.toggle('collapsed');
      btnToggleHud.classList.toggle('active', !isCollapsed);
    });

    // Speed Selector
    this.speedSelect.addEventListener('change', (e) => {
      this.climberManager.speedMultiplier = parseFloat(e.target.value);
    });

    // Track Length Selectors (Header & Modal)
    const trackSelect = document.getElementById('track-length-select');
    const modalTrackSelect = document.getElementById('modal-track-length-select');

    if (trackSelect) {
      trackSelect.addEventListener('change', (e) => {
        this.setTrackLength(e.target.value);
      });
    }

    if (modalTrackSelect) {
      modalTrackSelect.addEventListener('change', (e) => {
        this.setTrackLength(e.target.value);
      });
    }

    // Zoom Level Selector (0.6x Default)
    const zoomSelect = document.getElementById('zoom-select');
    if (zoomSelect) {
      zoomSelect.addEventListener('change', (e) => {
        if (e.target.value !== 'custom') {
          this.cameraController.setZoom(e.target.value);
        }
      });
    }

    // Setup Modal Triggers
    document.getElementById('btn-open-setup').addEventListener('click', () => {
      this.setupModal.classList.remove('hidden');
    });

    document.getElementById('btn-close-setup').addEventListener('click', () => {
      this.setupModal.classList.add('hidden');
    });

    document.getElementById('btn-cancel-setup').addEventListener('click', () => {
      this.setupModal.classList.add('hidden');
    });

    // Presets
    document.getElementById('btn-preset-20').addEventListener('click', () => {
      this.loadPreset(20);
    });
    document.getElementById('btn-preset-50').addEventListener('click', () => {
      this.loadPreset(50);
    });
    document.getElementById('btn-preset-100').addEventListener('click', () => {
      this.loadPreset(100);
    });
    document.getElementById('btn-clear-names').addEventListener('click', () => {
      document.getElementById('names-input').value = '';
    });

    // Start Button from Setup Modal
    document.getElementById('btn-start-race').addEventListener('click', () => {
      this.setupModal.classList.add('hidden');
      this.applyNewClimbers();
      this.triggerCountdownAndStart();
    });

    // Winner Modal Actions
    document.getElementById('btn-restart-race').addEventListener('click', () => {
      this.winnerModal.classList.add('hidden');
      soundManager.stopBGM();
      this.applyNewClimbers();
      this.triggerCountdownAndStart();
    });

    document.getElementById('btn-new-race').addEventListener('click', () => {
      this.winnerModal.classList.add('hidden');
      soundManager.stopBGM();
      this.setupModal.classList.remove('hidden');
    });

    document.getElementById('btn-copy-results').addEventListener('click', () => {
      this.copyResultsToClipboard();
    });
  }

  loadPreset(count) {
    const list = [];
    const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
    const midNames = ["Văn", "Thị", "Hải", "Minh", "Quỳnh", "Gia", "Thanh", "Ngọc", "Đức", "Anh", "Quốc", "Kim"];
    const lastNames = ["Nam", "An", "Bình", "Châu", "Duy", "Giang", "Hà", "Khánh", "Linh", "Mai", "Phúc", "Quân", "Sơn", "Trang", "Vy", "Yên"];

    for (let i = 1; i <= count; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const mn = midNames[Math.floor(Math.random() * midNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      list.push(`${fn} ${mn} ${ln} #${i}`);
    }
    this.loadNamesIntoInput(list);
  }

  // 🏁 Countdown that never lingers or blocks screen
  triggerCountdownAndStart() {
    this.state = 'COUNTDOWN';
    this.countdownOverlay.classList.remove('hidden');
    this.countdownText.className = '';
    
    let count = 3;
    this.countdownText.innerText = count;
    soundManager.playBeep(false);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        this.countdownText.innerText = count;
        soundManager.playBeep(false);
      } else if (count === 0) {
        clearInterval(timer);
        this.countdownText.innerText = "XUẤT PHÁT!";
        this.countdownText.className = 'go-text';
        soundManager.playBeep(true);

        // Immediately start race
        this.state = 'RACING';
        this.climberManager.startRace();
        soundManager.startBGM(); // Start cheerful racing BGM!

        // Quickly fade out and hide overlay in 400ms so view is 100% clean
        setTimeout(() => {
          this.countdownOverlay.classList.add('hidden');
        }, 450);
      }
    }, 850);
  }

  initAltitudeMeterUI() {
    const dotsContainer = document.getElementById('meter-dots');
    dotsContainer.innerHTML = '';
    
    this.climberManager.climbers.forEach(c => {
      const dot = document.createElement('div');
      dot.className = 'meter-dot';
      dot.id = `meter-dot-${c.id}`;
      dot.style.backgroundColor = `#${c.color.getHexString()}`;
      dot.style.bottom = '0%';
      dotsContainer.appendChild(dot);
    });
  }

  updateAltitudeMeterUI() {
    const totalHeight = this.mountain.totalHeight;
    this.climberManager.climbers.forEach(c => {
      const dot = document.getElementById(`meter-dot-${c.id}`);
      if (dot) {
        const pct = Math.max(0, Math.min(100, (c.y / totalHeight) * 100));
        dot.style.bottom = `${pct}%`;
      }
    });
  }

  updateLeaderboardUI() {
    const list = this.climberManager.getLeaderboard();
    const container = document.getElementById('leaderboard-list');
    document.getElementById('player-count-badge').innerText = `${list.length} người`;
    
    const topList = list.slice(0, 6); // Keep it compact (Top 6) to avoid blocking 3D view
    let html = '';

    topList.forEach((c, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : ''));
      const alt = Math.min(this.mountain.totalHeight, Math.round(c.y));
      const statusText = c.finished ? `🏁 ${c.finishTime.toFixed(1)}s` : `${alt}m`;

      html += `
        <div class="leaderboard-item ${rankClass}" data-climber-id="${c.id}">
          <div class="rank-badge">${rank}</div>
          <div class="player-dot" style="background-color: #${c.color.getHexString()}"></div>
          <div class="player-name">${c.name}</div>
          <div class="player-alt">${statusText}</div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach click to focus camera on individual monkey
    container.querySelectorAll('.leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        // Highlight in leaderboard
        container.querySelectorAll('.leaderboard-item').forEach(i => i.classList.remove('focused'));
        item.classList.add('focused');
      });
    });
  }

  checkRaceCompletion() {
    const finishers = this.climberManager.finishers;
    const totalClimbers = this.climberManager.climbers.length;

    const requiredFinishers = Math.min(3, totalClimbers);
    if (this.state === 'RACING' && finishers.length >= requiredFinishers) {
      this.state = 'FINISHED';
      this.showVictoryModal();
    }
  }

  showVictoryModal() {
    this.winnerModal.classList.remove('hidden');

    const duration = 4.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Podium Top 3
    const finishers = this.climberManager.finishers;
    if (finishers[0]) {
      document.getElementById('podium-name-1').innerText = finishers[0].name;
      document.getElementById('podium-time-1').innerText = `${finishers[0].finishTime.toFixed(1)}s`;
    }
    if (finishers[1]) {
      document.getElementById('podium-name-2').innerText = finishers[1].name;
      document.getElementById('podium-time-2').innerText = `${finishers[1].finishTime.toFixed(1)}s`;
    }
    if (finishers[2]) {
      document.getElementById('podium-name-3').innerText = finishers[2].name;
      document.getElementById('podium-time-3').innerText = `${finishers[2].finishTime.toFixed(1)}s`;
    }

    // Full results table
    const all = this.climberManager.getLeaderboard();
    const table = document.getElementById('full-results-list');
    let rowsHtml = '';
    all.forEach((c, i) => {
      const timeOrAlt = c.finished ? `Thời gian: ${c.finishTime.toFixed(2)}s` : `Độ cao: ${Math.round(c.y)}m`;
      rowsHtml += `
        <div class="result-row">
          <span><strong>#${i + 1}</strong> ${c.name}</span>
          <span style="color: var(--text-muted); font-size: 11px;">${timeOrAlt}</span>
        </div>
      `;
    });
    table.innerHTML = rowsHtml;
  }

  copyResultsToClipboard() {
    const all = this.climberManager.getLeaderboard();
    let text = `🏆 KẾT QUẢ CUỘC ĐUA KHỈ LEO NÚI 3D 🏆\n\n`;
    all.forEach((c, i) => {
      const stat = c.finished ? `${c.finishTime.toFixed(2)}s` : `${Math.round(c.y)}m`;
      text += `#${i + 1}. ${c.name} - ${stat}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("Đã sao chép kết quả vào bộ nhớ tạm (Clipboard)!");
    }).catch(() => {
      alert("Không thể sao chép tự động, vui lòng thử lại.");
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.mountain.update(delta);
    this.climberManager.update(delta);

    // Pass Top Leaders to CameraController for Lead Pack broadcast framing
    const leaders = this.climberManager.getLeaders(5);
    this.cameraController.update(delta, leaders);

    if (this.state === 'RACING') {
      this.updateLeaderboardUI();
      this.updateAltitudeMeterUI();
      this.checkRaceCompletion();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  new RaceApp();
});
