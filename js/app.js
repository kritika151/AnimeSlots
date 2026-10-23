
function initAnimeLoader() {
  const loader = document.getElementById("anime-loader");
  const skip = document.getElementById("skip-loader");
  if (!loader) return;

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    loader.classList.add("loader-hidden");
    window.setTimeout(() => loader.remove(), 500);
  };

  skip?.addEventListener("click", dismiss);
  window.setTimeout(dismiss, 2200);
}

initAnimeLoader();

const $ = (id) => document.getElementById(id);

const SAVE_SETTING_KEY = "animeslots_save_enabled";
const SOUND_SETTING_KEY = "animeslots_sound_enabled";
const GAME_DATA_KEYS = [
  "animeslots_balance", "animeslots_favorites", "animeslots_progress",
  "animeslots_shop", "animeslots_next_refill"
];
function savingEnabled() {
  return localStorage.getItem(SAVE_SETTING_KEY) !== "false";
}
function persistGameData(key, value) {
  if (key === SAVE_SETTING_KEY || savingEnabled()) {
    localStorage.setItem(key, value);
  }
}

let soundEnabled = localStorage.getItem(SOUND_SETTING_KEY) !== "false";
const wavSounds = {
  spin: new Audio("sounds/slot-spin.wav"),
  reel: new Audio("sounds/slot-reel.wav"),
  wheel: new Audio("sounds/slot-random-wheel.wav"),
  win: new Audio("sounds/slot-win.wav"),
  jackpot: new Audio("sounds/slot-win-alert.wav")
};
Object.values(wavSounds).forEach(audio => {
  audio.preload = "auto";
  audio.volume = 0.65;
});
function playWav(name) {
  if (!soundEnabled) return;
  const original = wavSounds[name];
  if (!original) return;
  try {
    const audio = original.cloneNode();
    audio.volume = original.volume;
    audio.play().catch(() => {});
  } catch (_) {}
}
function syncSoundToggle() {
  const button = $("sound-toggle");
  if (button) {
    button.textContent = soundEnabled ? "Sound on" : "Sound off";
    button.setAttribute("aria-pressed", String(soundEnabled));
  }
  const toggle = $("sound-effects-toggle");
  const status = $("sound-status");
  if (toggle) toggle.checked = soundEnabled;
  if (status) status.textContent = soundEnabled
    ? "Arcade sound effects are enabled."
    : "Arcade sound effects are muted.";
}

function renderSettings() {
  const toggle = $("save-progress-toggle");
  const status = $("save-status");
  syncSoundToggle();
  if (toggle) toggle.checked = savingEnabled();
  if (status) status.textContent = savingEnabled()
    ? "Saving is enabled."
    : "Saving is off. Progress lasts only for this session.";
}
function clearGameData() {
  GAME_DATA_KEYS.forEach(key => localStorage.removeItem(key));
}


const games = [
  { id: 1, title: "Sakura Fortune", category: "Anime", icon: "🌸", symbols: ["🌸", "⛩️", "🦊", "💮", "✨"], description: "Find your fortune beneath the cherry blossoms." },
  { id: 2, title: "Dragon Realm", category: "Fantasy", icon: "🐉", symbols: ["🐉", "🔥", "💎", "👑", "⚔️"], description: "Claim the treasure of an ancient dragon." },
  { id: 3, title: "Moon Princess", category: "Anime", icon: "🌙", symbols: ["🌙", "👑", "⭐", "💜", "🦋"], description: "A moonlit adventure full of royal magic." },
  { id: 4, title: "Spirit Fox", category: "Fantasy", icon: "🦊", symbols: ["🦊", "⛩️", "🍃", "🔮", "🌟"], description: "Follow the spirit fox into a hidden world." },
  { id: 5, title: "Pixel Dreams", category: "Classic", icon: "👾", symbols: ["👾", "🍒", "🍋", "💎", "7️⃣"], description: "A retro arcade classic with an anime twist." },
  { id: 6, title: "Mecha Strike", category: "Anime", icon: "🤖", symbols: ["🤖", "⚙️", "🚀", "💥", "🔋"], description: "Power up your mech and chase a big match." },
  { id: 7, title: "Ocean Spirits", category: "Fantasy", icon: "\u{1F420}", symbols: ["\u{1F420}", "\u{1F41A}", "\u{1F30A}", "\u{1F420}", "\u{1F48E}"], description: "Discover enchanted treasures under the sea." },
  { id: 8, title: "Lucky Seven", category: "Classic", icon: "🎰", symbols: ["7️⃣", "🍒", "🍀", "🔔", "💎"], description: "Spin a timeless classic in neon style." }
];

const STORAGE = {
  balance: "animeslots_balance",
  favorites: "animeslots_favorites"
};

let balance = loadBalance();
let favorites = loadFavorites();
let activeView = "all";
let activeFilter = "All";
let currentGame = games[0];
let spinning = false;

let audioContext = null;

function loadBalance() {
  const raw = localStorage.getItem(STORAGE.balance);
  if (raw === null) return 250;
  const saved = Number(raw);
  return Number.isFinite(saved) && saved >= 0 ? saved : 250;
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.favorites) || "[]");
    return Array.isArray(saved) ? saved.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function saveBalance() {
  persistGameData(STORAGE.balance, String(balance));
}

function saveFavorites() {
  persistGameData(STORAGE.favorites, JSON.stringify(favorites));
}

function renderBalance() {
  $("balance").textContent = balance.toLocaleString();
}

function renderGames() {
  const query = $("search").value.trim().toLowerCase();
  const favoritesOnly = activeView === "favorites" || activeFilter === "Favorites";

  const shown = games.filter((game) => {
    const matchesQuery = game.title.toLowerCase().includes(query) ||
      game.category.toLowerCase().includes(query);
    const matchesFilter = activeFilter === "All" ||
      activeFilter === "Favorites" || game.category === activeFilter;
    const matchesFavorite = !favoritesOnly || favorites.includes(game.id);
    return matchesQuery && matchesFilter && matchesFavorite;
  });

  $("games").innerHTML = shown.map((game, index) => `
    <article class="game-card" style="animation-delay:${Math.min(index, 8) * 35}ms">
      <div class="game-art"><span>${game.icon}</span></div>
      <div class="game-info">
        <h3>${game.title}</h3>
        <p>${game.category} · 3 reels</p>
        <div class="card-actions">
          <button class="play-btn" data-play="${game.id}">▶ Play</button>
          <button class="favorite ${favorites.includes(game.id) ? "is-favorite" : ""}"
            data-favorite="${game.id}" aria-label="Toggle ${game.title} favorite"
            aria-pressed="${favorites.includes(game.id)}">
            ${favorites.includes(game.id) ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  `).join("");

  $("game-count").textContent = `${shown.length} GAME${shown.length === 1 ? "" : "S"}`;
  $("empty-state").hidden = shown.length !== 0;
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderGames();
}

function setView(view) {
  activeView = view;

  document.querySelectorAll(".nav-btn").forEach(button =>
    button.classList.toggle("active", button.dataset.view === view)
  );

  document.querySelectorAll("main > *").forEach(section => {
    if (view === "portfolio") {
      section.hidden = !section.classList.contains("developer");
    } else if (view === "progress") {
      section.hidden = !section.classList.contains("progress-page");
    } else if (view === "settings") {
      section.hidden = !section.classList.contains("settings-page");
    } else if (view === "shop") {
      section.hidden = !section.classList.contains("shop-page") ||
        section.classList.contains("settings-page");
    } else {
      section.hidden =
        section.classList.contains("developer") ||
        section.classList.contains("progress-page") ||
        section.classList.contains("shop-page") ||
        section.classList.contains("settings-page");
    }
  });

  if (view === "progress") {
    renderProgress();
    $("progress-page").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (view === "portfolio") {
    const portfolio = $("developer");
    portfolio.classList.remove("cinematic-portfolio");
    void portfolio.offsetWidth;
    portfolio.classList.add("cinematic-portfolio");
    portfolio.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (view === "shop") {
    renderShop();
    $("shop-page").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (view === "settings") {
    document.querySelectorAll("main > *").forEach(section => {
      section.hidden = !section.classList.contains("settings-page");
    });
    renderSettings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    setFilter(view === "favorites" ? "Favorites" : "All");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

const PROGRESS_KEY = "animeslots_progress";
function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return {
      xp: Math.max(0, Number(p.xp) || 0),
      spins: Math.max(0, Number(p.spins) || 0),
      wins: Math.max(0, Number(p.wins) || 0),
      jackpots: Math.max(0, Number(p.jackpots) || 0),
      day: p.day || new Date().toDateString(),
      dailySpins: Number(p.dailySpins) || 0,
      dailyWins: Number(p.dailyWins) || 0,
      claimed: Array.isArray(p.claimed) ? p.claimed : []
    };
  } catch {
    return {xp:0, spins:0, wins:0, jackpots:0,
      day:new Date().toDateString(), dailySpins:0, dailyWins:0, claimed:[]};
  }
}
let progress = loadProgress();
function saveProgress() {
  persistGameData(PROGRESS_KEY, JSON.stringify(progress));
}
function resetDaily() {
  const day = new Date().toDateString();
  if (progress.day !== day) {
    progress.day = day;
    progress.dailySpins = 0;
    progress.dailyWins = 0;
    progress.claimed = [];
    saveProgress();
  }
}
function getLevel() { return Math.floor(progress.xp / 100) + 1; }
function getRank(l) {
  if (l >= 100) return "\u{1F451} Eternal Legend";
  if (l >= 75) return "\u{1F30C} Cosmic Sovereign";
  if (l >= 60) return "\u{1F31F} Celestial Champion";
  if (l >= 50) return "\u{1F3C6} Legend";
  if (l >= 40) return "\u{1F52E} Arcane Master";
  if (l >= 30) return "\u{1F30C} Mythic";
  if (l >= 25) return "\u{1F6E1} Star Guardian";
  if (l >= 20) return "\u{1F451} Grandmaster";
  if (l >= 15) return "\u{1F525} Rising Hero";
  if (l >= 10) return "\u{2694} Elite";
  if (l >= 7) return "\u{1F3C5} Ace Player";
  if (l >= 5) return "\u{1F525} Veteran";
  if (l >= 3) return "\u{1F4AB} Adventurer";
  return "\u{1F331} Newcomer";
}

function renderProgress() {
  if (!$("missions") || !$("achievements")) return;
  resetDaily();
  const level = getLevel(), xp = progress.xp % 100;
  $("player-level").textContent = level;
  $("player-rank").textContent = getRank(level);
  $("xp-label").textContent = `${xp} / 100 XP`;
  $("xp-percent").textContent = `${xp}%`;
  $("xp-fill").style.width = `${xp}%`;
  $("player-total").textContent = `Lifetime XP: ${progress.xp}`;

  const tasks = [
    {id:"spin5",title:"Daily Spinner",desc:"Complete 5 spins today.",ok:progress.dailySpins>=5,xp:30,credits:50},
    {id:"win3",title:"Daily Victor",desc:"Win 3 times today.",ok:progress.dailyWins>=3,xp:50,credits:75},
    {id:"spin15",title:"Arcade Marathon",desc:"Complete 15 spins today.",ok:progress.dailySpins>=15,xp:75,credits:150},
    {id:"win8",title:"Victory Hunter",desc:"Win 8 times today.",ok:progress.dailyWins>=8,xp:100,credits:250},
    {id:"spin30",title:"Unstoppable Player",desc:"Complete 30 spins today.",ok:progress.dailySpins>=30,xp:150,credits:400}
  ];

  $("missions").innerHTML = tasks.map(m => {
    const claimed = progress.claimed.includes(m.id);
    const ready = m.ok && !claimed;
    return `<article class="mission-item ${claimed?"done":""} ${ready?"mission-ready":""}">
      <h4>${ready?'<span class="mission-dot" aria-label="Reward ready"></span>':""}${m.title}</h4>
      <p>${m.desc}</p><p>Reward: ${m.xp} XP + ${m.credits} credits</p>
      <button data-claim="${m.id}" ${claimed||!m.ok?"disabled":""}>${claimed?"Claimed":ready?"Claim reward":"In progress"}</button>
    </article>`;
  }).join("");

  const badges = [
    ["First Spin","Complete your first spin.",progress.spins>=1],
    ["Regular Player","Complete 10 spins.",progress.spins>=10],
    ["Arcade Veteran","Complete 50 spins.",progress.spins>=50],
    ["Century Spinner","Complete 100 spins.",progress.spins>=100],
    ["Arcade Marathon","Complete 250 spins.",progress.spins>=250],
    ["First Victory","Win a spin.",progress.wins>=1],
    ["Winning Streak","Win 10 spins.",progress.wins>=10],
    ["Champion","Win 50 spins.",progress.wins>=50],
    ["Jackpot","Hit your first jackpot.",progress.jackpots>=1],
    ["Jackpot Hunter","Hit 5 jackpots.",progress.jackpots>=5],
    ["Rising Star","Reach level 5.",level>=5],
    ["Elite Soul","Reach level 10.",level>=10],
    ["Mythic Legend","Reach level 30.",level>=30],
    ["Cosmic Hero","Reach level 60.",level>=60],
    ["Eternal Legend","Reach level 100.",level>=100]
  ];
  $("achievements").innerHTML = badges.map(([t,d,ok]) =>
    `<article class="achievement-item ${ok?"unlocked":""}"><h4>${ok?"&#x2705;":"&#x1F512;"} ${t}</h4><p>${d}</p><p>${ok?"Achievement unlocked":"Not yet unlocked"}</p></article>`
  ).join("");

  const ready = tasks.some(m => m.ok && !progress.claimed.includes(m.id));
  const nav = document.querySelector('.nav-btn[data-view="progress"]');
  if (nav) {
    nav.classList.toggle("has-notification", ready);
    nav.setAttribute("aria-label", ready ? "Progress - reward ready" : "Progress");
  }
}

function claimMission(id) {
  resetDaily();
  const missions = {
    spin5:{spins:5,wins:0,xp:30,credits:50},
    win3:{spins:0,wins:3,xp:50,credits:75},
    spin15:{spins:15,wins:0,xp:75,credits:150},
    win8:{spins:0,wins:8,xp:100,credits:250},
    spin30:{spins:30,wins:0,xp:150,credits:400}
  };
  const m = missions[id];
  if (!m || progress.claimed.includes(id) ||
      progress.dailySpins < m.spins || progress.dailyWins < m.wins) return;
  progress.claimed.push(id);
  progress.xp += m.xp;
  balance = Math.min(1000, balance + m.credits);
  saveProgress();
  saveBalance();
  renderBalance();
  renderProgress();
}
$("missions")?.addEventListener("click", e => {
  const b = e.target.closest("[data-claim]");
  if (b) claimMission(b.dataset.claim);
});


const SHOP_KEY = "animeslots_shop";
const SHOP_ITEMS = [
  { id: "free_spin", name: "Free Spin Ticket", price: 750, icon: "\u{1F3AB}", description: "Your next spin costs no credits." },
  { id: "refund", name: "Refund Charm", price: 1200, icon: "\u{1F6E1}", description: "Get your bet back if your next spin loses." },
  { id: "payout", name: "Payout Booster", price: 2500, icon: "\u{1F4B0}", description: "Double your next winning payout." },
  { id: "xp", name: "XP Booster", price: 1800, icon: "\u{2B50}", description: "Earn double XP for your next five spins." },
  { id: "credits", name: "Credit Pack", price: 800, icon: "\u{1F4B3}", description: "Restore up to 1,000 credits, capped at your wallet limit." }
];

function loadShop() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHOP_KEY) || "{}");
    return {
      inventory: saved.inventory && typeof saved.inventory === "object"
        ? saved.inventory : {},
      xpSpins: Number.isInteger(saved.xpSpins) ? Math.max(0, saved.xpSpins) : 0
    };
  } catch (_) {
    return { inventory: {}, xpSpins: 0 };
  }
}
let shopState = loadShop();

function saveShop() {
  persistGameData(SHOP_KEY, JSON.stringify(shopState));
}

function renderShop() {
  const balanceEl = $("shop-balance");
  const itemsEl = $("shop-items");
  if (!balanceEl || !itemsEl) return;

  balanceEl.textContent = `Your credits: ${balance.toLocaleString()}`;
  itemsEl.innerHTML = SHOP_ITEMS.map(item => {
    const count = Number(shopState.inventory[item.id]) || 0;
    const label = item.id === "credits"
      ? "Restore credits"
      : `Buy power-up - ${count} owned`;
    return `<article class="shop-item">
      <div class="shop-icon">${item.icon}</div>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <p class="shop-price">${item.price.toLocaleString()} credits</p>
      <button class="shop-action" data-shop-item="${item.id}">${label}</button>
    </article>`;
  }).join("");
}

function purchaseShopItem(id) {
  const item = SHOP_ITEMS.find(entry => entry.id === id);
  if (!item) return;
  const message = $("shop-message");

  if (balance < item.price) {
    if (message) message.textContent = `Not enough credits for ${item.name}.`;
    return;
  }

  balance -= item.price;
  if (item.id === "credits") {
    balance = Math.min(1000, balance + 1000);
  } else if (item.id === "xp") {
    shopState.xpSpins += 5;
  } else {
    shopState.inventory[item.id] =
      (Number(shopState.inventory[item.id]) || 0) + 1;
  }

  saveBalance();
  saveShop();
  renderBalance();
  renderShop();
  if (message) {
    message.textContent = item.id === "credits"
      ? "Credit Pack used: credits restored!"
      : `${item.name} purchased and ready to use!`;
  }
}

$("shop-items")?.addEventListener("click", event => {
  const button = event.target.closest("[data-shop-item]");
  if (button) purchaseShopItem(button.dataset.shopItem);
});

const REFILL_AMOUNT = 100;
const REFILL_INTERVAL = 60 * 1000;
const REFILL_KEY = "animeslots_next_refill";

function getNextRefill() {
  const saved = Number(localStorage.getItem(REFILL_KEY));
  return Number.isFinite(saved) && saved > 0 ? saved : Date.now() + REFILL_INTERVAL;
}

let nextRefill = getNextRefill();

function saveRefill() {
  persistGameData(REFILL_KEY, String(nextRefill));
}

function updateRefill() {
  const status = $("refill-status");
  if (!status) return;

  const now = Date.now();

  if (balance >= 1000) {
    status.textContent = "Credits full";
    nextRefill = now + REFILL_INTERVAL;
    saveRefill();
    return;
  }

  if (!Number.isFinite(nextRefill) || nextRefill <= 0) {
    nextRefill = now + REFILL_INTERVAL;
    saveRefill();
  }

  if (nextRefill <= now) {
    balance = Math.min(1000, balance + REFILL_AMOUNT);
    saveBalance();
    renderBalance();

    if (balance >= 1000) {
      status.textContent = "Credits full";
      nextRefill = now + REFILL_INTERVAL;
      saveRefill();
      return;
    }

    nextRefill = now + REFILL_INTERVAL;
    saveRefill();
  }

  const seconds = Math.max(0, Math.ceil((nextRefill - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  status.textContent = `+${REFILL_AMOUNT} in ${minutes}:${String(remainder).padStart(2, "0")}`;
}

function playTone(frequency, duration = 0.12, type = "sine") {
  if (!soundEnabled) return;

  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001, audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio may be unavailable in some browsers.
  }
}


function setReels(symbols) {
  const reels = $("reels");
  if (!reels || !Array.isArray(symbols)) return;
  reels.innerHTML = symbols.map(symbol =>
    `<div class="reel-symbol">${String(symbol)}</div>`
  ).join("");
}

function getPrize(symbols, bet) {
  if (!Array.isArray(symbols) || symbols.length !== 3) {
    return { multiplier: 0, message: "Try another spin!" };
  }

  const same = symbols[0] === symbols[1] &&
    symbols[1] === symbols[2];

  if (same) {
    return { multiplier: 5, message: "JACKPOT!" };
  }

  const pair = symbols[0] === symbols[1] ||
    symbols[0] === symbols[2] ||
    symbols[1] === symbols[2];

  if (pair) {
    return { multiplier: 2, message: "Nice match!" };
  }

  return { multiplier: 0, message: "No match - try again!" };
}

function openGame(id) {
  if (spinning) return;

  const selected = games.find(game => game.id === Number(id));
  if (!selected) return;

  currentGame = selected;

  const panel = $("play-panel");
  if (!panel) {
    console.error("Game panel #play-panel was not found.");
    return;
  }

  const heading = panel.querySelector("h2, h3");
  if (heading) heading.textContent = selected.title;

  setReels([
    selected.symbols[0],
    selected.symbols[1],
    selected.symbols[2]
  ]);

  $("result").textContent = "Ready when you are!";
  $("result").classList.remove("win");
  panel.hidden = false;
  panel.classList.remove("cinematic-enter");
  void panel.offsetWidth;
  panel.classList.add("cinematic-enter");
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeGame() {
  if (spinning) return;
  const panel = $("play-panel");
  if (panel) panel.hidden = true;
}

async function spin() {
  if (spinning) return;

  const bet = Number($("bet").value);
  if (!Number.isFinite(bet) || bet < 1) {
    $("result").textContent = "Choose a valid bet.";
    return;
  }
  const freeSpin = (Number(shopState.inventory.free_spin) || 0) > 0;
  const refundCharm = (Number(shopState.inventory.refund) || 0) > 0;
  const payoutBoost = (Number(shopState.inventory.payout) || 0) > 0;

  if (!freeSpin && balance < bet) {
    $("result").textContent = "Not enough credits! Wait for your refill.";
    return;
  }

  spinning = true;
  $("spin").disabled = true;
  $("bet").disabled = true;

  try {
    if (freeSpin) {
      shopState.inventory.free_spin--;
    } else {
      balance -= bet;
    }
    if (refundCharm) shopState.inventory.refund--;
    if (payoutBoost) shopState.inventory.payout--;
    saveShop();
    saveBalance();
    renderBalance();

    $("result").classList.remove("win");
    $("result").textContent = "Spinning...";
    playWav("spin");
    $("reels").classList.add("spinning");

    const symbols = currentGame.symbols;
    let finalSymbols = [];

    for (let tick = 0; tick < 12; tick++) {
      finalSymbols = Array.from(
        { length: 3 },
        () => symbols[Math.floor(Math.random() * symbols.length)]
      );
      setReels(finalSymbols);
      if (tick === 5 || tick === 9) playWav("reel");
      playTone(280 + tick * 18, 0.045, "triangle");
      await new Promise(resolve => setTimeout(resolve, 90 + tick * 5));
    }

    const prize = getPrize(finalSymbols, bet);
    let winnings = bet * prize.multiplier;
    if (payoutBoost && winnings > 0) winnings *= 2;
    if (refundCharm && winnings === 0) {
      balance += bet;
      saveBalance();
      renderBalance();
    }

    if (winnings > 0) {
      balance += winnings;
      saveBalance();
      renderBalance();
      $("result").textContent = `${prize.message} +${winnings} credits!`;
      $("result").classList.add("win");
      playTone(prize.multiplier === 5 ? 880 : 660, 0.3, "sine");
      playWav(prize.multiplier === 5 ? "jackpot" : "win");
    } else {
      $("result").textContent = prize.message;
    }

    resetDaily();
    progress.spins++;
    progress.dailySpins++;
    if (winnings > 0) {
      progress.wins++;
      progress.dailyWins++;
    }
    if (prize.multiplier === 5) progress.jackpots++;
    let earnedXp = 10 + (winnings > 0 ? 10 : 0) +
      (prize.multiplier === 5 ? 20 : 0);
    if (shopState.xpSpins > 0) {
      earnedXp *= 2;
      shopState.xpSpins--;
      saveShop();
    }
    progress.xp += earnedXp;
    saveProgress();
    renderProgress();

  } catch (err) {
    $("result").textContent = "Spin error: " + (err?.message || String(err));
    console.error(err);
  } finally {
    $("reels").classList.remove("spinning");
    $("spin").disabled = false;
    $("bet").disabled = false;
    spinning = false;
    try { updateRefill(); } catch (_) {}
  }
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_SETTING_KEY, String(soundEnabled));
  syncSoundToggle();
  if (soundEnabled) { playTone(660, 0.12); playWav("wheel"); }
}

$("search").addEventListener("input", renderGames);

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    activeView = "all";
    document.querySelectorAll(".nav-btn").forEach((nav) => {
      nav.classList.toggle("active", nav.dataset.view === "all");
    });
    setFilter(button.dataset.filter);
  });
});

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

$("games").addEventListener("click", (event) => {
  const playButton = event.target.closest("[data-play]");
  const favoriteButton = event.target.closest("[data-favorite]");

  if (playButton) openGame(Number(playButton.dataset.play));
  if (favoriteButton) toggleFavorite(Number(favoriteButton.dataset.favorite));
});

$("explore").addEventListener("click", () => {
  $("library").scrollIntoView({ behavior: "smooth" });
});

$("close-game").addEventListener("click", closeGame);
$("spin").addEventListener("click", spin);
$("sound-toggle").addEventListener("click", toggleSound);

renderBalance();
renderGames();
updateRefill();
setInterval(updateRefill, 1000);

console.log("AnimeSlots loaded successfully 🌸");

renderProgress();









/* ANIMESLOTS_REMAINING_UPGRADES_V1 */
(function cinematicEnhancements() {
  if (window.__animeSlotsCinematicV1) return;
  window.__animeSlotsCinematicV1 = true;

  document.addEventListener("click", function (event) {
    const play = event.target.closest("[data-play]");
    const nav = event.target.closest("[data-view]");
    const explore = event.target.closest("#explore");

    if (play) {
      const panel = document.getElementById("play-panel");
      if (panel) {
        panel.classList.remove("cinematic-enter");
        void panel.offsetWidth;
        panel.classList.add("cinematic-enter");
      }
    }

    if ((nav && nav.dataset.view === "portfolio") || explore) {
      const portfolio = document.querySelector(".developer");
      if (portfolio) {
        portfolio.classList.remove("cinematic-portfolio");
        void portfolio.offsetWidth;
        portfolio.classList.add("cinematic-portfolio");
      }
    }

    if (nav) {
      const target = nav.dataset.view === "portfolio"
        ? document.querySelector(".developer")
        : nav.dataset.view === "progress"
        ? document.querySelector(".progress-page")
        : nav.dataset.view === "shop"
        ? document.querySelector(".shop-page")
        : nav.dataset.view === "settings"
        ? document.querySelector(".settings-page")
        : document.querySelector(".hero");
      if (target) {
        target.classList.remove("cinematic-section");
        void target.offsetWidth;
        target.classList.add("cinematic-section");
      }
    }
  });
})();

document.addEventListener("change", function(event) {
  if (event.target.id !== "sound-effects-toggle") return;
  soundEnabled = event.target.checked;
  localStorage.setItem(SOUND_SETTING_KEY, String(soundEnabled));
  syncSoundToggle();
});
document.addEventListener("change", function(event) {
  if (event.target.id !== "save-progress-toggle") return;
  localStorage.setItem(SAVE_SETTING_KEY, event.target.checked ? "true" : "false");
  if (!event.target.checked) clearGameData();
  renderSettings();
});
document.addEventListener("click", function(event) {
  if (!event.target.closest("#reset-everything")) return;
  if (!window.confirm("Reset ALL game progress and return to the starting balance of 250?")) return;
  clearGameData();
  window.location.reload();
});
