const canvas = document.getElementById("debris");
const ctx = canvas.getContext("2d");
const space = document.getElementById("space");
const startBtn = document.getElementById("start-btn");
const menu = document.getElementById("menu");
const dialog = document.getElementById("dialog");
const dialogText = document.getElementById("dialog-text");
const counter = document.getElementById("counter");
const countSat = document.getElementById("count-sat");
const popup = document.getElementById("popup");
const popupAlias = document.getElementById("popup-alias");
const popupFlag = document.getElementById("popup-flag");
const popupCountryOG = document.getElementById("popup-CountryOG");
const popupPurpose = document.getElementById("popup-Purpose");
const popupYears = document.getElementById("popup-years");
const popupUsers = document.getElementById("popup-users");
const popupClose = document.getElementById("popup-close");

const popupCollision = document.getElementById("popup-collision");
const popupCollisionClose = document.getElementById("popup-collision-close");
const collisionAlias1 = document.getElementById("collision-alias-1");
const collisionFlag1 = document.getElementById("collision-flag-1");
const collisionCountry1 = document.getElementById("collision-country-1");
const collisionPurpose1 = document.getElementById("collision-purpose-1");
const collisionYear1 = document.getElementById("collision-year-1");
const collisionAlias2 = document.getElementById("collision-alias-2");
const collisionFlag2 = document.getElementById("collision-flag-2");
const collisionCountry2 = document.getElementById("collision-country-2");
const collisionPurpose2 = document.getElementById("collision-purpose-2");
const collisionYear2 = document.getElementById("collision-year-2");

const timeControl = document.getElementById("time-control");
const currentYearDisplay = document.getElementById("current-year");
const timeToggleBtn = document.getElementById("time-toggle");
const speedSlow = document.getElementById("speed-slow");
const speedNormal = document.getElementById("speed-normal");
const speedFast = document.getElementById("speed-fast");

const satellitePanel = document.getElementById("satellite-panel");
const panelToggle = document.getElementById("panel-toggle");
const panelDropdown = document.getElementById("panel-dropdown");
const panelList = document.getElementById("panel-list");

let gameStarted = false;
let meteor = null;
let satellites = [];
let satellitesData = [];
let availableSatellites = [];
let usedIndices = [];
let destroyedCount = 0;
let debrisParticles = [];
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
const MAX_SATELLITES = 8;

let currentYear = 2020;
let timeSpeed = 5;
let lastTimeUpdate = Date.now();
let isTimePaused = false;

function resize(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);

const rocks = [];
function rand(min, max){ return Math.random() * (max - min) + min; }

function makeRock(){
  const r = rand(6, 28);
  const x = rand(0, canvas.clientWidth);
  const y = rand(0, canvas.clientHeight);
  const vx = rand(-0.2, 0.2);
  const vy = rand(0.1, 0.6);

  const points = [];
  const n = Math.floor(rand(7, 12));
  for (let i=0; i<n; i++){
    const ang = (i / n) * Math.PI * 2;
    const jitter = rand(0.65, 1.25);
    points.push({ 
      x: Math.cos(ang) * r * jitter,
      y: Math.sin(ang) * r * jitter
    });
  }

  return {
    x, y, r,
    vx: rand(-0.15, 0.15),
    vy: rand(0.25, 0.75),
    baseVy: rand(0.25, 0.75), // kecepatan jatuh “normal”
    rot: rand(0, Math.PI*2),
    vr: rand(-0.01, 0.01),
    points,
    shade: rand(0.25, 0.55)
  };
}

function seed(count=50){
  rocks.length = 0;
  for(let i=0;i<count;i++) rocks.push(makeRock());
}

function drawRock(rock){
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.rotate(rock.rot);

  const base = Math.floor(rock.shade * 255);
  ctx.fillStyle = `rgb(${base},${base},${base + 15})`;
  ctx.strokeStyle = `rgba(255,255,255,0.06)`;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(rock.points[0].x, rock.points[0].y);
  for (let i=1;i<rock.points.length;i++){
    ctx.lineTo(rock.points[i].x, rock.points[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(-rock.r*0.2, -rock.r*0.25, rock.r*0.35, rock.r*0.25, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function createMeteor() {
  const r = 25;
  const points = [];
  const n = 10;
  for (let i=0; i<n; i++){
    const ang = (i / n) * Math.PI * 2;
    const jitter = rand(0.7, 1.2);
    points.push({ 
      x: Math.cos(ang) * r * jitter,
      y: Math.sin(ang) * r * jitter
    });
  }
  
  return {
    x: canvas.clientWidth / 2,
    y: canvas.clientHeight / 2,
    r: r,
    vx: 0,
    vy: 0,
    rot: 0,
    vr: 0.02,
    points: points,
    mass: 5
  };
}

function createSatellite(x, y, data, index) {
  let LaunchYear = 'Unknown';
  
  if (data.Released) {
    LaunchYear = data.Released;
  } else if (data.LaunchYear) {
    LaunchYear = data.LaunchYear;
  } 
  else if (data["Date of Launch"]) {
    const dateStr = data["Date of Launch"].toString().trim();
    const dateParts = dateStr.split('/');
    if (dateParts.length === 3) {
      LaunchYear = dateParts[2];
    }
  }
  
  const launchYearNum = parseInt(LaunchYear) || currentYear;
  const lifetimeYears = parseFloat(data["Expected Lifetime (yrs.)"]) || 10;
  const expiryYear = launchYearNum + lifetimeYears;
  
  return {
    x: x,
    y: y,
    r: 20,
    vx: rand(-0.3, 0.3),
    vy: rand(-0.3, 0.3),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.02, 0.02),
    Alias: data.Alias || data["Name of Satellite, Alternate Names"] || 'Unknown Satellite',
    CountryOG: data.CountryOG || data["Country of Operator/Owner"] || 'Unknown',
    Purpose: data.Purpose || data["Detailed Purpose"] || 'Unknown Purpose',
    users: data.users || `Commercial/Civil users affected. Operator: ${data["Operator/Owner"] || 'Unknown'}`,
    Released: LaunchYear,
    LaunchYear: launchYearNum,
    ExpectedLifetime: lifetimeYears,
    ExpiryYear: expiryYear,
    destroyed: false,
    mass: 2,
    dataIndex: index
  };
}

function createDebris(x, y, count, satellite) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(2, 6);
    debrisParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: rand(2, 6),
      life: 1.0,
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.1, 0.1)
    });
  }
}

function drawMeteor() {
  if (!meteor) return;
  
  ctx.save();
  ctx.translate(meteor.x, meteor.y);
  ctx.rotate(meteor.rot);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.r * 1.5);
  gradient.addColorStop(0, 'rgba(255, 100, 50, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(-meteor.r * 1.5, -meteor.r * 1.5, meteor.r * 3, meteor.r * 3);

  ctx.fillStyle = 'rgb(180, 90, 60)';
  ctx.strokeStyle = 'rgba(255, 150, 100, 0.3)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(meteor.points[0].x, meteor.points[0].y);
  for (let i=1; i<meteor.points.length; i++){
    ctx.lineTo(meteor.points[i].x, meteor.points[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
  
  if (Math.abs(meteor.vx) > 1 || Math.abs(meteor.vy) > 1) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    for (let i = 1; i < 5; i++) {
      const trailX = meteor.x - meteor.vx * i * 2;
      const trailY = meteor.y - meteor.vy * i * 2;
      ctx.fillStyle = 'rgba(255, 150, 80, 0.3)';
      ctx.beginPath();
      ctx.arc(trailX, trailY, meteor.r * (1 - i * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawSatellite(sat) {
  ctx.save();
  ctx.translate(sat.x, sat.y);
  ctx.rotate(sat.rot);

  ctx.fillStyle = 'rgb(180, 200, 220)';
  ctx.strokeStyle = 'rgb(100, 120, 140)';
  ctx.lineWidth = 2;
  ctx.fillRect(-15, -10, 30, 60);
  ctx.strokeRect(-15, -10, 30, 60);

  ctx.fillStyle = 'rgb(50, 80, 120)';
  ctx.fillRect(-25, -8, 8, 16);
  ctx.fillRect(17, -8, 8, 16);

  ctx.fillStyle = 'rgb(50, 80, 120)';
  ctx.fillRect(-35, -8, 8, 16);
  ctx.fillRect(27, -8, 8, 16);
  
  ctx.strokeStyle = 'rgb(100, 150, 200)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-25, -8 + i * 8);
    ctx.lineTo(-17, -8 + i * 8);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(17, -8 + i * 8);
    ctx.lineTo(25, -8 + i * 8);
    ctx.stroke();
  }

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-35, -8 + i * 8);
    ctx.lineTo(-27, -8 + i * 8);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(27, -8 + i * 8);
    ctx.lineTo(35, -8 + i * 8);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgb(150, 150, 150)';
  ctx.fillStyle = 'rgb(200, 200, 200)';   

  ctx.beginPath();
  ctx.arc(0, -20, 10, 0, Math.PI, false);
  ctx.fill();
  ctx.stroke(); 

  ctx.beginPath(); 
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -18);
  ctx.stroke();
  
  ctx.fillStyle = 'rgb(200, 50, 50)';
  ctx.beginPath();
  ctx.arc(0, -25, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawDebris(debris) {
  ctx.save();
  ctx.globalAlpha = debris.life;
  ctx.translate(debris.x, debris.y);
  ctx.rotate(debris.rot);
  
  ctx.fillStyle = 'rgb(150, 170, 190)';
  ctx.fillRect(-debris.size/2, -debris.size/2, debris.size, debris.size);
  
  ctx.restore();
}

function isPointInMeteor(x, y) {
  if (!meteor) return false;
  const dx = x - meteor.x;
  const dy = y - meteor.y;
  return Math.sqrt(dx * dx + dy * dy) < meteor.r;
}

function checkCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (obj1.r + obj2.r);
}

function handleCollision(meteor, satellite) {
  let countSat = 0;
  const dx = satellite.x - meteor.x;
  const dy = satellite.y - meteor.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return;
  
  const nx = dx / distance;
  const ny = dy / distance;
  
  const dvx = meteor.vx - satellite.vx;
  const dvy = meteor.vy - satellite.vy;
  const dvn = dvx * nx + dvy * ny;
  
  if (dvn > 0) return;
  
  const restitution = 0.6;
  const impulse = -(1 + restitution) * dvn / (1/meteor.mass + 1/satellite.mass);
  
  meteor.vx -= impulse * nx / meteor.mass;
  meteor.vy -= impulse * ny / meteor.mass;
  satellite.vx += impulse * nx / satellite.mass;
  satellite.vy += impulse * ny / satellite.mass;
  
  satellite.destroyed = true;
  createDebris(satellite.x, satellite.y, 15, satellite);
  
  destroyedCount++;
  countSat.textContent = destroyedCount;
  
  showPopup(satellite);
  
  spawnNewSatellite(satellite);
}

async function loadSatellitesData() {
  try {
    const response = await fetch('satellites.json');
    satellitesData = await response.json();
    
    shuffleArray(satellitesData);
    availableSatellites = [...satellitesData];
    
  } catch (error) {
    console.error('Error loading satellites data:', error);
    satellitesData = [
      { Alias: 'GPS-IIF', CountryOG: 'USA', Purpose: 'Navigation', users: 'System failure!', "Date of Launch": "02/05/2016" },
      { Alias: 'BeiDou-3', CountryOG: 'China', Purpose: 'Navigation', users: '系统崩溃！', "Date of Launch": "11/05/2019" },
      { Alias: 'GLONASS-M', CountryOG: 'Russia', Purpose: 'Navigation', users: 'Система не работает!', "Date of Launch": "12/03/2018" },
      { Alias: 'IRNSS-1', CountryOG: 'India', Purpose: 'Navigation', users: 'Infrastructure collapsed!', "Date of Launch": "04/12/2018" },
      { Alias: 'Galileo-FOC', CountryOG: 'EU', Purpose: 'Navigation', users: 'Navigation down!', "Date of Launch": "07/25/2018" },
      { Alias: 'QZSS-4', CountryOG: 'Japan', Purpose: 'Navigation', users: '衛星破壊！', "Date of Launch": "10/10/2017" }
    ];
    availableSatellites = [...satellitesData];
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getRandomSatelliteData() {
  if (availableSatellites.length === 0) {
    availableSatellites = [...satellitesData];
    shuffleArray(availableSatellites);
  }
  return availableSatellites.pop();
}

function initSatellites() {
  satellites = [];
  usedIndices = [];
  
  const numSatellites = Math.min(MAX_SATELLITES, satellitesData.length);
  
  for (let i = 0; i < numSatellites; i++) {
    const angle = (i / numSatellites) * Math.PI * 2;
    const distance = 200;
    const x = canvas.clientWidth / 2 + Math.cos(angle) * distance;
    const y = canvas.clientHeight / 2 + Math.sin(angle) * distance;
    
    const satData = getRandomSatelliteData();
    satellites.push(createSatellite(x, y, satData, i));
  }
}

function spawnNewSatellite(oldSatellite) {
  setTimeout(() => {
    if (satellites.length >= MAX_SATELLITES) return;
    
    const satData = getRandomSatelliteData();
    
    const edge = Math.floor(rand(0, 4));
    let x, y;
    
    switch(edge) {
      case 0:
        x = rand(50, canvas.clientWidth - 50);
        y = -50;
        break;
      case 1:
        x = canvas.clientWidth + 50;
        y = rand(50, canvas.clientHeight - 50);
        break;
      case 2:
        x = rand(50, canvas.clientWidth - 50);
        y = canvas.clientHeight + 50;
        break;
      case 3:
        x = -50;
        y = rand(50, canvas.clientHeight - 50);
        break;
    }
    
    const newSat = createSatellite(x, y, satData, satellites.length);
    
    const centerX = canvas.clientWidth / 2;
    const centerY = canvas.clientHeight / 2;
    const dx = centerX - x;
    const dy = centerY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    newSat.vx = (dx / distance) * rand(0.3, 0.6);
    newSat.vy = (dy / distance) * rand(0.3, 0.6);
    
    satellites.push(newSat);
  }, 2000);
}

function showDialog(text, duration = 3000) {
  dialogText.textContent = text;
  dialog.classList.add('show');
  
  if (duration > 0) {
    setTimeout(() => {
      dialog.classList.remove('show');
    }, duration);
  }
}

function showPopup(satellite) {
  const countryFlags = {
    'USA': '🇺🇸',
    'China': '🇨🇳',
    'Russia': '🇷🇺',
    'India': '🇮🇳',
    'EU': '🇪🇺',
    'Japan': '🇯🇵',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'South Korea': '🇰🇷',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Netherlands': '🇳🇱',
    'Israel': '🇮🇱',
    'Saudi Arabia': '🇸🇦',
    'UAE': '🇦🇪',
    'Turkey': '🇹🇷',
    'Indonesia': '🇮🇩',
    'Argentina': '🇦🇷',
    'Thailand': '🇹🇭',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Pakistan': '🇵🇰',
    'Egypt': '🇪🇬',
    'South Africa': '🇿🇦',
    'Norway': '🇳🇴',
    'Sweden': '🇸🇪',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Poland': '🇵🇱',
    'Ukraine': '🇺🇦',
    'Vietnam': '🇻🇳'
  };
  
  popupAlias.textContent = satellite.Alias || 'UNKNOWN SATELLITE';
  popupFlag.textContent = countryFlags[satellite.CountryOG] || '🌍';
  popupCountryOG.textContent = satellite.CountryOG || 'Unknown';
  popupPurpose.textContent = satellite.Purpose || 'Unknown Purpose';
  popupYears.textContent = satellite.Released || 'Unknown Launch Year';
  popupUsers.textContent = satellite.users || 'Impact assessment pending...';
  
  popup.classList.add('show');
}

function hidePopup() {
  popup.classList.remove('show');
}

function getPurposeMessage(purpose) {
  const messages = {
    'Communications': "Something's wrong with our connection!",
    'Communication': "Something's wrong with our connection!",
    'Navigation': "GPS signals lost! Navigation systems offline!",
    'Earth Observation': "Satellite imagery disrupted! Monitoring systems down!",
    'Technology Development': "Research satellite destroyed! Data transmission ceased!",
    'Space Observation': "Deep space monitoring interrupted!",
    'Meteorology': "Weather forecasting compromised! Storm tracking offline!",
    'Science': "Scientific research data lost!",
    'Military': "Military satellite destroyed! Defense systems compromised!",
    'Surveillance': "Surveillance capabilities disrupted!"
  };
  
  for (const [key, msg] of Object.entries(messages)) {
    if (purpose && purpose.toLowerCase().includes(key.toLowerCase())) {
      return msg;
    }
  }
  
  return "Satellite system malfunction detected!";
}

function showCollisionPopup(sat1, sat2) {
  const countryFlags = {
    'USA': '🇺🇸', 'China': '🇨🇳', 'Russia': '🇷🇺', 'India': '🇮🇳',
    'EU': '🇪🇺', 'Japan': '🇯🇵', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
    'France': '🇫🇷', 'Germany': '🇩🇪', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
    'South Korea': '🇰🇷', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽', 'Italy': '🇮🇹',
    'Spain': '🇪🇸', 'Netherlands': '🇳🇱', 'Israel': '🇮🇱',
    'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪', 'Turkey': '🇹🇷',
    'Indonesia': '🇮🇩', 'Argentina': '🇦🇷', 'Thailand': '🇹🇭',
    'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Pakistan': '🇵🇰',
    'Egypt': '🇪🇬', 'South Africa': '🇿🇦', 'Norway': '🇳🇴',
    'Sweden': '🇸🇪', 'Denmark': '🇩🇰', 'Finland': '🇫🇮',
    'Poland': '🇵🇱', 'Ukraine': '🇺🇦', 'Vietnam': '🇻🇳'
  };
  
  collisionAlias1.textContent = sat1.Alias || 'Unknown';
  collisionFlag1.textContent = countryFlags[sat1.CountryOG] || '🌍';
  collisionCountry1.textContent = sat1.CountryOG || 'Unknown';
  collisionPurpose1.textContent = sat1.Purpose || 'Unknown';
  collisionYear1.textContent = sat1.Released || 'Unknown';
  
  collisionAlias2.textContent = sat2.Alias || 'Unknown';
  collisionFlag2.textContent = countryFlags[sat2.CountryOG] || '🌍';
  collisionCountry2.textContent = sat2.CountryOG || 'Unknown';
  collisionPurpose2.textContent = sat2.Purpose || 'Unknown';
  collisionYear2.textContent = sat2.Released || 'Unknown';
  
  const msg1 = getPurposeMessage(sat1.Purpose);
  const msg2 = getPurposeMessage(sat2.Purpose);
  const combinedMsg = `${msg1} | ${msg2}`;
  showDialog(combinedMsg, 4000);
  
  popupCollision.classList.add('show');
}

function hideCollisionPopup() {
  popupCollision.classList.remove('show');
}

function checkSatelliteCollisions() {
  for (let i = 0; i < satellites.length; i++) {
    const sat1 = satellites[i];
    if (sat1.destroyed) continue;
    
    for (let j = i + 1; j < satellites.length; j++) {
      const sat2 = satellites[j];
      if (sat2.destroyed) continue;
      
      if (checkCollision(sat1, sat2)) {
        handleSatelliteCollision(sat1, sat2);
      }
    }
  }
}

function handleSatelliteCollision(sat1, sat2) {
  const dx = sat2.x - sat1.x;
  const dy = sat2.y - sat1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return;
  
  const nx = dx / distance;
  const ny = dy / distance;
  
  const dvx = sat1.vx - sat2.vx;
  const dvy = sat1.vy - sat2.vy;
  const dvn = dvx * nx + dvy * ny;
  
  if (dvn > 0) return;
  
  const restitution = 0.8;
  const impulse = -(1 + restitution) * dvn / (1/sat1.mass + 1/sat2.mass);
  
  sat1.vx -= impulse * nx / sat1.mass;
  sat1.vy -= impulse * ny / sat1.mass;
  sat2.vx += impulse * nx / sat2.mass;
  sat2.vy += impulse * ny / sat2.mass;
  
  sat1.destroyed = true;
  sat2.destroyed = true;
  
  createDebris(sat1.x, sat1.y, 20, sat1);
  createDebris(sat2.x, sat2.y, 20, sat2);
  
  destroyedCount += 2;
  countSat.textContent = destroyedCount;
  
  showCollisionPopup(sat1, sat2);
  
  spawnNewSatellite(sat1);
  spawnNewSatellite(sat2);
}

function updateTime() {
  if (isTimePaused) return;
  
  const now = Date.now();
  const deltaTime = (now - lastTimeUpdate) / 1000;
  lastTimeUpdate = now;
  
  currentYear += deltaTime * timeSpeed;
  currentYearDisplay.textContent = Math.floor(currentYear);
}

function checkSatelliteExpiry() {
  if (isTimePaused) return;
  
  for (let i = satellites.length - 1; i >= 0; i--) {
    const sat = satellites[i];
    if (!sat.destroyed && currentYear >= sat.ExpiryYear) {
      sat.vy += 0.5;
      sat.destroyed = true;
      createDebris(sat.x, sat.y, 10, sat);
      
      showDialog(`${sat.Alias} has reached end of life and is falling...`, 3000);
      
      destroyedCount++;
      countSat.textContent = destroyedCount;
      
      spawnNewSatellite(sat);
    }
  }
}

function updateSatellitePanel() {
  panelList.innerHTML = '';
  
  const activeSatellites = satellites.filter(s => !s.destroyed);
  
  if (activeSatellites.length === 0) {
    panelList.innerHTML = '<div class="satellite-item">No active satellites</div>';
    return;
  }
  
  activeSatellites.forEach(sat => {
    const item = document.createElement('div');
    item.className = 'satellite-item';
    
    const yearsRemaining = currentYear - sat.ExpiryYear;
    const isExpiring = yearsRemaining < 5;
    
    item.innerHTML = `
      <div class="satellite-item-name">${sat.Alias}</div>
      <div class="satellite-item-info">
        Launched: ${sat.Released} | ${sat.CountryOG}
      </div>
      ${isExpiring ? `<div class="satellite-item-expired">⚠ Expires in ${yearsRemaining.toFixed(1)} years</div>` : ''}
    `;
    
    panelList.appendChild(item);
  });
}

panelToggle.addEventListener('click', () => {
  panelDropdown.classList.toggle('open');
  panelToggle.textContent = panelDropdown.classList.contains('open') 
    ? 'Active Satellites ▲' 
    : 'Active Satellites ▼';
});

speedSlow.addEventListener('click', () => {
  timeSpeed = 1;
  document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
  speedSlow.classList.add('active');
});

speedNormal.addEventListener('click', () => {
  timeSpeed = 5;
  document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
  speedNormal.classList.add('active');
});

speedFast.addEventListener('click', () => {
  timeSpeed = 10;
  document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
  speedFast.classList.add('active');
});

async function startGame() {
  gameStarted = true;
  menu.classList.add('hide');
  canvas.classList.add('active');
  counter.classList.add('show');
  timeControl.classList.add('show');
  satellitePanel.classList.add('show');
  
  await loadSatellitesData();
  
  meteor = createMeteor();
  destroyedCount = 0;
  countSat.textContent = destroyedCount;
  
  currentYear = 2020;
  lastTimeUpdate = Date.now();
  currentYearDisplay.textContent = currentYear;
  
  initSatellites();
  updateSatellitePanel();
  
  showDialog('Objectives : as a meteor, you have a crucial mission to collide with another satellite.', 3000);
  
  setTimeout(() => {
    showDialog("Now, let's start by moving our meteor to satellites nearby and see what happens.", 4000);
  }, 3500);
}

function tick(){
  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);

  for (const rock of rocks){
    rock.x += rock.vx;
    rock.y += rock.vy;
    rock.rot += rock.vr;

    if (rock.y - rock.r > canvas.clientHeight + 20){
      rock.y = -rand(20, 200);
      rock.x = rand(0, canvas.clientWidth);
    }
    if (rock.x < -50) rock.x = canvas.clientWidth + 50;
    if (rock.x > canvas.clientWidth + 50) rock.x = -50;

    drawRock(rock);
  }
  
  if (gameStarted && meteor) {
    updateTime();
    
    checkSatelliteExpiry();
    
    if (Math.floor(Date.now() / 500) % 1 === 0) {
      updateSatellitePanel();
    }
    
    if (!isDragging) {
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.vx *= 0.98;
      meteor.vy *= 0.98;
    }
    
    meteor.rot += meteor.vr;
    
    if (meteor.x < meteor.r) {
      meteor.x = meteor.r;
      meteor.vx *= -0.5;
    }
    if (meteor.x > canvas.clientWidth - meteor.r) {
      meteor.x = canvas.clientWidth - meteor.r;
      meteor.vx *= -0.5;
    }
    if (meteor.y < meteor.r) {
      meteor.y = meteor.r;
      meteor.vy *= -0.5;
    }
    if (meteor.y > canvas.clientHeight - meteor.r) {
      meteor.y = canvas.clientHeight - meteor.r;
      meteor.vy *= -0.5;
    }
    
    if (Math.random() < 0.003) {
      checkSatelliteCollisions();
    }
    
    for (let i = satellites.length - 1; i >= 0; i--) {
      const sat = satellites[i];
      
      if (!sat.destroyed) {
        sat.x += sat.vx;
        sat.y += sat.vy;
        sat.rot += sat.vr;
        
        if (sat.x < -50) sat.x = canvas.clientWidth + 50;
        if (sat.x > canvas.clientWidth + 50) sat.x = -50;
        if (sat.y < -50) sat.y = canvas.clientHeight + 50;
        if (sat.y > canvas.clientHeight + 50) sat.y = -50;
        
        if (checkCollision(meteor, sat)) {
          handleCollision(meteor, sat);
        }
        
        drawSatellite(sat);
      } else {
        if (!sat.removeTimer) {
          sat.removeTimer = 60;
        }
        sat.removeTimer--;
        if (sat.removeTimer <= 0) {
          satellites.splice(i, 1);
        }
      }
    }
    
    for (let i = debrisParticles.length - 1; i >= 0; i--) {
      const debris = debrisParticles[i];
      debris.x += debris.vx;
      debris.y += debris.vy;
      debris.rot += debris.vr;
      debris.life -= 0.01;
      debris.vy += 0.05;
      
      if (debris.life <= 0) {
        debrisParticles.splice(i, 1);
      } else {
        drawDebris(debris);
      }
    }
    
    drawMeteor();
  }

  requestAnimationFrame(tick);
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

canvas.addEventListener("mousedown", (e) => {
  if (!gameStarted || !meteor) return;
  
  const pos = getMousePos(e);
  if (isPointInMeteor(pos.x, pos.y)) {
    isDragging = true;
    dragOffset.x = meteor.x - pos.x;
    dragOffset.y = meteor.y - pos.y;
    lastMousePos = pos;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!gameStarted || !meteor) return;
  
  const pos = getMousePos(e);
  
  if (isDragging) {
    const dx = pos.x - lastMousePos.x;
    const dy = pos.y - lastMousePos.y;
    
    meteor.x = pos.x + dragOffset.x;
    meteor.y = pos.y + dragOffset.y;
    meteor.vx = dx;
    meteor.vy = dy;
    
    lastMousePos = pos;
  } else {
    if (isPointInMeteor(pos.x, pos.y)) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    canvas.style.cursor = 'default';
  }
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  canvas.style.cursor = 'default';
});

canvas.addEventListener("touchstart", (e) => {
  if (!gameStarted || !meteor) return;
  
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const pos = {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
  
  if (isPointInMeteor(pos.x, pos.y)) {
    isDragging = true;
    dragOffset.x = meteor.x - pos.x;
    dragOffset.y = meteor.y - pos.y;
    lastMousePos = pos;
    e.preventDefault();
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (!gameStarted || !meteor || !isDragging) return;
  
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const pos = {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
  
  const dx = pos.x - lastMousePos.x;
  const dy = pos.y - lastMousePos.y;
  
  meteor.x = pos.x + dragOffset.x;
  meteor.y = pos.y + dragOffset.y;
  meteor.vx = dx;
  meteor.vy = dy;
  
  lastMousePos = pos;
  e.preventDefault();
});

canvas.addEventListener("touchend", () => {
  isDragging = false;
});

startBtn.addEventListener('click', startGame);

timeToggleBtn.addEventListener('click', () => {
  isTimePaused = !isTimePaused;
  
  if (isTimePaused) {
    timeToggleBtn.textContent = '▶ Play';
    timeToggleBtn.classList.add('paused');
  } else {
    timeToggleBtn.textContent = '⏸ Pause';
    timeToggleBtn.classList.remove('paused');
    lastTimeUpdate = Date.now();
  }
});

popupClose.addEventListener('click', hidePopup);
popupCollisionClose.addEventListener('click', hideCollisionPopup);

resize();
seed(60);
tick();