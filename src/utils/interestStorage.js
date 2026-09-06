/**
 * Interests and mutual links for Exchange Field (localStorage).
 * Local prototype: no server — demo people + your local personId.
 */

import { LOCAL_PERSON_ID } from './playerCardStorage'

const INTERESTS_KEY = 'exchangeFieldInterests'
const LINKS_KEY = 'exchangeFieldLinks'

export function createInterest({ fromPersonId, toPersonId, toCardId, offerCardId = '' }) {
  const now = Date.now()
  return {
    id: `int-${now}-${Math.random().toString(36).slice(2, 7)}`,
    fromPersonId,
    toPersonId,
    toCardId,
    offerCardId: offerCardId || '',
    createdAt: now,
  }
}

export function normalizeInterest(row) {
  if (!row || typeof row !== 'object') return null
  return {
    id: String(row.id || `int-${Date.now()}`),
    fromPersonId: String(row.fromPersonId || ''),
    toPersonId: String(row.toPersonId || ''),
    toCardId: String(row.toCardId || ''),
    offerCardId: String(row.offerCardId || ''),
    createdAt: Number(row.createdAt) || Date.now(),
  }
}

export function loadInterests() {
  try {
    const raw = localStorage.getItem(INTERESTS_KEY)
    if (!raw) return getDemoInterests()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return getDemoInterests()
    return parsed.map(normalizeInterest).filter(Boolean)
  } catch {
    return getDemoInterests()
  }
}

export function saveInterests(interests) {
  try {
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(interests.map(normalizeInterest).filter(Boolean)))
  } catch (e) {
    console.error('Failed to save interests:', e)
  }
}

export function findInterest(interests, { fromPersonId, toCardId }) {
  return interests.find((i) => i.fromPersonId === fromPersonId && i.toCardId === toCardId) || null
}

export function upsertInterest(interests, interest) {
  const next = normalizeInterest(interest)
  const idx = interests.findIndex(
    (i) => i.fromPersonId === next.fromPersonId && i.toCardId === next.toCardId
  )
  if (idx === -1) return [...interests, next]
  const copy = [...interests]
  copy[idx] = { ...copy[idx], ...next, id: copy[idx].id }
  return copy
}

export function removeInterest(interests, id) {
  return interests.filter((i) => i.id !== id)
}

export function outgoingInterests(interests, personId = LOCAL_PERSON_ID) {
  return interests
    .filter((i) => i.fromPersonId === personId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function incomingInterests(interests, personId = LOCAL_PERSON_ID) {
  return interests
    .filter((i) => i.toPersonId === personId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Pair key independent of order */
export function pairKey(a, b) {
  return [a, b].sort().join('::')
}

export function createLink({ personAId, personBId, cardAId, cardBId, status = 'delayed' }) {
  const now = Date.now()
  return {
    id: `link-${now}-${Math.random().toString(36).slice(2, 7)}`,
    personAId,
    personBId,
    cardAId: cardAId || '',
    cardBId: cardBId || '',
    /** delayed = обмен с раздумьем; ready = можно идти в живой обмен (пока только метка) */
    status: status === 'ready' ? 'ready' : 'delayed',
    createdAt: now,
  }
}

export function normalizeLink(row) {
  if (!row || typeof row !== 'object') return null
  return {
    id: String(row.id || `link-${Date.now()}`),
    personAId: String(row.personAId || ''),
    personBId: String(row.personBId || ''),
    cardAId: String(row.cardAId || ''),
    cardBId: String(row.cardBId || ''),
    status: row.status === 'ready' ? 'ready' : 'delayed',
    createdAt: Number(row.createdAt) || Date.now(),
  }
}

export function loadLinks() {
  try {
    const raw = localStorage.getItem(LINKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeLink).filter(Boolean)
  } catch {
    return []
  }
}

export function saveLinks(links) {
  try {
    localStorage.setItem(LINKS_KEY, JSON.stringify(links.map(normalizeLink).filter(Boolean)))
  } catch (e) {
    console.error('Failed to save links:', e)
  }
}

export function findLinkBetween(links, personAId, personBId) {
  const key = pairKey(personAId, personBId)
  return links.find((l) => pairKey(l.personAId, l.personBId) === key) || null
}

export function upsertLink(links, link) {
  const next = normalizeLink(link)
  const existing = findLinkBetween(links, next.personAId, next.personBId)
  if (!existing) return [...links, next]
  return links.map((l) =>
    l.id === existing.id
      ? {
          ...l,
          cardAId: next.cardAId || l.cardAId,
          cardBId: next.cardBId || l.cardBId,
          status: next.status || l.status,
        }
      : l
  )
}

export function setLinkStatus(links, linkId, status) {
  return links.map((l) =>
    l.id === linkId ? { ...l, status: status === 'ready' ? 'ready' : 'delayed' } : l
  )
}

export function updateLinkCards(links, linkId, { cardAId, cardBId }) {
  return links.map((l) => {
    if (l.id !== linkId) return l
    return {
      ...l,
      cardAId: cardAId !== undefined ? cardAId : l.cardAId,
      cardBId: cardBId !== undefined ? cardBId : l.cardBId,
    }
  })
}

/**
 * Express interest; if the other side already interested in one of our cards → open a link.
 * Returns { interests, links, linked: boolean }
 */
export function expressInterestAndMaybeLink(
  interests,
  links,
  { fromPersonId, toPersonId, toCardId, offerCardId }
) {
  if (fromPersonId === toPersonId) {
    return { interests, links, linked: false, interest: null }
  }

  const interest = createInterest({ fromPersonId, toPersonId, toCardId, offerCardId })
  let nextInterests = upsertInterest(interests, interest)

  const reverse = nextInterests.find(
    (i) => i.fromPersonId === toPersonId && i.toPersonId === fromPersonId
  )

  if (!reverse) {
    return { interests: nextInterests, links, linked: false, interest }
  }

  const existing = findLinkBetween(links, fromPersonId, toPersonId)
  if (existing) {
    return { interests: nextInterests, links, linked: true, interest }
  }

  const link = createLink({
    personAId: fromPersonId,
    personBId: toPersonId,
    cardAId: offerCardId || reverse.toCardId || '',
    cardBId: toCardId || reverse.offerCardId || '',
    status: 'delayed',
  })

  return {
    interests: nextInterests,
    links: upsertLink(links, link),
    linked: true,
    interest,
  }
}

export function linkStatusLabel(status) {
  return status === 'ready' ? 'Готовы к живому обмену' : 'Обмен с задержкой'
}

function getDemoInterests() {
  const now = Date.now()
  return [
    normalizeInterest({
      id: 'int-demo-incoming',
      fromPersonId: 'demo-anna',
      toPersonId: LOCAL_PERSON_ID,
      toCardId: 'demo-1',
      offerCardId: 'demo-anna-1',
      createdAt: now - 7200000,
    }),
  ]
}
