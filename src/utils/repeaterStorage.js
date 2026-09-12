/**
 * Repeater: play a scenario of translation steps in focus, at your pace.
 * Local only — between history/Reflection and exchange with others.
 */

const STORAGE_KEY = 'translationRepeaterTracks'

export function createStep(overrides = {}) {
  const now = Date.now()
  return {
    id: `step-${now}-${Math.random().toString(36).slice(2, 6)}`,
    from: '',
    to: '',
    note: '',
    /** seconds on screen while playing */
    durationSec: 5,
    imageUrl: '',
    ...overrides,
  }
}

export function createTrack(overrides = {}) {
  const now = Date.now()
  return {
    id: `track-${now}`,
    title: '',
    description: '',
    sourceLabel: '',
    steps: [],
    updatedAt: now,
    ...overrides,
  }
}

export function normalizeStep(step) {
  if (!step || typeof step !== 'object') return createStep()
  const durationSec = Number(step.durationSec)
  return {
    ...createStep(),
    ...step,
    from: String(step.from || '').trim(),
    to: String(step.to || '').trim(),
    note: String(step.note || '').trim(),
    imageUrl: String(step.imageUrl || '').trim(),
    durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 5,
  }
}

export function normalizeTrack(track) {
  if (!track || typeof track !== 'object') return getDemoTracks()[0]
  return {
    ...createTrack(),
    ...track,
    title: String(track.title || '').trim() || 'Без названия',
    description: String(track.description || ''),
    sourceLabel: String(track.sourceLabel || ''),
    steps: Array.isArray(track.steps) ? track.steps.map(normalizeStep) : [],
    updatedAt: Number(track.updatedAt) || Date.now(),
  }
}

export function loadTracks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDemoTracks()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return getDemoTracks()
    return ensureDemoTrack(parsed.map(normalizeTrack))
  } catch {
    return getDemoTracks()
  }
}

export function saveTracks(tracks) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tracks.map((t) => normalizeTrack({ ...t, updatedAt: Date.now() })))
    )
  } catch (e) {
    console.error('Failed to save repeater tracks:', e)
  }
}

function ensureDemoTrack(tracks) {
  const demos = getDemoTracks()
  const next = [...tracks]
  demos.forEach((demo) => {
    if (!next.some((t) => t.id === demo.id)) next.unshift(demo)
  })
  return next
}

export function upsertTrack(tracks, track) {
  const next = normalizeTrack(track)
  const idx = tracks.findIndex((t) => t.id === next.id)
  if (idx === -1) return [...tracks, next]
  return tracks.map((t, i) => (i === idx ? next : t))
}

export function stepLabel(step) {
  if (step.from && step.to) return `${step.from} → ${step.to}`
  if (step.note) return step.note
  return 'Шаг'
}

/** Curated playable slice of history_cycling — not every line, a clear scenario arc */
export function getDemoTracks() {
  const s = (from, to, note, durationSec = 5, i = 0) =>
    createStep({
      id: `demo-cycle-${i}`,
      from,
      to,
      note,
      durationSec,
    })

  const steps = [
    s('Я', 'модель 1', 'Вижу первую модель — пробный ход, закрепить понимание', 6, 1),
    s('Я', 'рычаг', 'Повторяю изменение рычага, чтобы почувствовать', 5, 2),
    s('Я', 'скорость', 'Удобная линейная скорость по касательной', 5, 3),
    s('Я', 'сила', 'Мне легче вращать', 4, 4),
    s('груз', 'масса', 'Та же масса; путь тот же по смыслу работы', 5, 5),
    s('груз', 'скорость', 'Медленнее движется при большем рычаге', 5, 6),
    s('мощность', 'время', 'Мощность падает — работа растягивается во времени', 6, 7),
    s('работа', 'итог', 'Работа сохраняется: тот же путь груза и та же сила тяжести', 6, 8),
    s('груз', 'гора', 'Масса «вырастает»: едем в горку', 5, 9),
    s('мощность', 'требование', 'Для той же скорости нужна большая мощность', 5, 10),
    s('Я', 'выбор', 'Важнее пройти дистанцию, чем держать прежнюю скорость', 6, 11),
    s('Я', 'рычаг', 'Меняю рычаг — модель 1 подходит', 5, 12),
    s('Я', 'педали', 'Важнее комфортные обороты, не линейная скорость', 6, 13),
    s('Я', 'дискомфорт', 'Больший рычаг → медленнее педали → выход из зоны комфорта', 7, 14),
    s('Я', 'модель 2', 'Вторая шестерёнка: сила та же, меняются угол и обороты', 6, 15),
    s('Я', 'модель 3', 'Расту r₁ вместе с r₂ — сохранить удобные обороты', 6, 16),
    s('Я', 'подстройка', 'В гору: рычаг на второй, обороты первой', 6, 17),
    s(
      'правило',
      'условия',
      'В гору / ровно / с горы → заранее вторая, в движении — первая',
      7,
      18
    ),
    s('Я', 'U', 'Удобные обороты и мощность — подъём пройден', 6, 19),
  ]

  return [
    createTrack({
      id: 'demo-cycling',
      title: 'Катание — сценарий повторения',
      description:
        'Демо-трек из истории «катание»: опора на модели → гора → педали → две звёздочки. Холостой ход можно остановить на том, что резонирует.',
      sourceLabel: 'Seeds → История — катание',
      steps,
    }),
  ]
}
