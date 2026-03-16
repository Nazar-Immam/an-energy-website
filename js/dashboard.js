/**
 * AN.Energy — Dashboard Controller
 * Industrial-grade monitoring dashboard with live-updating charts
 */

'use strict';

// ============================================================
// GLOBAL STATE
// ============================================================
const State = {
  windSpeed: 12,
  gridVoltage: 33,
  ambientTemp: 8,
  humidity: 72,
  loadDemand: 78,
  tick: 0,
  charts: {},
  turbines: [
    { id: 'T-01', status: 'green',  health: 96, rul: 2340, output: 4.8 },
    { id: 'T-02', status: 'green',  health: 91, rul: 1890, output: 4.6 },
    { id: 'T-03', status: 'amber',  health: 74, rul: 810,  output: 3.9 },
    { id: 'T-04', status: 'green',  health: 88, rul: 2100, output: 4.5 },
    { id: 'T-05', status: 'red',    health: 52, rul: 210,  output: 2.1 },
    { id: 'T-06', status: 'green',  health: 93, rul: 2200, output: 4.7 },
    { id: 'T-07', status: 'green',  health: 85, rul: 1750, output: 4.4 },
    { id: 'T-08', status: 'amber',  health: 68, rul: 620,  output: 3.5 },
    { id: 'T-09', status: 'green',  health: 97, rul: 2500, output: 4.9 },
    { id: 'T-10', status: 'green',  health: 90, rul: 1980, output: 4.6 },
    { id: 'T-11', status: 'green',  health: 82, rul: 1650, output: 4.3 },
    { id: 'T-12', status: 'amber',  health: 71, rul: 720,  output: 3.7 },
  ]
};

// ============================================================
// UTILITIES
// ============================================================
const rand = (min, max) => Math.random() * (max - min) + min;
const noise = (base, amp = 0.05) => base * (1 + rand(-amp, amp));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function genTimeSeries(n, base, amp, trend = 0) {
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += trend + rand(-amp, amp);
    v = clamp(v, base * 0.5, base * 1.5);
    out.push(+v.toFixed(2));
  }
  return out;
}

function last24hLabels() {
  const labels = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    labels.push(t.getHours().toString().padStart(2, '0') + ':00');
  }
  return labels;
}

function last30Labels() {
  const labels = [];
  for (let i = 29; i >= 0; i--) labels.push(`-${i}m`);
  return labels;
}

// ============================================================
// CHART DEFAULTS
// ============================================================
Chart.defaults.color = '#3a6080';
Chart.defaults.borderColor = 'rgba(0,229,255,0.08)';
Chart.defaults.font.family = "'Share Tech Mono', monospace";
Chart.defaults.font.size = 10;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.animation.duration = 400;

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(3,10,18,0.96)',
      borderColor: 'rgba(0,229,255,0.4)',
      borderWidth: 1,
      titleColor: '#00e5ff',
      bodyColor: '#7ab3d0',
      titleFont: { family: "'Share Tech Mono', monospace", size: 11 },
      bodyFont:  { family: "'Share Tech Mono', monospace", size: 10 },
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,229,255,0.05)', drawBorder: false },
      ticks: { color: '#3a6080', maxRotation: 0, font: { size: 9 } }
    },
    y: {
      grid: { color: 'rgba(0,229,255,0.05)', drawBorder: false },
      ticks: { color: '#3a6080', font: { size: 9 } }
    }
  }
};

function lineDS(label, data, color, fill = false) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: fill ? color.replace(')', ',0.12)').replace('rgb', 'rgba') : 'transparent',
    borderWidth: 1.5,
    pointRadius: 0,
    pointHoverRadius: 4,
    tension: 0.4,
    fill
  };
}

// ============================================================
// INIT CHARTS
// ============================================================
function initCharts() {
  initEnergyProductionChart();
  initEnergyLossChart();
  initDailyOutputChart();
  initRULChart();
  initFailureProbChart();
  initDegradationChart();
  initVoltageChart();
  initCurrentChart();
  initFrequencyChart();
  initPowerFactorChart();
  initWindSpeedChart();
  initTemperatureChart();
  initFFTChart();
  initVibrationChart();
  initMaintenanceCostChart();
  initGaugeCanvas();
  initWindRose();
}

// ——— Energy Production ———
function initEnergyProductionChart() {
  const ctx = document.getElementById('chartEnergyProd');
  if (!ctx) return;
  const labels = last24hLabels();
  const expected = genTimeSeries(24, 35, 3);
  const actual   = expected.map(v => v * noise(1, 0.08));
  State.charts.energyProd = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [
      lineDS('Expected', expected, '#0066ff', true),
      lineDS('Actual',   actual,   '#00e5ff', false),
    ]},
    options: { ...baseOptions,
      plugins: { ...baseOptions.plugins,
        legend: { display: true, labels: { color: '#7ab3d0', boxWidth: 12, font: { size: 9 } } }
      }
    }
  });
}

// ——— Energy Loss ———
function initEnergyLossChart() {
  const ctx = document.getElementById('chartEnergyLoss');
  if (!ctx) return;
  const labels = last24hLabels().filter((_, i) => i % 2 === 0);
  State.charts.energyLoss = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{
      label: 'Loss MWh',
      data: genTimeSeries(12, 2.5, 1.5),
      backgroundColor: 'rgba(255,51,85,0.5)',
      borderColor: '#ff3355',
      borderWidth: 1,
    }]},
    options: baseOptions
  });
}

// ——— Daily Output ———
function initDailyOutputChart() {
  const ctx = document.getElementById('chartDailyOutput');
  if (!ctx) return;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  State.charts.dailyOutput = new Chart(ctx, {
    type: 'bar',
    data: { labels: days, datasets: [{
      data: [820, 795, 840, 780, 855, 910, 870],
      backgroundColor: days.map((_, i) => i === 5 ? 'rgba(0,255,136,0.6)' : 'rgba(0,229,255,0.35)'),
      borderColor: days.map((_, i) => i === 5 ? '#00ff88' : '#00e5ff'),
      borderWidth: 1,
    }]},
    options: { ...baseOptions, scales: { ...baseOptions.scales,
      y: { ...baseOptions.scales.y, ticks: { ...baseOptions.scales.y.ticks, callback: v => v + ' MWh' } }
    }}
  });
}

// ——— RUL Graph ———
function initRULChart() {
  const ctx = document.getElementById('chartRUL');
  if (!ctx) return;
  const labels = Array.from({length: 30}, (_, i) => `+${i * 30}d`);
  const rul = [];
  for (let i = 0; i < 30; i++) rul.push(Math.max(0, 2500 - i * 90 + rand(-30, 30)));
  State.charts.rul = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [
      lineDS('RUL (hours)', rul, '#00ff88', true),
      { label: 'Threshold', data: Array(30).fill(500), borderColor: '#ff3355', borderWidth: 1, borderDash: [4,4], pointRadius: 0, tension: 0 }
    ]},
    options: { ...baseOptions }
  });
}

// ——— Failure Probability ———
function initFailureProbChart() {
  const ctx = document.getElementById('chartFailureProb');
  if (!ctx) return;
  const labels = Array.from({length:20}, (_,i) => `+${i*15}d`);
  const prob = labels.map((_, i) => clamp(2 + i * 0.8 + rand(-0.5, 0.5), 0, 95));
  State.charts.failureProb = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [lineDS('Failure %', prob, '#ffaa00', true)] },
    options: baseOptions
  });
}

// ——— Degradation Curve ———
function initDegradationChart() {
  const ctx = document.getElementById('chartDegradation');
  if (!ctx) return;
  const labels = Array.from({length:25}, (_,i) => `${i} mo`);
  const deg = labels.map((_, i) => 100 - (i * 1.8 + rand(0, 1)));
  State.charts.degradation = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [
      lineDS('Health %', deg, '#00e5ff', true),
      { label: 'Failure Zone', data: Array(25).fill(60), borderColor: '#ff3355', borderWidth: 1, borderDash: [3,3], pointRadius: 0 }
    ]},
    options: baseOptions
  });
}

// ——— Voltage ———
function initVoltageChart() {
  const ctx = document.getElementById('chartVoltage');
  if (!ctx) return;
  const labels = last30Labels();
  State.charts.voltage = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [lineDS('kV', genTimeSeries(30, 33, 0.3), '#00e5ff')] },
    options: baseOptions
  });
}

// ——— Current ———
function initCurrentChart() {
  const ctx = document.getElementById('chartCurrent');
  if (!ctx) return;
  State.charts.current = new Chart(ctx, {
    type: 'line',
    data: { labels: last30Labels(), datasets: [lineDS('A', genTimeSeries(30, 420, 15), '#00ff88')] },
    options: baseOptions
  });
}

// ——— Frequency ———
function initFrequencyChart() {
  const ctx = document.getElementById('chartFrequency');
  if (!ctx) return;
  State.charts.frequency = new Chart(ctx, {
    type: 'line',
    data: { labels: last30Labels(), datasets: [lineDS('Hz', genTimeSeries(30, 50, 0.08), '#9b59ff')] },
    options: baseOptions
  });
}

// ——— Power Factor ———
function initPowerFactorChart() {
  const ctx = document.getElementById('chartPowerFactor');
  if (!ctx) return;
  State.charts.powerFactor = new Chart(ctx, {
    type: 'line',
    data: { labels: last30Labels(), datasets: [lineDS('PF', genTimeSeries(30, 0.96, 0.02), '#ffaa00')] },
    options: { ...baseOptions, scales: { ...baseOptions.scales,
      y: { ...baseOptions.scales.y, min: 0.85, max: 1.0 }
    }}
  });
}

// ——— Wind Speed ———
function initWindSpeedChart() {
  const ctx = document.getElementById('chartWindSpeed');
  if (!ctx) return;
  State.charts.windSpeed = new Chart(ctx, {
    type: 'line',
    data: { labels: last24hLabels(), datasets: [lineDS('m/s', genTimeSeries(24, 12, 2, 0.02), '#44aaff', true)] },
    options: baseOptions
  });
}

// ——— Temperature ———
function initTemperatureChart() {
  const ctx = document.getElementById('chartTemperature');
  if (!ctx) return;
  State.charts.temperature = new Chart(ctx, {
    type: 'line',
    data: { labels: last24hLabels(), datasets: [lineDS('°C', genTimeSeries(24, 8, 1.5, 0.05), '#ff6644', true)] },
    options: baseOptions
  });
}

// ——— FFT Spectrum ———
function initFFTChart() {
  const ctx = document.getElementById('chartFFT');
  if (!ctx) return;
  const freqs = Array.from({length:50}, (_,i) => `${i * 10}Hz`);
  const spectrum = freqs.map((_, i) => {
    let v = rand(0.05, 0.3);
    if (i === 5) v = 2.1;   // fundamental
    if (i === 10) v = 1.4;  // 2nd harmonic
    if (i === 15) v = 0.8;  // 3rd
    if (i === 20) v = 0.5;  // 4th
    return +v.toFixed(3);
  });
  State.charts.fft = new Chart(ctx, {
    type: 'bar',
    data: { labels: freqs, datasets: [{
      data: spectrum,
      backgroundColor: spectrum.map(v => v > 1 ? 'rgba(255,51,85,0.6)' : 'rgba(0,229,255,0.4)'),
      borderColor: spectrum.map(v => v > 1 ? '#ff3355' : '#00e5ff'),
      borderWidth: 1,
    }]},
    options: { ...baseOptions, scales: { ...baseOptions.scales,
      x: { ...baseOptions.scales.x, ticks: { maxTicksLimit: 10, font: { size: 8 } } }
    }}
  });
}

// ——— Vibration ———
function initVibrationChart() {
  const ctx = document.getElementById('chartVibration');
  if (!ctx) return;
  const labels = Array.from({length:100}, (_,i) => i.toString());
  const sig = labels.map(i => {
    const t = +i * 0.1;
    return +(Math.sin(t * 3.14) * 0.8 + Math.sin(t * 9.42) * 0.3 + rand(-0.15, 0.15)).toFixed(3);
  });
  State.charts.vibration = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [lineDS('g', sig, '#9b59ff')] },
    options: { ...baseOptions, scales: { ...baseOptions.scales,
      x: { ...baseOptions.scales.x, ticks: { maxTicksLimit: 8 } }
    }}
  });
}

// ——— Maintenance Cost ———
function initMaintenanceCostChart() {
  const ctx = document.getElementById('chartMaintCost');
  if (!ctx) return;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  State.charts.maintCost = new Chart(ctx, {
    type: 'bar',
    data: { labels: months, datasets: [
      { label: 'Reactive', data: [45,52,38,61,44,55,40,48,35,42,50,38], backgroundColor: 'rgba(255,51,85,0.4)', borderColor: '#ff3355', borderWidth: 1 },
      { label: 'Predictive', data: [18,15,20,17,16,14,19,15,17,13,16,15], backgroundColor: 'rgba(0,255,136,0.4)', borderColor: '#00ff88', borderWidth: 1 },
    ]},
    options: { ...baseOptions,
      plugins: { ...baseOptions.plugins,
        legend: { display: true, labels: { color: '#7ab3d0', boxWidth: 12, font: { size: 9 } } }
      }
    }
  });
}

// ——— Health Gauge ———
function initGaugeCanvas() {
  const canvas = document.getElementById('gaugeCanvas');
  if (!canvas) return;
  drawGauge(canvas, 83, '#00e5ff');
}

function drawGauge(canvas, value, color) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h * 0.62;
  const r = Math.min(w, h) * 0.42;
  ctx.clearRect(0, 0, w, h);

  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const valueAngle = startAngle + (endAngle - startAngle) * (value / 100);

  // Track bg
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(0,229,255,0.1)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Value arc
  const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  grad.addColorStop(0, '#0066ff');
  grad.addColorStop(0.5, '#00e5ff');
  grad.addColorStop(1, '#00ff88');
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, valueAngle);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / 10);
    const inner = r - 16;
    const outer = r - 4;
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
    ctx.lineTo(cx + outer * Math.cos(angle), cy + outer * Math.sin(angle));
    ctx.strokeStyle = 'rgba(0,229,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Center text
  ctx.font = `bold 28px 'Orbitron', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.fillText(value + '%', cx, cy);
  ctx.shadowBlur = 0;

  ctx.font = `10px 'Share Tech Mono', monospace`;
  ctx.fillStyle = '#3a6080';
  ctx.fillText('FLEET HEALTH', cx, cy + 28);
}

// ——— Wind Rose ———
function initWindRose() {
  const canvas = document.getElementById('windRoseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const directions = ['N','NE','E','SE','S','SW','W','NW'];
  const values = [22, 14, 8, 11, 18, 24, 12, 16];
  const maxVal = Math.max(...values);
  const r = Math.min(w, h) * 0.38;

  // Grid circles
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (i / 4), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,229,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Petals
  const colors = ['rgba(0,229,255,0.5)', 'rgba(0,102,255,0.5)'];
  values.forEach((v, i) => {
    const angle = (i * Math.PI * 2 / directions.length) - Math.PI / 2;
    const len = r * (v / maxVal);
    const spread = Math.PI / directions.length * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + len * Math.cos(angle - spread), cy + len * Math.sin(angle - spread));
    ctx.arc(cx, cy, len, angle - spread, angle + spread);
    ctx.lineTo(cx, cy);
    const grad = ctx.createLinearGradient(cx, cy, cx + len * Math.cos(angle), cy + len * Math.sin(angle));
    grad.addColorStop(0, 'rgba(0,102,255,0.1)');
    grad.addColorStop(1, i % 2 === 0 ? 'rgba(0,229,255,0.7)' : 'rgba(0,255,136,0.6)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  // Direction labels
  ctx.font = `10px 'Share Tech Mono', monospace`;
  ctx.fillStyle = '#3a6080';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  directions.forEach((d, i) => {
    const angle = (i * Math.PI * 2 / directions.length) - Math.PI / 2;
    const lr = r + 16;
    ctx.fillText(d, cx + lr * Math.cos(angle), cy + lr * Math.sin(angle));
  });
}

// ============================================================
// FLEET MAP (Canvas)
// ============================================================
function initFleetMap() {
  const canvas = document.getElementById('fleetMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  renderFleetMap(ctx, canvas.width, canvas.height);
}

function renderFleetMap(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);

  // Background gradient (sea)
  const bgGrad = ctx.createRadialGradient(w*0.5, h*0.6, 0, w*0.5, h*0.5, w*0.8);
  bgGrad.addColorStop(0, 'rgba(0,40,80,0.6)');
  bgGrad.addColorStop(1, 'rgba(2,5,8,0.2)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,229,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Range rings from center
  const cx = w * 0.5, cy = h * 0.5;
  for (let r = 40; r < Math.max(w, h); r += 60) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,229,255,0.04)';
    ctx.stroke();
  }

  // Turbine positions (3x4 grid layout, roughly)
  const positions = [
    [0.2, 0.25], [0.38, 0.20], [0.56, 0.22], [0.75, 0.25],
    [0.18, 0.48], [0.36, 0.45], [0.54, 0.48], [0.72, 0.50],
    [0.22, 0.70], [0.40, 0.68], [0.58, 0.72], [0.76, 0.70],
  ];

  const statusColor = { green: '#00ff88', amber: '#ffaa00', red: '#ff3355' };
  const glowColor   = { green: 'rgba(0,255,136,0.4)', amber: 'rgba(255,170,0,0.4)', red: 'rgba(255,51,85,0.4)' };

  positions.forEach(([px, py], i) => {
    const turbine = State.turbines[i];
    if (!turbine) return;
    const x = px * w, y = py * h;
    const sc = statusColor[turbine.status];
    const gc = glowColor[turbine.status];

    // Pulse ring (animated via state.tick)
    const pulse = 0.6 + 0.4 * Math.sin(State.tick * 0.08 + i * 0.8);
    ctx.beginPath();
    ctx.arc(x, y, 12 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = gc;
    ctx.fill();

    // Connection lines
    if (i < positions.length - 1) {
      const [nx, ny] = positions[i + 1];
      if (Math.floor(i / 4) === Math.floor((i + 1) / 4)) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx * w, ny * h);
        ctx.strokeStyle = 'rgba(0,229,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Turbine dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = sc;
    ctx.shadowBlur = 10;
    ctx.shadowColor = sc;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    ctx.font = `8px 'Share Tech Mono', monospace`;
    ctx.fillStyle = '#7ab3d0';
    ctx.textAlign = 'center';
    ctx.fillText(turbine.id, x, y + 16);
  });

  // Wind direction arrow
  drawWindArrow(ctx, w * 0.88, h * 0.12, State.windSpeed);
}

function drawWindArrow(ctx, x, y, speed) {
  const angle = -Math.PI * 0.3;
  const len = 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.lineTo(0, len);
  ctx.lineTo(-6, len - 10);
  ctx.moveTo(0, len);
  ctx.lineTo(6, len - 10);
  ctx.strokeStyle = '#44aaff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.font = `9px 'Share Tech Mono', monospace`;
  ctx.fillStyle = '#44aaff';
  ctx.textAlign = 'center';
  ctx.fillText(`${speed.toFixed(1)} m/s`, x, y + 36);
}

// ============================================================
// LIVE UPDATE LOOP
// ============================================================
function startLiveUpdates() {
  setInterval(() => {
    State.tick++;
    updateLiveCharts();
    updateMetrics();
    updateFleetMapAnim();
    updateClock();
  }, 2000);
}

function updateLiveCharts() {
  // Voltage
  if (State.charts.voltage) {
    const ds = State.charts.voltage.data.datasets[0];
    ds.data.shift();
    ds.data.push(+(noise(State.gridVoltage, 0.008)).toFixed(2));
    State.charts.voltage.update('none');
  }
  // Current
  if (State.charts.current) {
    const ds = State.charts.current.data.datasets[0];
    ds.data.shift();
    ds.data.push(+(noise(420 * (State.loadDemand / 78), 0.02)).toFixed(1));
    State.charts.current.update('none');
  }
  // Frequency
  if (State.charts.frequency) {
    const ds = State.charts.frequency.data.datasets[0];
    ds.data.shift();
    ds.data.push(+(noise(50, 0.003)).toFixed(3));
    State.charts.frequency.update('none');
  }
  // Power Factor
  if (State.charts.powerFactor) {
    const ds = State.charts.powerFactor.data.datasets[0];
    ds.data.shift();
    ds.data.push(+clamp(noise(0.96, 0.01), 0.86, 1.0).toFixed(3));
    State.charts.powerFactor.update('none');
  }
  // Wind Speed chart
  if (State.charts.windSpeed) {
    const ds = State.charts.windSpeed.data.datasets[0];
    ds.data.shift();
    ds.data.push(+(noise(State.windSpeed, 0.08)).toFixed(1));
    State.charts.windSpeed.update('none');
  }
}

function updateFleetMapAnim() {
  const canvas = document.getElementById('fleetMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  renderFleetMap(ctx, canvas.width, canvas.height);
}

function updateMetrics() {
  const totalOutput = State.turbines.reduce((s, t) => s + t.output, 0);
  const efficiency = (State.windSpeed > 3 && State.windSpeed < 25)
    ? clamp(noise(85 + State.windSpeed, 0.03), 60, 99) : 30;

  setMetric('metricTotalPower', totalOutput.toFixed(1) + ' MW');
  setMetric('metricEfficiency', efficiency.toFixed(1) + '%');
  setMetric('metricWindNow', State.windSpeed.toFixed(1) + ' m/s');
  setMetric('metricGridFreq', (noise(50, 0.002)).toFixed(3) + ' Hz');
  setMetric('metricCapFactor', clamp(noise(42, 0.05), 30, 65).toFixed(1) + '%');
  setMetric('metricCostAvoided', '£' + (noise(142000, 0.02)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
}

function setMetric(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateClock() {
  const el = document.getElementById('navTime');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toUTCString().slice(17, 25) + ' UTC';
}

// ============================================================
// SLIDER SIMULATION CONTROLS
// ============================================================
function initSliders() {
  const sliders = [
    { id: 'sliderWind',     stateKey: 'windSpeed',   min: 0,  max: 25,  unit: 'm/s', decimals: 1 },
    { id: 'sliderVoltage',  stateKey: 'gridVoltage', min: 28, max: 38,  unit: 'kV',  decimals: 1 },
    { id: 'sliderTemp',     stateKey: 'ambientTemp', min: -10, max: 35, unit: '°C',  decimals: 1 },
    { id: 'sliderHumidity', stateKey: 'humidity',    min: 20, max: 100, unit: '%',   decimals: 0 },
    { id: 'sliderLoad',     stateKey: 'loadDemand',  min: 10, max: 100, unit: '%',   decimals: 0 },
  ];

  sliders.forEach(({ id, stateKey, min, max, unit, decimals }) => {
    const slider = document.getElementById(id);
    const valueEl = document.getElementById(id + 'Val');
    if (!slider) return;

    slider.min = min;
    slider.max = max;
    slider.value = State[stateKey];

    updateSliderTrack(slider);

    slider.addEventListener('input', () => {
      State[stateKey] = +slider.value;
      if (valueEl) valueEl.textContent = (+slider.value).toFixed(decimals) + ' ' + unit;
      updateSliderTrack(slider);
      onSimulationChange();
    });

    if (valueEl) valueEl.textContent = State[stateKey].toFixed(decimals) + ' ' + unit;
  });
}

function updateSliderTrack(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--pct', pct + '%');
}

function onSimulationChange() {
  // Bulk update charts based on new simulation values
  const windFactor = State.windSpeed / 12;
  const loadFactor = State.loadDemand / 78;

  // Energy production
  if (State.charts.energyProd) {
    const ds = State.charts.energyProd.data.datasets;
    ds[0].data = genTimeSeries(24, 35 * windFactor, 3);
    ds[1].data = ds[0].data.map(v => v * noise(1, 0.08));
    State.charts.energyProd.update();
  }

  // Daily output
  if (State.charts.dailyOutput) {
    State.charts.dailyOutput.data.datasets[0].data =
      [820, 795, 840, 780, 855, 910, 870].map(v => Math.round(v * windFactor));
    State.charts.dailyOutput.update();
  }

  // Current
  if (State.charts.current) {
    State.charts.current.data.datasets[0].data =
      genTimeSeries(30, 420 * loadFactor, 15 * loadFactor);
    State.charts.current.update();
  }

  // Update turbine outputs
  State.turbines.forEach(t => {
    if (t.status !== 'red') {
      t.output = +(noise(5 * windFactor * (t.health / 100), 0.05)).toFixed(1);
    }
  });

  // RUL impact based on load
  if (State.charts.rul) {
    const base = 2500 / loadFactor;
    State.charts.rul.data.datasets[0].data =
      Array.from({length:30}, (_,i) => Math.max(0, base - i * 90 / loadFactor + rand(-30,30)));
    State.charts.rul.update();
  }
}

// ============================================================
// FAULT TICKER
// ============================================================
const FAULT_MESSAGES = [
  'T-05 Gearbox Bearing — Abnormal vibration signature detected (8.2g)',
  'T-03 Converter — DC link voltage ripple exceeding 5% threshold',
  'T-08 Blade pitch actuator — Response time degraded 340ms → 890ms',
  'T-12 Main transformer — Partial discharge event log entry #0x4A2F',
  'T-05 Generator — Winding insulation resistance dropped to 42 MΩ',
  'Fleet-wide — Wind gust event 23.4 m/s — Curtailment protocol active',
  'T-03 Yaw drive — Misalignment error ±4.8° (threshold: ±3.0°)',
];

let faultIdx = 0;
function startFaultFeed() {
  const list = document.getElementById('faultList');
  if (!list) return;

  function addFault() {
    const f = FAULT_MESSAGES[faultIdx % FAULT_MESSAGES.length];
    faultIdx++;
    const now = new Date();
    const time = now.toTimeString().slice(0,8);
    const severity = faultIdx % 4 === 0 ? 'red' : faultIdx % 3 === 0 ? 'amber' : 'green';
    const icon = { red: '⚠', amber: '◉', green: '◎' }[severity];
    const color = { red: 'var(--red)', amber: 'var(--amber)', green: 'var(--green)' }[severity];

    const item = document.createElement('div');
    item.className = 'fault-item';
    item.innerHTML = `
      <div class="fault-icon" style="color:${color}">${icon}</div>
      <div class="fault-code" style="color:${color}">${f.split(' ')[0]} ${f.split(' ')[1]}</div>
      <div style="flex:1;color:var(--text-muted);font-size:9px">${f.split('—')[1]?.trim() || ''}</div>
      <div class="fault-time">${time}</div>
    `;

    if (list.children.length >= 5) list.removeChild(list.lastChild);
    list.insertBefore(item, list.firstChild);
  }

  addFault();
  setInterval(addFault, 8000);
}

// ============================================================
// OBSERVER FOR ANIMATIONS
// ============================================================
function initScrollObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
}

// ============================================================
// FUNDING ANIMATION
// ============================================================
function initFunding() {
  const fill = document.getElementById('fundingFill');
  if (!fill) return;
  const targetPct = 8;
  setTimeout(() => {
    fill.style.width = targetPct + '%';
  }, 500);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  initCharts();
  initFleetMap();
  initSliders();
  startLiveUpdates();
  startFaultFeed();
  initScrollObserver();
  initFunding();

  // Resize fleet map on window resize
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('fleetMapCanvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  });

  // Populate turbine sidebar
  updateTurbineSidebar();
});

function updateTurbineSidebar() {
  const container = document.getElementById('turbineMiniList');
  if (!container) return;
  container.innerHTML = State.turbines.map(t => `
    <div class="turbine-mini-item">
      <span>${t.id}</span>
      <span style="color:var(--text-primary);font-size:11px">${t.output} MW</span>
      <div class="turbine-mini-status status-${t.status}"></div>
    </div>
  `).join('');
}
