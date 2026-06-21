'use strict';

/* ============================================================
   Містить налаштування, структури даних, правила гри,
   перевірку завершення та генерацію рівня.
   ============================================================ */

/*Налаштування */

// Місткість колби, скільки куль уміщується в повну колбу.
const CAPACITY = 4;

// Палітра кольорів. Колір кулі — це індекс елемента в масиві.
const COLORS = [
  '#d9594c', // червоний
  '#e2873f', // помаранчевий
  '#e6bd45', // жовтий
  '#7ba84e', // зелений
  '#3fa28f', // бірюзовий
  '#4d86c4', // синій
  '#8a66bb', // фіолетовий
  '#d06aa0'  // рожевий
];

// Рівні складності, кількість кольорів і кількість порожніх колб.
const DIFFICULTY = {
  easy:   { colors: 4, empty: 2 },
  medium: { colors: 6, empty: 2 },
  hard:   { colors: 8, empty: 2 }
};

/* Допоміжні функції  */

// Глибока копія ігрового поля.
function cloneTubes(tubes) {
  return tubes.map(tube => tube.slice());
}

// Колір верхньої кулі колби, null, якщо колба порожня.
function topColor(tube) {
  if (tube.length === 0) return null;
  return tube[tube.length - 1];
}

// Кількість однакових куль підряд згори колби.
function topGroupSize(tube) {
  if (tube.length === 0) return 0;
  const color = tube[tube.length - 1];
  let count = 1;
  for (let i = tube.length - 2; i >= 0; i--) {
    if (tube[i] === color) count++;
    else break;
  }
  return count;
}

// Чи всі кулі в колбі одного кольору.
function isUniform(tube) {
  for (let i = 1; i < tube.length; i++) {
    if (tube[i] !== tube[0]) return false;
  }
  return true;
}

// Чи колба «зібрана» - повна й одноколірна.
function isTubeSolved(tube) {
  return tube.length === CAPACITY && isUniform(tube);
}

/* Правила гри */

// Чи дозволено перелити кулі з колби from у колбу to.
function canMove(tubes, from, to) {
  if (from === to) return false;

  const src = tubes[from];
  const dst = tubes[to];

  if (src.length === 0) return false;          // з порожньої брати нічого
  if (isTubeSolved(src)) return false;         // зібрану колбу не чіпаємо
  if (dst.length === CAPACITY) return false;   // колба-приймач уже повна

  if (dst.length === 0) {
    // Перелив у порожню колбу не має сенсу, якщо джерело вже одноколірне.
    return !isUniform(src);
  }

  // В інших випадках кольори верхніх куль мають збігатися.
  return topColor(src) === topColor(dst);
}

// Виконати хід: повертає нове поле гри після переливання.
// Переливається вся група однакових куль згори — скільки помістить приймач.
function applyMove(tubes, from, to) {
  const result = cloneTubes(tubes);
  const src = result[from];
  const dst = result[to];

  const amount = Math.min(topGroupSize(src), CAPACITY - dst.length);
  for (let i = 0; i < amount; i++) {
    dst.push(src.pop());
  }
  return result;
}

// Чи існує хоча б один можливий хід (для виявлення глухого кута).
function hasAnyMove(tubes) {
  for (let from = 0; from < tubes.length; from++) {
    for (let to = 0; to < tubes.length; to++) {
      if (canMove(tubes, from, to)) return true;
    }
  }
  return false;
}

// Чи гру завершено — кожна колба порожня або повністю зібрана.
function isWin(tubes) {
  for (let i = 0; i < tubes.length; i++) {
    const tube = tubes[i];
    if (tube.length !== 0 && !isTubeSolved(tube)) return false;
  }
  return true;
}

/*  Генерація рівня */

// Перемішування масиву за алгоритмом Фішера-Єйтса.
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

// Створює випадкове поле гри для заданих налаштувань складності.
function createRandomTubes(settings) {
  // Список усіх куль
  const balls = [];
  for (let color = 0; color < settings.colors; color++) {
    for (let k = 0; k < CAPACITY; k++) balls.push(color);
  }

  //  Перемішуємо кулі.
  shuffle(balls);

  // Роздаємо кулі по колбах.
  const tubes = [];
  for (let t = 0; t < settings.colors; t++) {
    tubes.push(balls.slice(t * CAPACITY, t * CAPACITY + CAPACITY));
  }

  //  Додаємо порожні колби.
  for (let e = 0; e < settings.empty; e++) {
    tubes.push([]);
  }
  return tubes;
}

// Створює нове ігрове поле для заданої складності.
function generateLevel(difficultyKey) {
  const settings = DIFFICULTY[difficultyKey];
  let tubes;
  let attempts = 0;

  do {
    tubes = createRandomTubes(settings);
    attempts++;
  } while ((isWin(tubes) || !isSolvable(tubes)) && attempts < 200);

  return tubes;
}
