const STORAGE_KEY = 'rl_work_attention_v1'
const PERSON1_DRAFT_KEY = 'rl_work_attention_person1_draft'

function uid(prefix = 'att') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function emptyAttentionItem(partial = {}) {
  return {
    id: uid(),
    order: 1,
    name: '',
    text: '',
    note: '',
    sourceKind: 'manual', // o | vo | center | translation | manual
    sourceId: null,
    highlights: [],
    formula: null,
    magnitude: null,
    ...partial,
  }
}

export function loadAttentionTape() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveAttentionTape(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function sortAttention(items) {
  return [...(items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function blockOf(host, key) {
  return host?.L?.find((item) => Object.prototype.hasOwnProperty.call(item, key))?.[key]
}

/** Карточка с текущего выбора на Ring Demo. */
export function itemFromSelection({ kind, host, node, center, translation }) {
  if (kind === 'o' && host) {
    return emptyAttentionItem({
      order: 0,
      name: host.M?.O?.name || 'O',
      text: host.M?.O?.description || '',
      sourceKind: 'o',
      sourceId: host.M?.id || 'O',
    })
  }
  if (kind === 'vo' && node) {
    return emptyAttentionItem({
      name: node.M?.O?.tastes || node.M?.id,
      text: node.M?.O?.description || '',
      magnitude: node.M?.O?.magnitude || null,
      sourceKind: 'vo',
      sourceId: node.M?.id,
    })
  }
  if (kind === 'center' && center) {
    const hs = center.highlights || center.M?.highlights || []
    return emptyAttentionItem({
      name: center.M?.O?.name || center.M?.id,
      text: center.M?.O?.description || '',
      formula: center.M?.O?.formula || null,
      highlights: hs.map((h) => h.id),
      sourceKind: 'center',
      sourceId: center.M?.id,
    })
  }
  if (kind === 'translation' && translation) {
    const m = translation.M || {}
    return emptyAttentionItem({
      name: m.O?.text || m.id,
      text: `${m.O?.from || ''} → ${m.O?.to || ''}${m.O?.note ? `\n${m.O.note}` : ''}`,
      highlights: (m.targets || []).map((t) => t.id),
      sourceKind: 'translation',
      sourceId: m.id,
    })
  }
  return emptyAttentionItem()
}

/**
 * Перенять всё: O → ВО (порядок кольца) → центры изменения → вычислительные (по важности) → трансляции (по важности).
 */
export function importAllFromHost(host) {
  if (!host) return []
  const items = []
  let order = 1

  items.push(
    emptyAttentionItem({
      order: order++,
      name: host.M?.O?.name || 'O',
      text: host.M?.O?.description || '',
      sourceKind: 'o',
      sourceId: host.M?.id || 'O',
    })
  )

  const vo = blockOf(host, 'R_O') || []
  vo.forEach((node) => {
    items.push(
      emptyAttentionItem({
        order: order++,
        name: node.M?.O?.tastes || node.M?.id,
        text: node.M?.O?.description || '',
        magnitude: node.M?.O?.magnitude || null,
        sourceKind: 'vo',
        sourceId: node.M?.id,
      })
    )
  })

  const change = blockOf(host, 'centersChange') || []
  change.forEach((c) => {
    const hs = c.highlights || c.M?.highlights || []
    items.push(
      emptyAttentionItem({
        order: order++,
        name: c.M?.O?.name || c.M?.id,
        text: c.M?.O?.description || '',
        formula: c.M?.O?.formula || null,
        highlights: hs.map((h) => h.id),
        sourceKind: 'center',
        sourceId: c.M?.id,
      })
    )
  })

  const understand = [...(blockOf(host, 'centersUnderstand') || [])].sort(
    (a, b) => (b.importance ?? b.M?.importance ?? 0) - (a.importance ?? a.M?.importance ?? 0)
  )
  understand.forEach((c) => {
    const hs = c.highlights || c.M?.highlights || []
    items.push(
      emptyAttentionItem({
        order: order++,
        name: c.M?.O?.name || c.M?.id,
        text: c.M?.O?.description || '',
        formula: c.M?.O?.formula || null,
        highlights: hs.map((h) => h.id),
        sourceKind: 'center',
        sourceId: c.M?.id,
      })
    )
  })

  const translations = [...(blockOf(host, 'translations') || [])].sort(
    (a, b) => (b.M?.importance ?? 0) - (a.M?.importance ?? 0)
  )
  translations.forEach((tr) => {
    const m = tr.M || {}
    items.push(
      emptyAttentionItem({
        order: order++,
        name: m.O?.text || m.id,
        text: `${m.O?.from || ''} → ${m.O?.to || ''}${m.O?.note ? `\n${m.O.note}` : ''}`,
        highlights: (m.targets || []).map((t) => t.id),
        sourceKind: 'translation',
        sourceId: m.id,
      })
    )
  })

  return items
}

/** Черновик для Person 1 (карточки Object Tape). */
export function attentionToPerson1Cards(items) {
  const sorted = sortAttention(items)
  const now = Date.now()
  return sorted.map((it, i) => {
    const parts = [it.text]
    if (it.formula) parts.push(it.formula)
    if (it.magnitude) parts.push(`величина: ${it.magnitude}`)
    if (it.highlights?.length) parts.push(`ВО: ${it.highlights.join(', ')}`)
    if (it.note) parts.push(`заметка: ${it.note}`)
    return {
      id: `work-att-${it.id}`,
      name: it.name || `Внимание ${i + 1}`,
      description: parts.filter(Boolean).join('\n\n'),
      type: 'generated',
      color: '#3498DB',
      metrics: { in: Math.min(10, Math.max(0, Number(it.order) || 5)), out: 0, u: 0 },
      createdAt: now - (sorted.length - i) * 1000,
      fromWorkAttention: true,
    }
  })
}

export function savePerson1Draft(cards) {
  localStorage.setItem(PERSON1_DRAFT_KEY, JSON.stringify(cards))
}

export function loadPerson1Draft() {
  try {
    const raw = localStorage.getItem(PERSON1_DRAFT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Рабочий Person 1 Tape — отдельно от лицевого Сида (objectTapeCards). */
const WORK_PERSON1_KEY = 'rl_work_person1_cards'
const WORK_PERSON2_KEY = 'rl_work_person2_cards'
const WORK_PERSON2_URL = '/work/cursor_person2_tape.json'

/** Палитры как в README / CardEditor — тип ↔ цвет. */
export const TYPE_COLOR_PALETTE = {
  generated: ['#3498DB', '#5DADE2', '#85C1E2', '#2980B9', '#1E90FF'],
  externalReflection: ['#2ECC71', '#52BE80', '#27AE60', '#1ABC9C', '#16A085'],
  internalReflection: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887'],
}

function normHex(c) {
  return String(c || '')
    .trim()
    .toUpperCase()
}

/** Если цвет карточки не из палитры её type — подставить цвет по типу (README). */
export function normalizeCardColorByType(card, index = 0) {
  if (!card) return card
  const type = card.type || 'generated'
  const palette = TYPE_COLOR_PALETTE[type] || TYPE_COLOR_PALETTE.generated
  const ok = palette.some((c) => normHex(c) === normHex(card.color))
  if (ok) return card
  return {
    ...card,
    color: palette[index % palette.length],
  }
}

export function normalizeCardsColorsByType(cards) {
  return (cards || []).map((c, i) => normalizeCardColorByType(c, i))
}

export function loadWorkPerson1Cards() {
  try {
    const raw = localStorage.getItem(WORK_PERSON1_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return normalizeCardsColorsByType(Array.isArray(data) ? data : [])
  } catch {
    return []
  }
}

export function saveWorkPerson1Cards(cards) {
  localStorage.setItem(WORK_PERSON1_KEY, JSON.stringify(cards || []))
}

export function loadWorkPerson2Cards() {
  try {
    const raw = localStorage.getItem(WORK_PERSON2_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return normalizeCardsColorsByType(Array.isArray(data) ? data : [])
  } catch {
    return []
  }
}

export function saveWorkPerson2Cards(cards) {
  localStorage.setItem(WORK_PERSON2_KEY, JSON.stringify(normalizeCardsColorsByType(cards || [])))
}

const WORK_CONTACT_P1_KEY = 'rl_work_contact_p1'
const WORK_CONTACT_P2_KEY = 'rl_work_contact_p2'

function loadContact(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function loadWorkContactP1() {
  return loadContact(WORK_CONTACT_P1_KEY)
}

export function saveWorkContactP1(cards) {
  localStorage.setItem(WORK_CONTACT_P1_KEY, JSON.stringify(cards || []))
}

export function loadWorkContactP2() {
  return loadContact(WORK_CONTACT_P2_KEY)
}

export function saveWorkContactP2(cards) {
  localStorage.setItem(WORK_CONTACT_P2_KEY, JSON.stringify(cards || []))
}

/** Добавить карточку на ленту соприкосновения (без дубля по id). */
export function appendContactCard(list, card) {
  if (!card?.id) return list || []
  const prev = list || []
  if (prev.some((c) => c.id === card.id)) return prev
  return [
    ...prev,
    {
      ...card,
      onContactAt: Date.now(),
    },
  ]
}

export function removeContactCard(list, cardOrId) {
  const id = typeof cardOrId === 'string' ? cardOrId : cardOrId?.id
  if (!id) return list || []
  return (list || []).filter((c) => c.id !== id)
}

const WORK_VERT_P1_KEY = 'rl_work_vertical_p1'
const WORK_VERT_P2_KEY = 'rl_work_vertical_p2'

export function loadWorkVerticalP1() {
  return loadContact(WORK_VERT_P1_KEY)
}

export function saveWorkVerticalP1(cards) {
  localStorage.setItem(WORK_VERT_P1_KEY, JSON.stringify(cards || []))
}

export function loadWorkVerticalP2() {
  return loadContact(WORK_VERT_P2_KEY)
}

export function saveWorkVerticalP2(cards) {
  localStorage.setItem(WORK_VERT_P2_KEY, JSON.stringify(cards || []))
}

function sampleMetrics(i, base = {}) {
  const inV = base.in ?? 5 + (i % 4)
  const outV = base.out ?? 3 + (i % 3)
  const uV = base.u ?? 4 + (i % 5)
  return { in: inV, out: outV, u: uV }
}

function cloneCard(card, personId, i) {
  const metrics = sampleMetrics(i, card.metrics || {})
  return {
    ...card,
    personId,
    metrics,
    focusedAt: card.focusedAt || card.createdAt || Date.now() - i * 1000,
    createdAt: card.createdAt || Date.now() - i * 1000,
  }
}

function makeExternalPair(source, targetPersonId, i) {
  const m = sampleMetrics(i, source.metrics || {})
  return {
    id: `work-ext-${source.id}`,
    name: `${source.name} (отражение)`,
    description: source.description || '',
    type: 'externalReflection',
    color: ['#2ECC71', '#52BE80', '#27AE60', '#1ABC9C'][i % 4],
    metrics: { in: m.out, out: m.in, u: m.u },
    createdAt: Date.now() - i * 500,
    focusedAt: Date.now() - i * 500,
    personId: targetPersonId,
    reflectionOf: source.id,
    pairName: source.name,
    fromWorkVertical: true,
  }
}

/**
 * Собрать вертикальный обмен из лент соприкосновения.
 * Generated ведущего (и Generated Person 2) → у другого External Reflection, IN↔OUT.
 * Internal Reflection не автосоздаём — каждый добавит в ходе.
 */
export function prepareWorkVerticalFromContacts(contactP1, contactP2, { leader = 1 } = {}) {
  let p1 = (contactP1 || []).map((c, i) => cloneCard(c, 1, i))
  let p2 = (contactP2 || []).map((c, i) => cloneCard(c, 2, i))

  const ensurePairs = (sources, targets, sourcePersonId) => {
    const targetPersonId = sourcePersonId === 1 ? 2 : 1
    let nextTargets = [...targets]
    let nextSources = sources.map((s, i) => {
      if (s.type !== 'generated') return s
      const existing = nextTargets.find((t) => t.reflectionOf === s.id)
      if (existing) {
        return { ...s, reflectedAs: existing.id, metrics: sampleMetrics(i, s.metrics) }
      }
      const ext = makeExternalPair({ ...s, metrics: sampleMetrics(i, s.metrics) }, targetPersonId, i)
      nextTargets = [...nextTargets, ext]
      return { ...s, reflectedAs: ext.id, metrics: sampleMetrics(i, s.metrics) }
    })
    return { sources: nextSources, targets: nextTargets }
  }

  // Сначала пары от ведущего, затем Generated второго (несколько своих)
  if (leader === 1) {
    const a = ensurePairs(p1, p2, 1)
    p1 = a.sources
    p2 = a.targets
    const b = ensurePairs(p2, p1, 2)
    p2 = b.sources
    p1 = b.targets
  } else {
    const a = ensurePairs(p2, p1, 2)
    p2 = a.sources
    p1 = a.targets
    const b = ensurePairs(p1, p2, 1)
    p1 = b.sources
    p2 = b.targets
  }

  saveWorkVerticalP1(p1)
  saveWorkVerticalP2(p2)
  return { p1, p2 }
}

/** Подтянуть сид Cursor Person 2, если лента ещё пуста (или force). */
export async function ensureWorkPerson2Cards(force = false) {
  const existing = loadWorkPerson2Cards()
  if (!force && existing.length) return existing
  const res = await fetch(WORK_PERSON2_URL, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Не удалось загрузить ${WORK_PERSON2_URL}`)
  const pack = await res.json()
  const now = Date.now()
  const cards = normalizeCardsColorsByType(
    (pack.cards || []).map((c, i) => ({
      ...c,
      personId: 2,
      createdAt: c.createdAt ?? now - (pack.cards.length - i) * 1000,
      focusedAt: c.focusedAt ?? now - (pack.cards.length - i) * 1000,
    }))
  )
  saveWorkPerson2Cards(cards)
  return cards
}

export { PERSON1_DRAFT_KEY, WORK_PERSON1_KEY, WORK_PERSON2_KEY, WORK_PERSON2_URL, WORK_CONTACT_P1_KEY, WORK_CONTACT_P2_KEY, WORK_VERT_P1_KEY, WORK_VERT_P2_KEY }
