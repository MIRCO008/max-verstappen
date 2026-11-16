/* Minijuegos de la página principal. */

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const getBest = (k) => {
  try { const v = localStorage.getItem(k); return v == null ? null : Number(v); } catch { return null; }
};
const setBest = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const fmtMs = (n) => (n == null || Number.isNaN(n) ? "--" : Math.round(n) + " ms");
const fmtSec = (n) => (n == null || Number.isNaN(n) ? "--" : n.toFixed(2) + " s");

/* ===== Juego 1: Reflejos de largada ===== */
(function () {
  const lights = document.querySelectorAll("#lights .light");
  const btn = document.getElementById("reaction-btn");
  const msg = document.getElementById("reaction-msg");
  const bestEl = document.getElementById("reaction-best");
  if (!btn || !msg || !bestEl || lights.length === 0) return;

  let state = "idle";
  let timers = [];
  let goTime = 0;

  const showBest = () => {
    const b = getBest("bestReaction");
    bestEl.textContent = b != null ? b + " ms" : "--";
  };
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; };
  const lightsOff = () => lights.forEach((l) => l.classList.remove("on"));

  function start() {
    clearAll();
    lightsOff();
    state = "waiting";
    msg.textContent = "Atento...";
    btn.textContent = "¡Ahora!";
    lights.forEach((l, i) => timers.push(setTimeout(() => l.classList.add("on"), 700 * (i + 1))));
    timers.push(setTimeout(() => {
      lightsOff();
      state = "go";
      goTime = performance.now();
      msg.textContent = "¡YA!";
    }, 3500 + 500 + Math.random() * 2500));
  }

  btn.addEventListener("click", () => {
    if (state === "idle") return start();
    if (state === "waiting") {
      clearAll();
      lightsOff();
      state = "idle";
      msg.textContent = "¡Salida en falso! Penalización de 5 segundos.";
      btn.textContent = "Reintentar";
      return;
    }
    if (state !== "go") return;
    const ms = Math.round(performance.now() - goTime);
    state = "idle";
    btn.textContent = "Reintentar";
    const best = getBest("bestReaction");
    if (best == null || ms < best) {
      setBest("bestReaction", ms);
      msg.textContent = `${ms} ms. ¡Nuevo récord!`;
    } else {
      msg.textContent = `${ms} ms`;
    }
    showBest();
  });

  showBest();
})();

/* ===== Juego 2: Memoria de boxes (tiempo + movimientos) ===== */
(function () {
  const icons = ["🏎️","🏁","🏆","🔧","🛞","⛽","🚥","⭐"];
  const grid = document.getElementById("mem-grid");
  const msg = document.getElementById("memory-msg");
  const movesEl = document.getElementById("memory-moves");
  const bestEl = document.getElementById("memory-best");
  const timeEl = document.getElementById("memory-time");
  const resetBtn = document.getElementById("memory-reset");
  if (!grid || !msg || !movesEl || !bestEl || !resetBtn) return;

  let first = null, lock = false, moves = 0, matched = 0;
  let startTime = null, timerId = null, elapsed = 0, started = false, finished = false;

  const stopTimer = () => { if (timerId) { clearInterval(timerId); timerId = null; } };
  const tick = () => {
    if (!startTime) return;
    elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (timeEl) timeEl.textContent = elapsed + "s";
  };
  const startTimer = () => {
    if (started) return;
    started = true; startTime = Date.now();
    timerId = setInterval(tick, 250);
  };
  const showBest = () => {
    const b = getBest("bestMemoryMoves");
    bestEl.textContent = b != null ? b + " mov." : "--";
  };

  function build() {
    stopTimer();
    grid.innerHTML = "";
    first = null; lock = false; moves = 0; matched = 0; started = false; finished = false; elapsed = 0; startTime = null;
    movesEl.textContent = "0";
    if (timeEl) timeEl.textContent = "0s";
    msg.textContent = "";
    shuffle([...icons, ...icons]).forEach((icon) => {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "mem-card";
      c.textContent = "?";
      c.dataset.icon = icon;
      c.setAttribute("aria-label", "Carta boca abajo");
      c.addEventListener("click", () => flip(c));
      grid.appendChild(c);
    });
  }

  function flip(c) {
    if (lock || finished || c === first || c.classList.contains("matched")) return;
    startTimer();
    c.classList.add("flipped");
    c.textContent = c.dataset.icon;
    c.setAttribute("aria-label", "Carta " + c.dataset.icon);
    if (!first) { first = c; return; }
    moves++; movesEl.textContent = moves;
    if (first.dataset.icon === c.dataset.icon) {
      first.classList.add("matched"); c.classList.add("matched");
      first = null; matched++;
      if (matched === icons.length) {
        finished = true; stopTimer(); tick();
        const best = getBest("bestMemoryMoves");
        const record = best == null || moves < best;
        if (record) setBest("bestMemoryMoves", moves);
        msg.textContent = `¡Completado! ${moves} movimientos en ${elapsed}s.` + (record ? " ¡Nuevo récord!" : "");
        showBest();
      }
    } else {
      lock = true;
      const a = first; first = null;
      setTimeout(() => {
        [a, c].forEach((x) => {
          x.classList.remove("flipped");
          x.textContent = "?";
          x.setAttribute("aria-label", "Carta boca abajo");
        });
        lock = false;
      }, 700);
    }
  }

  resetBtn.addEventListener("click", build);
  build(); showBest();
})();

/* ===== Juego 3: Trivia ===== */
(function () {
  const box = document.getElementById("quiz-box");
  if (!box) return;

  const questions = [
    { q: "¿Con qué edad debutó Max en la F1?", o: ["17 años","19 años","21 años","18 años"], a: 0 },
    { q: "¿En qué Gran Premio logró su primera victoria, en 2016?", o: ["España","Mónaco","Bélgica","Austria"], a: 0 },
    { q: "¿Cuántos campeonatos mundiales ganó consecutivamente (2021-2024)?", o: ["4","3","5","2"], a: 0 },
    { q: "¿Dónde ganó su primer título mundial?", o: ["Abu Dabi","Interlagos","Suzuka","Monza"], a: 0 },
    { q: "¿Cuántas victorias consiguió en la temporada 2023?", o: ["19","15","17","21"], a: 0 },
    { q: "¿Con qué equipo compite en simracing?", o: ["Team Redline","Team Virtual","Max Sim","Red Racing"], a: 0 },
    { q: "¿Cómo se llama su padre, ex piloto de F1?", o: ["Jos Verstappen","Nelson Piquet","Keke Rosberg","Jan Lammers"], a: 0 },
    { q: "¿En qué país nació Max Verstappen?", o: ["Bélgica","Países Bajos","Austria","Alemania"], a: 0 },
    { q: "¿Qué récord de victorias consecutivas logró en 2023?", o: ["10","8","12","9"], a: 0 },
  ];

  let list, idx, score;

  function start() {
    list = shuffle(questions);
    idx = 0; score = 0;
    render();
  }

  function render() {
    box.innerHTML = "";
    if (idx >= list.length) {
      const best = getBest("bestQuiz");
      const record = best == null || score > best;
      if (record) setBest("bestQuiz", score);
      const pct = Math.round((score / list.length) * 100);
      const verdict = score === list.length ? "¡Perfecto! Sos un verdadero fan." : score >= Math.ceil(list.length*0.7) ? "¡Muy bien!" : "Buen intento, ¡seguí practicando!";
      box.innerHTML = `<p class="game-msg">Resultado: ${score} / ${list.length} (${pct}%)</p>
        <p class="game-desc">${verdict}${record ? " ¡Nuevo récord!" : ""}</p>
        <p class="game-stats">Mejor puntaje: ${getBest("bestQuiz") ?? score} / ${list.length}</p>`;
      const again = document.createElement("button");
      again.type = "button"; again.className = "game-btn"; again.textContent = "Jugar de nuevo";
      again.addEventListener("click", start);
      box.appendChild(again);
      return;
    }

    const cur = list[idx];
    const p = document.createElement("p");
    p.className = "quiz-q";
    p.textContent = `Pregunta ${idx + 1} de ${list.length}: ${cur.q}`;
    const opts = document.createElement("div");
    opts.className = "quiz-opts";
    const correctText = cur.o[cur.a];
    shuffle(cur.o.slice()).forEach((text) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "quiz-opt"; b.textContent = text;
      b.addEventListener("click", () => {
        if (b.disabled) return;
        opts.querySelectorAll("button").forEach((x) => {
          x.disabled = true;
          if (x.textContent === correctText) x.classList.add("correct");
        });
        const ok = text === correctText;
        if (ok) score++; else b.classList.add("wrong");
        setTimeout(() => { idx++; render(); }, 900);
      });
      opts.appendChild(b);
    });
    box.append(p, opts);
  }
  start();
})();

/* ===== Juego 4: Mayor o menor (victorias por temporada) ===== */
(function () {
  const box = document.getElementById("higher-box");
  if (!box) return;

  const seasons = [
    { year: 2015, wins: 0 }, { year: 2016, wins: 1 }, { year: 2017, wins: 2 }, { year: 2018, wins: 2 },
    { year: 2019, wins: 3 }, { year: 2020, wins: 2 }, { year: 2021, wins: 10 }, { year: 2022, wins: 15 },
    { year: 2023, wins: 19 }, { year: 2024, wins: 9 }, { year: 2025, wins: 8 }, { year: 2026, wins: 3 }
  ];

  let pair = [], streak = 0, rounds = 0, answered = false;
  const TOTAL = 10;

  function pickPair() {
    let a = seasons[Math.floor(Math.random() * seasons.length)];
    let b = seasons[Math.floor(Math.random() * seasons.length)];
    let guard = 0;
    while ((a.year === b.year || a.wins === b.wins) && guard < 50) {
      b = seasons[Math.floor(Math.random() * seasons.length)];
      guard++;
    }
    if (a.wins === b.wins) b = seasons.find(s => s.year !== a.year && s.wins !== a.wins) || b;
    pair = Math.random() < 0.5 ? [a, b] : [b, a];
  }

  function render(endMsg) {
    box.innerHTML = "";
    if (rounds >= TOTAL) {
      const best = getBest("bestHigherStreak");
      const record = best == null || streak > best;
      if (record) setBest("bestHigherStreak", streak);
      box.innerHTML = `<p class="game-msg">Ronda terminada</p>
        <p class="game-desc">${endMsg || ""} Racha final: <strong>${streak}</strong>.</p>
        <p class="game-stats">Mejor racha: ${getBest("bestHigherStreak") ?? streak}</p>`;
      const again = document.createElement("button");
      again.type = "button"; again.className = "game-btn"; again.textContent = "Jugar de nuevo";
      again.addEventListener("click", () => { streak = 0; rounds = 0; answered = false; pickPair(); render(); });
      box.appendChild(again);
      return;
    }

    const [a,b] = pair;
    const info = document.createElement("p");
    info.className = "quiz-q";
    info.textContent = `Ronda ${rounds + 1} de ${TOTAL} · Racha: ${streak} · ¿Qué temporada tuvo más victorias?`;
    const opts = document.createElement("div");
    opts.className = "quiz-opts";

    [a,b].forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-opt";
      btn.textContent = `${s.year}`;
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const correct = (a.wins === b.wins) ? s : (a.wins > b.wins ? a : b);
        const ok = s.year === correct.year;
        opts.querySelectorAll("button").forEach((x) => {
          x.disabled = true;
          const yr = Number(x.textContent);
          const item = yr === a.year ? a : b;
          x.textContent = `${item.year} — ${item.wins} victorias`;
          if (item.year === correct.year) x.classList.add("correct");
        });
        if (ok) {
          streak++;
          msgAfter(`¡Correcto! ${correct.year} tuvo más victorias.`);
        } else {
          btn.classList.add("wrong");
          const prev = streak;
          streak = 0;
          msgAfter(`Incorrecto. ${a.year}: ${a.wins} · ${b.year}: ${b.wins}. Racha reiniciada (era ${prev}).`);
        }
      });
      opts.appendChild(btn);
    });

    const msg = document.createElement("p");
    msg.className = "game-msg";
    msg.id = "higher-msg";
    msg.textContent = "Elegí una opción.";

    const best = document.createElement("p");
    best.className = "game-stats";
    best.textContent = `Mejor racha: ${getBest("bestHigherStreak") ?? 0}`;

    box.append(info, opts, msg, best);
  }

  function msgAfter(text) {
    const m = document.getElementById("higher-msg");
    if (m) m.textContent = text;
    rounds++;
    setTimeout(() => {
      answered = false;
      if (rounds < TOTAL) { pickPair(); render(); }
      else { render(text); }
    }, 1200);
  }

  pickPair();
  render();
})();

/* ===== Juego 5: Atrapa el trofeo ===== */
(function () {
  const arena = document.getElementById("catch-arena");
  const target = document.getElementById("catch-target");
  const btn = document.getElementById("catch-btn");
  const msg = document.getElementById("catch-msg");
  const timeEl = document.getElementById("catch-time");
  const scoreEl = document.getElementById("catch-score");
  const bestEl = document.getElementById("catch-best");
  if (!arena || !target || !btn || !msg || !timeEl || !scoreEl || !bestEl) return;

  let running = false, score = 0, timeLeft = 20, timerId = null, moveId = null;

  const showBest = () => { const b = getBest("bestCatchScore"); bestEl.textContent = b != null ? b : "--"; };
  const placeTarget = () => {
    const aw = arena.clientWidth, ah = arena.clientHeight;
    const tw = target.offsetWidth || 52, th = target.offsetHeight || 52;
    const pad = 6;
    const x = Math.max(pad, Math.floor(Math.random() * Math.max(1, aw - tw - pad * 2)));
    const y = Math.max(pad, Math.floor(Math.random() * Math.max(1, ah - th - pad * 2)));
    target.style.left = x + "px";
    target.style.top = y + "px";
  };

  function stopGame(endText) {
    running = false;
    clearInterval(timerId); clearTimeout(moveId);
    timerId = null; moveId = null;
    target.classList.remove("visible");
    const best = getBest("bestCatchScore");
    if (best == null || score > best) {
      setBest("bestCatchScore", score);
      msg.textContent = (endText || "¡Tiempo!") + ` Puntaje: ${score}. ¡Nuevo récord!`;
    } else {
      msg.textContent = (endText || "¡Tiempo!") + ` Puntaje: ${score}.`;
    }
    btn.textContent = "Jugar de nuevo";
    showBest();
  }

  function scheduleMove() {
    if (!running) return;
    // el trofeo se mueve solo si tardás, para hacerlo más dinámico
    const delay = Math.max(550, 1100 - score * 15);
    moveId = setTimeout(() => {
      if (!running) return;
      placeTarget();
      scheduleMove();
    }, delay);
  }

  function startGame() {
    running = true; score = 0; timeLeft = 20;
    scoreEl.textContent = "0"; timeEl.textContent = "20";
    msg.textContent = "¡Atrapalo!";
    btn.textContent = "En juego...";
    btn.disabled = true;
    target.classList.add("visible");
    placeTarget();
    scheduleMove();
    timerId = setInterval(() => {
      timeLeft--;
      timeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        btn.disabled = false;
        stopGame("¡Se acabó el tiempo!");
      }
    }, 1000);
  }

  target.addEventListener("click", (e) => {
    e.preventDefault();
    if (!running) return;
    score++;
    scoreEl.textContent = String(score);
    placeTarget();
    clearTimeout(moveId);
    scheduleMove();
  });

  btn.addEventListener("click", () => {
    if (running) return;
    btn.disabled = false;
    startGame();
  });

  // posición inicial oculta
  target.classList.remove("visible");
  showBest();
})();
