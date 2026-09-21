import { useCallback, useEffect, useMemo, useState } from 'react'
import ringStyles from './RingDemo.module.css'
import styles from './WorkRingDemo.module.css'
import {
  attentionToPerson1Cards,
  emptyAttentionItem,
  importAllFromHost,
  itemFromSelection,
  loadAttentionTape,
  saveAttentionTape,
  savePerson1Draft,
  saveWorkPerson1Cards,
  sortAttention,
} from '../utils/workAttentionStorage'

const DATA_URL = '/work/lever_work_rings.json'
const ORBIT_VO = 44
const KIND_LABEL = {
  o: 'O',
  vo: 'ВО',
  center: 'центр',
  translation: 'трансляция',
  manual: 'вручную',
}

function blockOf(host, key) {
  return host?.L?.find((item) => Object.prototype.hasOwnProperty.call(item, key))?.[key]
}

function shortLabel(tastes, max = 11) {
  if (!tastes) return '·'
  return tastes.length > max ? `${tastes.slice(0, max - 1)}…` : tastes
}

function nodeStyle(idx, total, orbitPct) {
  const step = 360 / (total || 1)
  const deg = -90 - step * idx
  const rad = (deg * Math.PI) / 180
  return {
    left: `${50 + orbitPct * Math.cos(rad)}%`,
    top: `${50 + orbitPct * Math.sin(rad)}%`,
    transform: 'translate(-50%, -50%)',
  }
}

export default function WorkRingDemo({ onPushToWorkPerson1 }) {
  const [pack, setPack] = useState(null)
  const [error, setError] = useState(null)
  const [objectIndex, setObjectIndex] = useState(0)
  const [raised, setRaised] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [activeTrId, setActiveTrId] = useState(null)
  const [activeCenterId, setActiveCenterId] = useState(null)
  const [tab, setTab] = useState('demo') // demo | tools | help
  const [attention, setAttention] = useState(() => sortAttention(loadAttentionTape()))
  const [editId, setEditId] = useState(null)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    saveAttentionTape(attention)
  }, [attention])

  useEffect(() => {
    let cancelled = false
    fetch(DATA_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Не удалось загрузить ${DATA_URL}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setPack(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Ошибка')
          setPack(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const host = pack?.objects?.[objectIndex] || null
  const role = host?.role || (objectIndex === 0 ? 'input' : 'output')
  const isInput = role === 'input'
  const externalRing = useMemo(() => blockOf(host, 'R_O') || [], [host])
  const centersChange = useMemo(() => blockOf(host, 'centersChange') || [], [host])
  const centersUnderstand = useMemo(() => {
    const list = blockOf(host, 'centersUnderstand') || []
    return [...list].sort(
      (a, b) => (b.importance ?? b.M?.importance ?? 0) - (a.importance ?? a.M?.importance ?? 0)
    )
  }, [host])
  const translations = useMemo(() => {
    const list = blockOf(host, 'translations') || []
    return [...list].sort((a, b) => (b.M?.importance ?? 0) - (a.M?.importance ?? 0))
  }, [host])
  const params = useMemo(() => blockOf(host, 'params') || {}, [host])

  const highlightIds = useMemo(() => {
    if (activeTrId) {
      const tr = translations.find((t) => t.M?.id === activeTrId)
      if (tr?.M?.targets) return new Set(tr.M.targets.map((t) => t.id))
    }
    if (activeCenterId) {
      const all = [...centersChange, ...centersUnderstand]
      const c = all.find((x) => x.M?.id === activeCenterId)
      const hs = c?.highlights || c?.M?.highlights || []
      if (hs.length) return new Set(hs.map((t) => t.id))
    }
    return new Set()
  }, [translations, activeTrId, activeCenterId, centersChange, centersUnderstand])

  const selectedNode = externalRing.find((n) => n.M?.id === selectedNodeId)
  const selectedCenter = [...centersChange, ...centersUnderstand].find(
    (c) => c.M?.id === activeCenterId
  )
  const selectedTranslation = translations.find((t) => t.M?.id === activeTrId)
  const centerHighlights = selectedCenter?.highlights || selectedCenter?.M?.highlights || []
  const loadCenter = centersChange[0]
  const n = externalRing.length || 1

  const selectionKind = selectedNode
    ? 'vo'
    : selectedCenter
      ? 'center'
      : selectedTranslation
        ? 'translation'
        : 'o'

  const telescopePayload = useMemo(() => {
    if (selectedNode) return selectedNode
    if (selectedCenter) return selectedCenter
    if (selectedTranslation) return selectedTranslation
    return host
  }, [selectedNode, selectedCenter, selectedTranslation, host])

  const telescopeTitle = selectedNode
    ? `ВО · ${selectedNode.M?.id}`
    : selectedCenter
      ? `центр · ${selectedCenter.M?.id}`
      : selectedTranslation
        ? `трансляция · ${selectedTranslation.M?.id}`
        : `Host · ${host?.M?.id || 'O'}`

  const pickCenter = (id) => {
    setActiveTrId(null)
    setActiveCenterId((prev) => (prev === id ? null : id))
    setSelectedNodeId(null)
  }

  const flash = useCallback((msg) => {
    setStatusMsg(msg)
    window.setTimeout(() => setStatusMsg(''), 2800)
  }, [])

  const addSelectionToTape = () => {
    const item = itemFromSelection({
      kind: selectionKind,
      host,
      node: selectedNode,
      center: selectedCenter,
      translation: selectedTranslation,
    })
    setAttention((prev) => {
      const nextOrder = prev.length ? Math.max(...prev.map((x) => x.order || 0)) + 1 : 1
      return sortAttention([...prev, { ...item, order: nextOrder }])
    })
    flash(`На ленту: ${item.name || item.sourceId}`)
  }

  const importAll = () => {
    if (
      attention.length &&
      !window.confirm('Заменить текущую ленту внимания полным перенятием из объекта?')
    ) {
      return
    }
    setAttention(importAllFromHost(host))
    setEditId(null)
    flash('Перенято всё из объекта (O → ВО → центры → трансляции)')
  }

  const clearTape = () => {
    if (!attention.length) return
    if (!window.confirm('Очистить ленту внимания?')) return
    setAttention([])
    setEditId(null)
  }

  const updateItem = (id, patch) => {
    setAttention((prev) =>
      sortAttention(prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    )
  }

  const removeItem = (id) => {
    setAttention((prev) => sortAttention(prev.filter((it) => it.id !== id)))
    if (editId === id) setEditId(null)
  }

  const moveItem = (id, dir) => {
    setAttention((prev) => {
      const sorted = sortAttention(prev)
      const idx = sorted.findIndex((it) => it.id === id)
      if (idx < 0) return prev
      const j = idx + dir
      if (j < 0 || j >= sorted.length) return prev
      const a = sorted[idx]
      const b = sorted[j]
      const orderA = a.order
      const orderB = b.order
      return sortAttention(
        sorted.map((it) => {
          if (it.id === a.id) return { ...it, order: orderB }
          if (it.id === b.id) return { ...it, order: orderA }
          return it
        })
      )
    })
  }

  const exportToPerson1 = (replace) => {
    if (!attention.length) {
      flash('Лента пуста')
      return
    }
    const cards = attentionToPerson1Cards(attention).map((c) => ({
      ...c,
      personId: 1,
      focusedAt: c.createdAt,
    }))
    savePerson1Draft(cards)
    if (!replace) {
      flash(`Черновик сохранён (${cards.length}). Откройте Person 1 Tape в рабочем отпечатке после «→ ленту».`)
      return
    }
    if (
      !window.confirm(
        `Записать ${cards.length} карт в рабочий Person 1 Tape? Лицевой Сид не меняется.`
      )
    ) {
      return
    }
    saveWorkPerson1Cards(cards)
    if (typeof onPushToWorkPerson1 === 'function') {
      onPushToWorkPerson1(cards)
    } else {
      flash('Записано в рабочий Person 1 (localStorage)')
    }
  }

  const addManual = () => {
    setAttention((prev) => {
      const nextOrder = prev.length ? Math.max(...prev.map((x) => x.order || 0)) + 1 : 1
      const item = emptyAttentionItem({ order: nextOrder, name: 'Заметка', sourceKind: 'manual' })
      setEditId(item.id)
      return sortAttention([...prev, item])
    })
  }

  const physics = useMemo(() => {
    const m = params.loadMass_kg
    const h = params.liftHeight_m
    const g = params.g || 9.81
    if (m == null || h == null) return null
    const A = m * g * h
    return { A: A.toFixed(0), hint: `A_груз ≈ m·g·h ≈ ${A.toFixed(0)} Дж (при m=${m} кг, h=${h} м)` }
  }, [params])

  const switchObject = (idx) => {
    setObjectIndex(idx)
    setSelectedNodeId(null)
    setActiveTrId(null)
    setActiveCenterId(null)
    setRaised(false)
  }

  const toggleRaise = () => {
    if (animating) return
    setAnimating(true)
    setRaised((v) => !v)
    window.setTimeout(() => setAnimating(false), 500)
  }

  if (error) {
    return (
      <div className={ringStyles.page}>
        <p className={ringStyles.error}>{error}</p>
      </div>
    )
  }

  if (!host) {
    return (
      <div className={ringStyles.page}>
        <p className={ringStyles.hint}>Загрузка Ring Demo…</p>
      </div>
    )
  }

  const o = host.M?.O || {}

  return (
    <div className={ringStyles.page}>
      <header className={ringStyles.header}>
        <p className={ringStyles.kicker}>Рабочий отпечаток · Ring Demo</p>
        <h1 className={ringStyles.title}>{o.name}</h1>
        <p className={ringStyles.lead}>{o.description}</p>

        <div className={styles.objSwitch}>
          {(pack?.objects || []).map((obj, idx) => {
            const r = obj.role || (idx === 0 ? 'input' : 'output')
            return (
              <button
                key={obj.M.id}
                type="button"
                className={`${styles.objBtn} ${objectIndex === idx ? styles.objBtnActive : ''}`}
                onClick={() => switchObject(idx)}
              >
                Модель {idx + 1} · {r === 'input' ? 'вход' : 'выход'}
                <span className={styles.objBtnSub}>
                  {r === 'input'
                    ? 'физика и наблюдения (общее)'
                    : 'отпечаток через трансляции'}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      <div className={ringStyles.tabs}>
        <button
          type="button"
          className={`${ringStyles.tab} ${tab === 'demo' ? ringStyles.tabActive : ''}`}
          onClick={() => setTab('demo')}
        >
          Демо
        </button>
        <button
          type="button"
          className={`${ringStyles.tab} ${tab === 'tools' ? ringStyles.tabActive : ''}`}
          onClick={() => setTab('tools')}
        >
          Телескоп / Лента
        </button>
        <button
          type="button"
          className={`${ringStyles.tab} ${tab === 'help' ? ringStyles.tabActive : ''}`}
          onClick={() => setTab('help')}
        >
          Справка (вход / выход)
        </button>
      </div>

      {statusMsg ? <p className={styles.statusMsg}>{statusMsg}</p> : null}

      {tab === 'help' ? (
        <section className={ringStyles.docPanel}>
          <h2 className={ringStyles.layerTitle}>Две модели</h2>
          <ul className={styles.helpList}>
            <li>
              <strong>Модель 1 · вход</strong> — физика и ВО; центры в списке (изменение сверху,
              затем вычислительные). Клик подсвечивает узлы на ВО: изменение→груз; работа/мощность→Я
              и Груз; ω→общее колесо и намотка. Без промежуточных колец.
            </li>
            <li>
              <strong>Модель 2 · выход</strong> — на ВО всё, что транслируется (в т.ч. работа,
              мощность, скорость); проход по трансляциям по важности.
            </li>
            <li>
              <strong>Телескоп</strong> — сырой фрагмент Host (JSON выбранного узла/центра или всего
              объекта).
            </li>
            <li>
              <strong>Лента внимания</strong> — клик → «на ленту»; «перенять всё» (O → ВО → центры
              → трансляции); правка/порядок → рабочий Person 1 Tape (Сид не трогаем).
            </li>
          </ul>
          <p className={ringStyles.hint}>
            Данные: <code>{DATA_URL}</code> (Host <code>M</code> + <code>L</code>, ближе к
            донору).
          </p>
        </section>
      ) : tab === 'tools' ? (
        <div className={styles.toolsLayout}>
          <section className={styles.telescopePanel}>
            <h2 className={ringStyles.layerTitle}>Телескоп</h2>
            <p className={ringStyles.hint}>
              Как видит машина: {telescopeTitle}. Выбор на вкладке «Демо» меняет фрагмент.
            </p>
            <div className={styles.toolBar}>
              <button type="button" className={ringStyles.button} onClick={addSelectionToTape}>
                → на ленту ({KIND_LABEL[selectionKind]})
              </button>
              <button type="button" className={styles.ghostBtn} onClick={importAll}>
                Перенять всё из объекта
              </button>
            </div>
            <pre className={styles.telescopePre}>
              {JSON.stringify(telescopePayload, null, 2)}
            </pre>
          </section>

          <section className={styles.attentionPanel}>
            <h2 className={ringStyles.layerTitle}>
              Лента внимания · {attention.length}
            </h2>
            <p className={ringStyles.hint}>
              Точки интереса с прохода. Порядок = поток к рабочему Person 1 Tape.
            </p>
            <div className={styles.toolBar}>
              <button type="button" className={ringStyles.button} onClick={importAll}>
                Перенять всё
              </button>
              <button type="button" className={styles.ghostBtn} onClick={addManual}>
                + заметка
              </button>
              <button type="button" className={styles.ghostBtn} onClick={clearTape}>
                Очистить
              </button>
            </div>
            <div className={styles.toolBar}>
              <button
                type="button"
                className={ringStyles.button}
                onClick={() => exportToPerson1(false)}
              >
                Черновик
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => exportToPerson1(true)}
              >
                → рабочий Person 1
              </button>
            </div>

            {!attention.length ? (
              <p className={ringStyles.hint}>Пока пусто — выберите на Демо и «на ленту», либо перенять всё.</p>
            ) : (
              <ul className={styles.attList}>
                {attention.map((it, idx) => {
                  const open = editId === it.id
                  return (
                    <li key={it.id} className={styles.attItem}>
                      <div className={styles.attHead}>
                        <span className={styles.attOrder}>{idx + 1}</span>
                        <button
                          type="button"
                          className={styles.attTitleBtn}
                          onClick={() => setEditId(open ? null : it.id)}
                        >
                          <strong>{it.name || 'без имени'}</strong>
                          <span className={styles.attKind}>
                            {KIND_LABEL[it.sourceKind] || it.sourceKind}
                            {it.sourceId ? ` · ${it.sourceId}` : ''}
                          </span>
                        </button>
                        <div className={styles.attMoves}>
                          <button type="button" onClick={() => moveItem(it.id, -1)} title="выше">
                            ↑
                          </button>
                          <button type="button" onClick={() => moveItem(it.id, 1)} title="ниже">
                            ↓
                          </button>
                          <button type="button" onClick={() => removeItem(it.id)} title="удалить">
                            ×
                          </button>
                        </div>
                      </div>
                      {!open && it.text ? (
                        <p className={styles.attPreview}>{it.text.slice(0, 120)}{it.text.length > 120 ? '…' : ''}</p>
                      ) : null}
                      {open ? (
                        <div className={styles.attEdit}>
                          <label>
                            Имя
                            <input
                              value={it.name}
                              onChange={(e) => updateItem(it.id, { name: e.target.value })}
                            />
                          </label>
                          <label>
                            Текст
                            <textarea
                              rows={3}
                              value={it.text}
                              onChange={(e) => updateItem(it.id, { text: e.target.value })}
                            />
                          </label>
                          <label>
                            Заметка
                            <textarea
                              rows={2}
                              value={it.note || ''}
                              onChange={(e) => updateItem(it.id, { note: e.target.value })}
                            />
                          </label>
                          <label>
                            Порядок
                            <input
                              type="number"
                              value={it.order}
                              onChange={(e) =>
                                updateItem(it.id, { order: Number(e.target.value) || 0 })
                              }
                            />
                          </label>
                          {it.formula ? (
                            <div className={styles.magnitude}>{it.formula}</div>
                          ) : null}
                          {it.highlights?.length ? (
                            <div className={ringStyles.trMeta}>
                              ВО: {it.highlights.join(', ')}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className={ringStyles.layout}>
          <section className={ringStyles.stagePanel}>
            <h2 className={ringStyles.layerTitle}>
              {isInput ? 'O · ВО (физика / наблюдения)' : 'O · ВО (всё, что транслируется)'}
            </h2>
            <p className={ringStyles.hint}>
              {isInput
                ? 'Внешнее кольцо — ВО. Центры слева подсвечивают узлы на кольце (без промежуточных окружностей).'
                : 'На ВО — и части, и то, что транслируется (работа, мощность, скорость…). Клик по трансляции подсвечивает.'}
            </p>

            <div className={ringStyles.ringsWrap}>
              <div className={`${ringStyles.ring} ${ringStyles.ringL}`} aria-hidden>
                <span className={ringStyles.ringLLabel}>ВО</span>
              </div>

              {externalRing.map((item, idx) => {
                const id = item.M?.id
                const isSelected = selectedNodeId === id
                const isHi = highlightIds.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`${ringStyles.node} ${isSelected ? ringStyles.nodeSelected : ''} ${
                      isHi ? ringStyles.nodeHighlight : ''
                    }`}
                    style={nodeStyle(idx, n, ORBIT_VO)}
                    title={item.M?.O?.description}
                    onClick={() => {
                      setActiveCenterId(null)
                      setActiveTrId(null)
                      setSelectedNodeId(id)
                    }}
                  >
                    {shortLabel(item.M?.O?.tastes)}
                  </button>
                )
              })}

              <div className={`${ringStyles.ring} ${ringStyles.ringO}`}>
                <span className={ringStyles.ringOLabel}>O</span>
                <span className={ringStyles.ringOName}>
                  {isInput ? 'вход' : 'выход'}
                </span>
              </div>
            </div>

            {selectedNode ? (
              <div className={ringStyles.nodeCard}>
                <strong>{selectedNode.M?.O?.tastes}</strong>
                <span>{selectedNode.M?.O?.description}</span>
                {selectedNode.M?.O?.magnitude ? (
                  <div className={styles.magnitude}>
                    величина: {selectedNode.M.O.magnitude}
                  </div>
                ) : null}
                <div className={ringStyles.trMeta}>id: {selectedNode.M?.id}</div>
                <button
                  type="button"
                  className={styles.addAttBtn}
                  onClick={addSelectionToTape}
                >
                  → на ленту внимания
                </button>
              </div>
            ) : null}

            {selectedCenter ? (
              <div className={ringStyles.nodeCard}>
                <strong>{selectedCenter.M.O?.name}</strong>
                <p>{selectedCenter.M.O?.description}</p>
                {selectedCenter.M.O?.formula ? (
                  <div className={styles.magnitude}>{selectedCenter.M.O.formula}</div>
                ) : null}
                {selectedCenter.importance != null ? (
                  <div className={ringStyles.trMeta}>важн. {selectedCenter.importance}</div>
                ) : null}
                <div className={ringStyles.trMeta}>
                  подсветка ВО: {centerHighlights.map((h) => h.id).join(', ') || '—'}
                </div>
                <button
                  type="button"
                  className={styles.addAttBtn}
                  onClick={addSelectionToTape}
                >
                  → на ленту внимания
                </button>
              </div>
            ) : null}

            {!selectedNode && !selectedCenter && !selectedTranslation ? (
              <div className={styles.oAttRow}>
                <button type="button" className={styles.addAttBtn} onClick={addSelectionToTape}>
                  O → на ленту
                </button>
                <button type="button" className={styles.ghostBtn} onClick={() => setTab('tools')}>
                  Телескоп / Лента
                </button>
              </div>
            ) : null}

            <div className={ringStyles.controls}>
              <button
                type="button"
                className={ringStyles.button}
                onClick={toggleRaise}
                disabled={animating}
              >
                {raised ? 'Опустить груз' : 'Поднять груз'}
              </button>
              <span className={ringStyles.hintInline}>
                {loadCenter?.M?.O?.name || 'центр изменения'}:{' '}
                <strong>{raised ? 'поднято' : 'внизу'}</strong>
              </span>
            </div>

            {isInput && physics ? <p className={ringStyles.hint}>{physics.hint}</p> : null}
            {isInput && params.leverR_m != null ? (
              <p className={ringStyles.hint}>
                R≈{params.leverR_m} м · r₂={params.wrapR_m} м · h={params.liftHeight_m} м
                {params.handSpeed_kmh != null ? ` · v≈${params.handSpeed_kmh} км/ч` : ''}
              </p>
            ) : null}
          </section>

          <aside className={ringStyles.sidePanel}>
            {isInput ? (
              <>
                <button
                  type="button"
                  className={styles.sectionBtn}
                  onClick={() => {
                    const first = centersChange[0]
                    if (first?.M?.id) pickCenter(first.M.id)
                  }}
                >
                  Центр изменения
                </button>
                <p className={ringStyles.hint}>Клик по полю или пункту — подсветка на ВО (груз).</p>
                <ul className={styles.centerBrief}>
                  {centersChange.map((c) => (
                    <li key={c.M.id}>
                      <button
                        type="button"
                        className={`${styles.centerPick} ${
                          activeCenterId === c.M.id ? styles.centerPickActive : ''
                        }`}
                        onClick={() => pickCenter(c.M.id)}
                      >
                        <strong>{c.M.O?.name}</strong>
                        <span>{c.M.O?.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={styles.sectionBtn}
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    const first = centersUnderstand[0]
                    if (first?.M?.id) pickCenter(first.M.id)
                  }}
                >
                  Вычислительные центры → к O
                </button>
                <p className={ringStyles.hint}>
                  Работа/мощность → Я и Груз; ω → общее колесо и намотка.
                </p>
                <ul className={styles.centerBrief}>
                  {centersUnderstand.map((c) => (
                    <li key={c.M.id}>
                      <button
                        type="button"
                        className={`${styles.centerPick} ${
                          activeCenterId === c.M.id ? styles.centerPickActive : ''
                        }`}
                        onClick={() => pickCenter(c.M.id)}
                      >
                        <strong>
                          {c.M.O?.name} · важн. {c.importance ?? c.M?.importance}
                        </strong>
                        <span>{c.M.O?.formula || c.M.O?.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className={ringStyles.hint} style={{ marginTop: '0.85rem' }}>
                  Личные трансляции — на <strong>модели 2 · выход</strong>.
                </p>
              </>
            ) : (
              <>
                <h2 className={ringStyles.layerTitle}>Трансляции (по важности)</h2>
                <p className={ringStyles.hint}>
                  Ваш отпечаток. На ВО уже работа, мощность, скорость подъёма и части.
                </p>
                <ul className={ringStyles.trList}>
                  {translations.map((tr) => {
                    const m = tr.M || {}
                    const active = activeTrId === m.id
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          className={`${ringStyles.trItem} ${active ? ringStyles.trActive : ''}`}
                          onClick={() => {
                            setActiveCenterId(null)
                            setActiveTrId((prev) => (prev === m.id ? null : m.id))
                          }}
                        >
                          <div className={ringStyles.trText}>{m.O?.text}</div>
                          <div className={ringStyles.trArrow}>
                            {m.O?.from} → {m.O?.to}
                          </div>
                          {m.O?.note ? <div className={styles.trNote}>{m.O.note}</div> : null}
                          <div className={ringStyles.trMeta}>
                            <span>важн. {m.importance}</span>
                            <span>{m.kind === 'constant' ? 'константа' : 'перемена'}</span>
                          </div>
                        </button>
                        {active ? (
                          <button
                            type="button"
                            className={styles.addAttBtn}
                            onClick={addSelectionToTape}
                          >
                            → на ленту внимания
                          </button>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
