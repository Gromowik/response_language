/**
 * Reflection workspace: turn free thought into object cards + directed translations.
 * Local only — preparatory layer before Exchange Field / thematic plane.
 */

const STORAGE_KEY = 'translationReflectionWorkspace'

export const LOCAL_REFLECTION_ID = 'local-reflection'

export function createEmptyObject(overrides = {}) {
  const now = Date.now()
  return {
    id: `obj-${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    description: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createEmptyTranslation(overrides = {}) {
  const now = Date.now()
  return {
    id: `tr-${now}-${Math.random().toString(36).slice(2, 6)}`,
    fromId: '',
    toId: '',
    /** 0–1 weight of how much this link matters */
    importance: 0.6,
    note: '',
    /** constant | change | manifest | other */
    kind: 'constant',
    createdAt: now,
    ...overrides,
  }
}

export function createEmptyWorkspace(overrides = {}) {
  return {
    version: 1,
    reflectionText: '',
    objects: [],
    translations: [],
    updatedAt: Date.now(),
    ...overrides,
  }
}

export function normalizeWorkspace(raw) {
  const base = createEmptyWorkspace()
  if (!raw || typeof raw !== 'object') return getSeedWorkspace()
  return {
    ...base,
    ...raw,
    objects: Array.isArray(raw.objects)
      ? raw.objects.map((o) => ({
          ...createEmptyObject(),
          ...o,
          name: String(o.name || '').trim(),
          description: String(o.description || ''),
        }))
      : [],
    translations: Array.isArray(raw.translations)
      ? raw.translations.map((t) => ({
          ...createEmptyTranslation(),
          ...t,
          fromId: String(t.fromId || ''),
          toId: String(t.toId || ''),
          importance: clampImportance(t.importance),
          note: String(t.note || ''),
          kind: normalizeKind(t.kind),
        }))
      : [],
    reflectionText: String(raw.reflectionText || ''),
  }
}

function clampImportance(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

function normalizeKind(kind) {
  if (kind === 'change' || kind === 'manifest' || kind === 'constant' || kind === 'other') {
    return kind
  }
  return 'other'
}

export function loadWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getSeedWorkspace()
    return normalizeWorkspace(JSON.parse(raw))
  } catch {
    return getSeedWorkspace()
  }
}

export function saveWorkspace(workspace) {
  try {
    const next = normalizeWorkspace({ ...workspace, updatedAt: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  } catch (e) {
    console.error('Failed to save reflection workspace:', e)
    return workspace
  }
}

export function objectPower(workspace, objectId) {
  return workspace.translations
    .filter((t) => t.fromId === objectId)
    .reduce((sum, t) => sum + (Number(t.importance) || 0), 0)
}

export function incomingTranslations(workspace, objectId) {
  return workspace.translations.filter((t) => t.toId === objectId)
}

export function outgoingTranslations(workspace, objectId) {
  return workspace.translations.filter((t) => t.fromId === objectId)
}

export function findObject(workspace, id) {
  return workspace.objects.find((o) => o.id === id) || null
}

export function upsertObject(workspace, object) {
  const next = {
    ...object,
    name: (object.name || '').trim(),
    description: object.description || '',
    updatedAt: Date.now(),
  }
  if (!next.id) next.id = createEmptyObject().id
  if (!next.createdAt) next.createdAt = Date.now()
  const idx = workspace.objects.findIndex((o) => o.id === next.id)
  const objects =
    idx === -1
      ? [...workspace.objects, next]
      : workspace.objects.map((o, i) => (i === idx ? next : o))
  return { ...workspace, objects }
}

export function removeObject(workspace, objectId) {
  return {
    ...workspace,
    objects: workspace.objects.filter((o) => o.id !== objectId),
    translations: workspace.translations.filter(
      (t) => t.fromId !== objectId && t.toId !== objectId
    ),
  }
}

export function upsertTranslation(workspace, translation) {
  const next = {
    ...translation,
    importance: clampImportance(translation.importance),
    note: (translation.note || '').trim(),
    kind: normalizeKind(translation.kind),
  }
  if (!next.id) next.id = createEmptyTranslation().id
  if (!next.createdAt) next.createdAt = Date.now()
  const idx = workspace.translations.findIndex((t) => t.id === next.id)
  const translations =
    idx === -1
      ? [...workspace.translations, next]
      : workspace.translations.map((t, i) => (i === idx ? next : t))
  return { ...workspace, translations }
}

export function removeTranslation(workspace, translationId) {
  return {
    ...workspace,
    translations: workspace.translations.filter((t) => t.id !== translationId),
  }
}

export function kindLabel(kind) {
  switch (kind) {
    case 'constant':
      return 'Константа / суть'
    case 'change':
      return 'Перемена'
    case 'manifest':
      return 'Яркое проявление'
    default:
      return 'Другое'
  }
}

/**
 * Seed built from public/example.md — wheel / lever reflection → translations.
 */
export function getSeedWorkspace(reflectionText = DEFAULT_SEED_REFLECTION) {
  const ids = {
    load: 'seed-load',
    me: 'seed-me',
    wheel1: 'seed-wheel1',
    wheel2: 'seed-wheel2',
    lever: 'seed-lever',
    massConst: 'seed-mass-const',
    wrapRadius: 'seed-wrap-radius',
    handSpeed: 'seed-hand-speed',
    forceRange: 'seed-force-range',
    workDone: 'seed-work-done',
    powerTransfer: 'seed-power-transfer',
    powerFeel: 'seed-power-feel',
    liftSpeed: 'seed-lift-speed',
  }

  const objects = [
    createEmptyObject({
      id: ids.load,
      name: 'Груз',
      description: 'То, что поднимается цепью/ремнём. В примере держит постоянную массу.',
    }),
    createEmptyObject({
      id: ids.me,
      name: 'Я (приложение сил)',
      description: 'Кто крутит рычаг: удобная скорость и доступный диапазон силы.',
    }),
    createEmptyObject({
      id: ids.wheel1,
      name: 'Первое колесо',
      description: 'Сторона приложения сил / больший радиус рычага.',
    }),
    createEmptyObject({
      id: ids.wheel2,
      name: 'Второе колесо',
      description: 'Сторона намотки цепи с грузом (может быть тем же колесом с другим радиусом).',
    }),
    createEmptyObject({
      id: ids.lever,
      name: 'Рычаг (позиция)',
      description: 'То, что в примере меняется первым: радиус приложения сил.',
    }),
    createEmptyObject({
      id: ids.massConst,
      name: 'Постоянная масса',
      description: 'Константа груза — что сохраняется при сдвиге рычага.',
    }),
    createEmptyObject({
      id: ids.wrapRadius,
      name: 'Радиус намотки',
      description: 'Геометрия стороны груза; в примере тоже как константа на первом шаге.',
    }),
    createEmptyObject({
      id: ids.handSpeed,
      name: 'Скорость ручки',
      description: 'Удобная касательная скорость, с которой «я» выражаю себя.',
    }),
    createEmptyObject({
      id: ids.forceRange,
      name: 'Диапазон силы',
      description: 'Какую силу я могу устойчиво прилагать.',
    }),
    createEmptyObject({
      id: ids.workDone,
      name: 'Сделанная работа',
      description: 'Итог, который остаётся во времени (груз на высоте), независимо от темпа.',
    }),
    createEmptyObject({
      id: ids.powerTransfer,
      name: 'Мощность передачи',
      description: 'Связанный темп: вход и выход транслируют мощность вместе.',
    }),
    createEmptyObject({
      id: ids.powerFeel,
      name: 'Мощность на рычаге (ощущение)',
      description: 'Яркое проявление: с увеличением радиуса сила/мощность давления падает.',
    }),
    createEmptyObject({
      id: ids.liftSpeed,
      name: 'Скорость подъёма груза',
      description: 'Яркое проявление на стороне груза: подъём становится медленнее.',
    }),
  ]

  const tr = (fromId, toId, note, kind, importance) =>
    createEmptyTranslation({
      id: `seed-tr-${fromId}-${toId}`,
      fromId,
      toId,
      note,
      kind,
      importance,
    })

  const translations = [
    tr(ids.load, ids.massConst, 'груз → постоянная масса', 'constant', 0.9),
    tr(ids.load, ids.wrapRadius, 'груз → постоянный радиус намотки / второе колесо', 'constant', 0.75),
    tr(ids.me, ids.handSpeed, 'я → постоянная скорость движения ручки', 'constant', 0.85),
    tr(ids.me, ids.forceRange, 'я → постоянный диапазон возможной силы', 'constant', 0.7),
    tr(ids.wheel1, ids.workDone, 'первое колесо → сделанная работа', 'constant', 0.8),
    tr(ids.wheel2, ids.workDone, 'второе колесо → сделанная работа', 'constant', 0.8),
    tr(
      ids.wheel1,
      ids.powerTransfer,
      'первое и второе колесо → мощность передачи (равная в каждый момент)',
      'constant',
      0.85
    ),
    tr(
      ids.wheel2,
      ids.powerTransfer,
      'первое и второе колесо → мощность передачи (равная в каждый момент)',
      'constant',
      0.85
    ),
    tr(
      ids.lever,
      ids.powerTransfer,
      'Позиция рычага изменилась: радиус приложения вырос; мощность в каждый момент всё ещё равна на обеих сторонах, но другая по величине',
      'change',
      0.7
    ),
    tr(
      ids.wheel1,
      ids.powerFeel,
      'первое колесо → мощность, с которой я давлю рычаг, падает',
      'manifest',
      0.9
    ),
    tr(
      ids.wheel2,
      ids.liftSpeed,
      'второе колесо → скорость подъёма груза падает',
      'manifest',
      0.9
    ),
  ]

  return createEmptyWorkspace({
    reflectionText,
    objects,
    translations,
  })
}

export const DEFAULT_SEED_REFLECTION = `Для упрощения, выберем два константных случая. Мы смотрим или работу равную… или мощность равную.

У нас есть два колеса к примеру, или одно. Если одно колесо — на него наматывается ремень/цепь с грузом массы m, и рычаг на большем радиусе, которым мы двигаем колесо.

Работа — итог, который остаётся во времени (груз перевезён / поднят). Мощность — здесь и сейчас: удобный темп приложения сил.

Мы сдвигаем рычаг дальше по радиусу: вращать легче (момент), но путь руки больше — работа та же, если груз и высота те же. Меняется мощность и скорость подъёма.

Трансляции фиксируют, что сохраняется и что проявляется при перемене. Рычаг меняем первым; константы сути оставляем «на потом» — от простого к сложному.

Знак трансляции: →

(Полный текст размышления — в public/example.md; этот сид уже разложен в карточки справа.)`
