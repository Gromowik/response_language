/**
 * Player cards for Exchange Field (localStorage)
 * Theme ↔ Self projections a person can offer for meeting / exchange.
 */

const STORAGE_KEY = 'exchangeFieldPlayerCards'

/** Cards you create in this browser belong to this person */
export const LOCAL_PERSON_ID = 'local'
export const LOCAL_PERSON_NAME = 'Я (локально)'

export const PROJECTION_KINDS = [
  { id: 'base', label: 'Базовая' },
  { id: 'inTheme', label: 'В теме' },
  { id: 'today', label: 'Сегодняшняя' },
]

export function projectionKindLabel(kind) {
  return PROJECTION_KINDS.find((k) => k.id === kind)?.label || 'В теме'
}

export function isOwnCard(card, personId = LOCAL_PERSON_ID) {
  return (card?.personId || LOCAL_PERSON_ID) === personId
}

export function createEmptyPlayerCard(overrides = {}) {
  const now = Date.now()
  return {
    id: String(now),
    createdAt: now,
    updatedAt: now,
    personId: LOCAL_PERSON_ID,
    personName: LOCAL_PERSON_NAME,
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
  const personId = card.personId || LOCAL_PERSON_ID
  return {
    ...createEmptyPlayerCard(),
    ...card,
    personId,
    personName: card.personName || (personId === LOCAL_PERSON_ID ? LOCAL_PERSON_NAME : personId),
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
    return ensureDemoOthers(parsed.map(normalizePlayerCard))
  } catch {
    return getDemoPlayerCards()
  }
}

/** If user already had local cards, still surface demo others for phase 4 */
function ensureDemoOthers(cards) {
  const demos = getDemoPlayerCards().filter((c) => !isOwnCard(c))
  const next = [...cards]
  demos.forEach((demo) => {
    if (!next.some((c) => c.id === demo.id)) next.push(demo)
  })
  return next
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

export function ownCards(cards, personId = LOCAL_PERSON_ID) {
  return cards.filter((c) => isOwnCard(c, personId))
}

export function othersCards(cards, personId = LOCAL_PERSON_ID) {
  return cards.filter((c) => !isOwnCard(c, personId))
}

export function personLabel(cardOrId, cards = []) {
  if (cardOrId && typeof cardOrId === 'object') {
    return cardOrId.personName || cardOrId.personId || '—'
  }
  const id = String(cardOrId || '')
  if (id === LOCAL_PERSON_ID) return LOCAL_PERSON_NAME
  const found = cards.find((c) => c.personId === id)
  return found?.personName || id || '—'
}

function getDemoPlayerCards() {
  const now = Date.now()
  return [
    normalizePlayerCard({
      id: 'demo-1',
      personId: LOCAL_PERSON_ID,
      personName: LOCAL_PERSON_NAME,
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
      personId: LOCAL_PERSON_ID,
      personName: LOCAL_PERSON_NAME,
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
    normalizePlayerCard({
      id: 'demo-anna-1',
      personId: 'demo-anna',
      personName: 'Анна (демо)',
      createdAt: now - 5000000,
      updatedAt: now - 5000000,
      theme: 'Электромагнитные волны',
      projectionLabel: 'Свет как разговор',
      projectionKind: 'inTheme',
      selfBase: 'Люблю медленные разговоры и точные слова.',
      self:
        'Волны для меня — про то, как отклик доходит не сразу. Ищу человека, с кем можно обмениваться отражениями с паузой и вниманием.',
      selectedForExchange: false,
    }),
    normalizePlayerCard({
      id: 'demo-boris-1',
      personId: 'demo-boris',
      personName: 'Борис (демо)',
      createdAt: now - 4000000,
      updatedAt: now - 4000000,
      theme: 'Музыка и ритм',
      projectionLabel: 'Пульс дня',
      projectionKind: 'today',
      selfBase: '',
      self:
        'Слушаю город как партитуру. Хочу обменяться с кем-то, кто тоже слышит ритм в обычных вещах.',
      selectedForExchange: false,
    }),
  ]
}
