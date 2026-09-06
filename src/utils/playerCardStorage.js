/**
 * Player cards for Exchange Field (localStorage only, Phase 1)
 * Theme ↔ Self projections a person can offer for meeting / exchange.
 */

const STORAGE_KEY = 'exchangeFieldPlayerCards'

export function createEmptyPlayerCard() {
  const now = Date.now()
  return {
    id: String(now),
    createdAt: now,
    updatedAt: now,
    theme: '',
    projectionLabel: '',
    selfBase: '',
    self: '',
    selfVideoUrl: '',
  }
}

export function loadPlayerCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDemoPlayerCards()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return getDemoPlayerCards()
    return parsed
  } catch {
    return getDemoPlayerCards()
  }
}

export function savePlayerCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  } catch (e) {
    console.error('Failed to save player cards:', e)
  }
}

export function upsertPlayerCard(cards, card) {
  const now = Date.now()
  const next = {
    ...card,
    theme: (card.theme || '').trim(),
    projectionLabel: (card.projectionLabel || '').trim(),
    selfBase: (card.selfBase || '').trim(),
    self: (card.self || '').trim(),
    selfVideoUrl: (card.selfVideoUrl || '').trim(),
    updatedAt: now,
  }

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

function getDemoPlayerCards() {
  const now = Date.now()
  return [
    {
      id: 'demo-1',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
      theme: 'Электромагнитные волны',
      projectionLabel: 'Я сегодня в этой теме',
      selfBase: 'Люблю разбирать явления спокойно, через образы и простые опыты.',
      self:
        'Мне интересна не формула ради формулы, а как волна становится общим языком — свет, радио, тепло. Хочу обмениваться отражениями с теми, кто тоже чувствует красоту в этом.',
      selfVideoUrl: '',
    },
  ]
}
