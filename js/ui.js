'use strict';

/* ============================================================
   Відповідає за малювання поля у HTML і реакцію на кліки.
   ============================================================ */

// Малює все ігрове поле за поточним станом гри.
// onTubeClick - функція, яку викликаємо при кліку по колбі.
function render(game, onTubeClick) {
  const board = document.getElementById('board');
  board.innerHTML = '';

  game.tubes.forEach((tube, index) => {
    const tubeEl = document.createElement('div');
    tubeEl.className = 'tube';
    if (index === game.selected) tubeEl.classList.add('tube--selected');
    if (isTubeSolved(tube)) tubeEl.classList.add('tube--done');

    // Скільки верхніх куль підняти, якщо колбу обрано.
    const lifted = (index === game.selected) ? topGroupSize(tube) : 0;

    // Малюємо кулі
    for (let i = 0; i < tube.length; i++) {
      const ball = document.createElement('div');
      ball.className = 'ball';
      // колір кулі передаємо у CSS через змінну
      ball.style.setProperty('--ball-color', COLORS[tube[i]]);
      if (i >= tube.length - lifted) ball.classList.add('ball--lifted');
      tubeEl.appendChild(ball);
    }

    tubeEl.addEventListener('click', () => onTubeClick(index));
    board.appendChild(tubeEl);
  });
}

// Оновлює лічильники ходів, часу та рекорду.
function updateStats(moves, timeText, recordText) {
  document.getElementById('moves').textContent = moves;
  document.getElementById('time').textContent = timeText;
  document.getElementById('record').textContent = recordText;
}

// Показує текстову підказку чи повідомлення під полем.
function setStatus(text) {
  document.getElementById('status').textContent = text;
}

// Коротка анімація тремтіння для недозволеного ходу.
function shakeTube(index) {
  const tubeEl = document.querySelectorAll('.tube')[index];
  if (!tubeEl) return;
  tubeEl.classList.add('tube--shake');
  setTimeout(() => tubeEl.classList.remove('tube--shake'), 400);
}

// Підсвічує колбу як ціль підказки.
function highlightHint(index) {
  const tubeEl = document.querySelectorAll('.tube')[index];
  if (!tubeEl) return;
  tubeEl.classList.add('tube--hint');
  setTimeout(() => tubeEl.classList.remove('tube--hint'), 1600);
}

// Показує екран перемоги.
function showWin(moves, timeText) {
  document.getElementById('win-moves').textContent = moves;
  document.getElementById('win-time').textContent = timeText;
  document.getElementById('win').classList.remove('win--hidden');
}

// Ховає екран перемоги.
function hideWin() {
  document.getElementById('win').classList.add('win--hidden');
}

// Позначає активну кнопку складності.
function markDifficulty(difficultyKey) {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    if (btn.dataset.difficulty === difficultyKey) {
      btn.classList.add('diff-btn--active');
    } else {
      btn.classList.remove('diff-btn--active');
    }
  });
}
