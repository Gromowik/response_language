/**
 * Player cards for Exchange Field (localStorage)
 * Theme ↔ Self projections a person can offer for meeting / exchange.
 */

const STORAGE_KEY = 'exchangeFieldPlayerCards'

export const PROJECTION_KINDS = [
  { id: 'base', label: 'Базовая' },
  { id: 'inTheme', label: 'В теме' },
  { id: 'today', label: 'Сегодняшняя' },
]

export function projectionKindLabel(kind) {
  return PROJECTION_KINDS.find((k) => k.id === kind)?.label || 'В теме'
}

export function createEmptyPlayerCard(overrides = {}) {
  const now = Date.now()
  return {
    id: String(now),
    createdAt: now,
    updatedAt: now,
    theme: '',
    projectionLabel: '',
    projectionKind: 'inTheme',
    selfBase: '',
    self: '',
    selfVideoUrl: '',
    selectedForExchange: false,
    ...overrides,
  }
}

export function normalizePlayerCard(card) {
  if (!card || typeof card !== 'object') return createEmptyPlayerCard()
  const kind = PROJECTION_KINDS.some((k) => k.id === card.projectionKind)
    ? card.projectionKind
    : 'inTheme'
  return {
    ...createEmptyPlayerCard(),
    ...card,
    projectionKind: kind,
    selectedForExchange: Boolean(card.selectedForExchange),
  }
}

export function loadPlayerCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDemoPlayerCards()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return getDemoPlayerCards()
    return parsed.map(normalizePlayerCard)
  } catch {
    return getDemoPlayerCards()
  }
}

export function savePlayerCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.map(normalizePlayerCard)))
  } catch (e) {
    console.error('Failed to save player cards:', e)
  }
}

export function upsertPlayerCard(cards, card) {
  const now = Date.now()
  const next = normalizePlayerCard({
    ...card,
    theme: (card.theme || '').trim(),
    projectionLabel: (card.projectionLabel || '').trim(),
    selfBase: (card.selfBase || '').trim(),
    self: (card.self || '').trim(),
    selfVideoUrl: (card.selfVideoUrl || '').trim(),
    updatedAt: now,
  })

  if (!next.id) {
    next.id = String(now)
    next.createdAt = now
  }
  if (!next.createdAt) next.createdAt = now

  const index = cards.findIndex((c) => c.id === next.id)
  if (index === -1) return [...cards, next]
  const copy = [...cards]
  copy[index] = next
  return copy
}

export function removePlayerCard(cards, id) {
  return cards.filter((c) => c.id !== id)
}

export function toggleSelectedForExchange(cards, id) {
  return cards.map((c) =>
    c.id === id ? { ...c, selectedForExchange: !c.selectedForExchange, updatedAt: Date.now() } : c
  )
}

export function validatePlayerCard(card) {
  const errors = {}
  if (!(card.theme || '').trim()) {
    errors.theme = 'Укажите тему — стартовое ядро встречи.'
  }
  if (!(card.self || '').trim()) {
    errors.self = 'Опишите «Я» — это главное для резонанса (можно «Я в теме» или честный силуэт).'
  }
  const url = (card.selfVideoUrl || '').trim()
  if (url && !/^https?:\/\//i.test(url)) {
    errors.selfVideoUrl = 'Ссылка на видео должна начинаться с http:// или https://'
  }
  return errors
}

/** Search modes: theme | self | both (AND when both queries filled) */
export function filterPlayerCards(cards, { themeQuery = '', selfQuery = '', mode = 'both' } = {}) {
  const tq = themeQuery.trim().toLowerCase()
  const sq = selfQuery.trim().toLowerCase()

  return cards.filter((card) => {
    const themeHay = (card.theme || '').toLowerCase()
    const selfHay = [card.self, card.selfBase, card.projectionLabel]
      .filter(Boolean)
      .join('\n')
      .toLowerCase()

    const themeMatch = !tq || themeHay.includes(tq)
    const selfMatch = !sq || selfHay.includes(sq)

    if (mode === 'theme') {
      if (!tq) return true
      return themeMatch
    }
    if (mode === 'self') {
      if (!sq) return true
      return selfMatch
    }
    // both = AND on provided fields
    if (tq && sq) return themeMatch && selfMatch
    if (tq) return themeMatch
    if (sq) return selfMatch
    return true
  })
}

export function groupCardsByTheme(cards) {
  const map = new Map()
  cards.forEach((card) => {
    const key = (card.theme || 'Без темы').trim() || 'Без темы'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(card)
  })
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'ru'))
    .map(([theme, items]) => ({
      theme,
      items: [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    }))
}

function getDemoPlayerCards() {
  const now = Date.now()
  return [
    normalizePlayerCard({
      id: 'demo-1',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
      theme: 'Электромагнитные волны',
      projectionLabel: 'Базовый взгляд',
      projectionKind: 'base',
      selfBase: 'Люблю разбирать явления спокойно, через образы и простые опыты.',
      self:
        'Мне интересна не формула ради формулы, а как волна становится общим языком — свет, радио, тепло. Хочу обмениваться отражениями с теми, кто тоже чувствует красоту в этом.',
      selfVideoUrl: '',
      selectedForExchange: false,
    }),
    normalizePlayerCard({
      id: 'demo-2',
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
      theme: 'Электромагнитные волны',
      projectionLabel: 'Сегодняшнее настроение',
      projectionKind: 'today',
      selfBase: '',
      self:
        'Сегодня хочется говорить мягче: не доказывать, а вместе смотреть, где в обычном дне уже есть «волна» — ритм, отклик, эхо.',
      selfVideoUrl: '',
      selectedForExchange: true,
    }),
  ]
}
