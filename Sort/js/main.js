'use strict';

/* ============================================================
   Зберігає стан гри та з'єднує логіку (game.js, solver.js)
   з інтерфейсом (ui.js). Обробляє натискання кнопок.
   ============================================================ */

/*Стан гри */
const game = {
  tubes: [],            // поточне ігрове поле
  initialTubes: [],     // поле на початку рівня (для кнопки «Заново»)
  selected: null,       // індекс обраної колби або null
  moves: 0,             // кількість зроблених ходів
  history: [],          // попередні стани (для скасування ходу)
  difficulty: 'easy',   // поточна складність
  seconds: 0,           // лічильник часу гри
  timerId: null,        // ідентифікатор таймера
  finished: false       // чи завершено рівень
};

/*  Таймер */

// Перетворює секунди у формат «хв:сек».
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function startTimer() {
  stopTimer();
  game.timerId = setInterval(() => {
    game.seconds++;
    refreshStats();
  }, 1000);
}

function stopTimer() {
  if (game.timerId !== null) {
    clearInterval(game.timerId);
    game.timerId = null;
  }
}

/*  Рекорди (зберігаються в браузері)*/

function recordKey() {
  return 'ballsort_best_' + game.difficulty;
}

function getRecord() {
  const value = localStorage.getItem(recordKey());
  return value ? Number(value) : null;
}

function saveRecord(moves) {
  const best = getRecord();
  if (best === null || moves < best) {
    localStorage.setItem(recordKey(), String(moves));
  }
}

/* Оновлення інтерфейсу  */

function refreshStats() {
  const best = getRecord();
  updateStats(
    game.moves,
    formatTime(game.seconds),
    best === null ? '—' : best + ' ходів'
  );
}

function redraw() {
  render(game, onTubeClick);
  refreshStats();
}

/* Запуск рівня  */

function newGame() {
  game.tubes = generateLevel(game.difficulty);
  game.initialTubes = cloneTubes(game.tubes);
  resetProgress();
  setStatus('Оберіть колбу, щоб зробити хід');
}

function restartGame() {
  game.tubes = cloneTubes(game.initialTubes);
  resetProgress();
  setStatus('Рівень почато спочатку');
}

// Скидає лічильники, перезапускає таймер і перемальовує поле.
function resetProgress() {
  game.selected = null;
  game.moves = 0;
  game.history = [];
  game.seconds = 0;
  game.finished = false;
  hideWin();
  startTimer();
  redraw();
}

/* Обробка ходу гравця  */

function onTubeClick(index) {
  if (game.finished) return;

  // Перший клік - обираємо колбу-джерело.
  if (game.selected === null) {
    if (game.tubes[index].length === 0) {
      setStatus('Ця колба порожня — оберіть іншу');
      return;
    }
    game.selected = index;
    setStatus('Тепер оберіть колбу-приймач');
    redraw();
    return;
  }

  // Повторний клік по тій самій колбі - знімаємо вибір.
  if (game.selected === index) {
    game.selected = null;
    setStatus('Оберіть колбу, щоб зробити хід');
    redraw();
    return;
  }

  // Другий клік - намагаємось зробити хід.
  if (canMove(game.tubes, game.selected, index)) {
    game.history.push(cloneTubes(game.tubes)); // зберігаємо для скасування
    game.tubes = applyMove(game.tubes, game.selected, index);
    game.moves++;
    game.selected = null;
    setStatus('Оберіть колбу, щоб зробити хід');
    redraw();
    checkWin();
  } else {
    // Хід недозволений - переобираємо джерело й трясемо колбу.
    const dstFull = game.tubes[index].length === CAPACITY;
    game.selected = (game.tubes[index].length > 0) ? index : null;
    redraw();
    shakeTube(index);
    if (dstFull) {
      setStatus('Так не можна - колба-приймач уже повна');
    } else {
      setStatus('Так не можна - кольори не збігаються');
    }
  }
}

/* Перевірка стану гри  */

function checkWin() {
  if (isWin(game.tubes)) {
    game.finished = true;
    stopTimer();
    saveRecord(game.moves);
    refreshStats();
    showWin(game.moves, formatTime(game.seconds));
  } else if (!hasAnyMove(game.tubes)) {
    setStatus('Глухий кут! Скасуйте хід або почніть заново');
  }
}

/* Скасування ходу  */

function undoMove() {
  if (game.finished || game.history.length === 0) return;
  game.tubes = game.history.pop();
  game.moves--;
  game.selected = null;
  redraw();
  setStatus('Хід скасовано');
}

/* Підказка  */

function showHint() {
  if (game.finished) return;
  setStatus('Шукаю найкращий хід...');

  // Невелика затримка, щоб устиг оновитися текст статусу.
  setTimeout(() => {
    const solution = findSolution(game.tubes);
    if (solution === null || solution.length === 0) {
      setStatus('Підказки немає — спробуйте скасувати хід');
      return;
    }
    const move = solution[0];
    game.selected = move.from;
    redraw();
    highlightHint(move.to);
    setStatus('Підказка: перелийте у підсвічену колбу');
  }, 30);
}

/* Зміна складності  */

function changeDifficulty(difficultyKey) {
  game.difficulty = difficultyKey;
  markDifficulty(difficultyKey);
  newGame();
}

/* Прив'язка кнопок  */

function setupControls() {
  document.getElementById('btn-new').addEventListener('click', newGame);
  document.getElementById('btn-restart').addEventListener('click', restartGame);
  document.getElementById('btn-undo').addEventListener('click', undoMove);
  document.getElementById('btn-hint').addEventListener('click', showHint);
  document.getElementById('btn-win-next').addEventListener('click', newGame);

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => changeDifficulty(btn.dataset.difficulty));
  });
}

/*Старт програми  */

function init() {
  setupControls();
  markDifficulty(game.difficulty);
  newGame();
}

// Запускаємо гру після завантаження сторінки.
window.addEventListener('DOMContentLoaded', init);
