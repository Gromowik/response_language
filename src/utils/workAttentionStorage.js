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

export function loadWorkPerson1Cards() {
  try {
    const raw = localStorage.getItem(WORK_PERSON1_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveWorkPerson1Cards(cards) {
  localStorage.setItem(WORK_PERSON1_KEY, JSON.stringify(cards || []))
}

export { PERSON1_DRAFT_KEY, WORK_PERSON1_KEY }
