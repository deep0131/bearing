const fs = require('fs');

function g(m, s) {
  const u = Math.random(), v = Math.random();
  return m + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * s;
}
function c(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function gen(n, label, cfg) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push([
      c(g(cfg[0][0], cfg[0][1]), cfg[0][2], cfg[0][3]).toFixed(4),
      c(g(cfg[1][0], cfg[1][1]), cfg[1][2], cfg[1][3]).toFixed(4),
      c(g(cfg[2][0], cfg[2][1]), cfg[2][2], cfg[2][3]).toFixed(4),
      c(g(cfg[3][0], cfg[3][1]), cfg[3][2], cfg[3][3]).toFixed(2),
      c(g(cfg[4][0], cfg[4][1]), cfg[4][2], cfg[4][3]).toFixed(4),
      c(g(cfg[5][0], cfg[5][1]), cfg[5][2], cfg[5][3]).toFixed(4),
      label
    ].join(','));
  }
  return rows;
}

const h = gen(3000, 'Healthy', [
  [1,0.12,0.7,1.5],[3,0.3,2,4.5],[3,0.4,2,5],[2,1.5,0,8],[1,0.15,0.5,1.8],[0.05,0.02,0.01,0.15]
]);
const d = gen(1200, 'Degraded', [
  [2.2,0.5,1.3,4],[4.5,0.6,3,7],[5.5,1.2,3.5,10],[12,4,4,25],[2.5,0.6,1.2,4.5],[0.25,0.08,0.08,0.5]
]);
const x = gen(800, 'Danger', [
  [4.5,1,3,8],[7,1.2,5,12],[12,3,7,25],[30,8,15,60],[5,1.5,3,10],[0.55,0.15,0.3,0.95]
]);

const all = [...h, ...d, ...x];
for (let i = all.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [all[i], all[j]] = [all[j], all[i]];
}

fs.mkdirSync('./data', { recursive: true });
const header = 'rms_norm,crest_factor,kurtosis,temperature_delta,freq_ratio,spectral_energy,label';
fs.writeFileSync('./data/bearing_health_dataset.csv', header + '\n' + all.join('\n'));
console.log('Done: ' + all.length + ' rows saved to ./data/bearing_health_dataset.csv');
