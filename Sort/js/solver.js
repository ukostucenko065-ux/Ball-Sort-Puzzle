'use strict';

/* ============================================================
   Реалізує пошук у ширину по можливих станах гри.
   Використовується для:
   перевірки, що згенерований рівень має розв'язок;
   роботи кнопки «Підказка».
   ============================================================ */

// Перетворює ігрове поле в рядок-ключ.
// Колби сортуються, тому розташування, що відрізняються лише
// порядком колб, вважаються одним станом 
function stateKey(tubes) {
  const parts = tubes.map(tube => tube.join(','));
  parts.sort();
  return parts.join('|');
}

// Шукає послідовність ходів від поточного стану до перемоги.
// Повертає масив ходів  або null, якщо розв'язку немає.
function findSolution(startTubes) {
  const queue = [startTubes];        // черга станів для перегляду
  const cameFrom = {};               // ключ стану
  cameFrom[stateKey(startTubes)] = null;

  let head = 0;                      // позиція читання в черзі
  let visitedCount = 1;              // скільки станів уже знайдено
  const MAX_STATES = 150000;         // запобіжник від надто довгого пошуку

  while (head < queue.length) {
    const tubes = queue[head++];

    // Дійшли до виграшного стану - будуємо шлях ходів.
    if (isWin(tubes)) {
      return buildPath(cameFrom, stateKey(tubes));
    }
    // Простір пошуку завеликий - припиняємо.
    if (visitedCount > MAX_STATES) {
      return null;
    }

    const key = stateKey(tubes);

    // Перебираємо всі можливі ходи з поточного стану.
    for (let from = 0; from < tubes.length; from++) {
      for (let to = 0; to < tubes.length; to++) {
        if (!canMove(tubes, from, to)) continue;

        const next = applyMove(tubes, from, to);
        const nextKey = stateKey(next);

        // Якщо такий стан уже бачили - пропускаємо.
        if (cameFrom.hasOwnProperty(nextKey)) continue;

        cameFrom[nextKey] = { prevKey: key, move: { from: from, to: to } };
        queue.push(next);
        visitedCount++;
      }
    }
  }
  return null; // черга вичерпалась - розв'язку немає
}

// Відновлює список ходів, рухаючись від кінцевого стану до початкового.
function buildPath(cameFrom, goalKey) {
  const moves = [];
  let key = goalKey;
  while (cameFrom[key] !== null) {
    const step = cameFrom[key];
    moves.push(step.move);
    key = step.prevKey;
  }
  moves.reverse(); // отримали ходи від кінця - повертаємо у прямий порядок
  return moves;
}

// Чи має рівень розв'язок.
function isSolvable(tubes) {
  return findSolution(tubes) !== null;
}
