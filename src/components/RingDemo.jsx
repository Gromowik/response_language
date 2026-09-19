import { useEffect, useMemo, useState } from 'react'
import styles from './RingDemo.module.css'

const DATA_URL = '/work/lever_ring_demo.json'
const TALK_URL = '/work/what_could_be_new.md'
/** Orbit radius as % of ringsWrap (from center to node center) */
const ORBIT_PCT = 42

function blockOf(host, key) {
  return host?.L?.find((item) => Object.prototype.hasOwnProperty.call(item, key))?.[key]
}

function shortLabel(tastes, max = 12) {
  if (!tastes) return '·'
  return tastes.length > max ? `${tastes.slice(0, max - 1)}…` : tastes
}

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: true, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

function nodeStyle(idx, total) {
  // Start at top (−90°), go counterclockwise in screen coords → increasing angle in SVG-like math
  // CSS: x right, y down → angle from +x axis: start at -90° (top), then +step for CCW appearance
  const step = 360 / (total || 1)
  const deg = -90 - step * idx
  const rad = (deg * Math.PI) / 180
  const x = 50 + ORBIT_PCT * Math.cos(rad)
  const y = 50 + ORBIT_PCT * Math.sin(rad)
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
  }
}

export default function RingDemo({ onNavigate }) {
  const [tab, setTab] = useState('demo') // demo | talk | help
  const [host, setHost] = useState(null)
  const [error, setError] = useState(null)
  const [raised, setRaised] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [activeTrId, setActiveTrId] = useState(null)
  const [talkHtml, setTalkHtml] = useState('')
  const [talkError, setTalkError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(DATA_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Не удалось загрузить ${DATA_URL}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setHost(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Ошибка загрузки')
          setHost(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (tab !== 'talk') return
    let cancelled = false
    const load = async () => {
      try {
        await new Promise((resolve) => {
          if (window.marked?.parse) {
            resolve()
            return
          }
          const id = window.setInterval(() => {
            if (window.marked?.parse) {
              window.clearInterval(id)
              resolve()
            }
          }, 50)
        })
        const res = await fetch(TALK_URL, { cache: 'no-cache' })
        if (!res.ok) throw new Error(`Не удалось загрузить ${TALK_URL}`)
        const text = await res.text()
        if (!cancelled) {
          setTalkHtml(renderMarkdown(text))
          setTalkError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setTalkError(err.message || 'Ошибка загрузки')
          setTalkHtml('')
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tab])

  const externalRing = useMemo(() => blockOf(host, 'R_O') || [], [host])
  const centers = useMemo(() => blockOf(host, 'centers') || [], [host])
  const translations = useMemo(() => {
    const list = blockOf(host, 'translations') || []
    return [...list].sort((a, b) => (a.M?.order ?? 99) - (b.M?.order ?? 99))
  }, [host])
  const metricsDraft = useMemo(() => blockOf(host, 'metrics') || {}, [host])
  const loadCenter = centers[0]

  const highlightIds = useMemo(() => {
    const tr = translations.find((t) => t.M?.id === activeTrId)
    if (!tr?.M?.targets) return new Set()
    return new Set(tr.M.targets.map((t) => t.id))
  }, [translations, activeTrId])

  const selectedNode = externalRing.find((n) => n.M?.id === selectedNodeId)

  const metrics = useMemo(() => {
    const IN = metricsDraft.IN ?? 0
    const OUT = raised ? (metricsDraft.OUT_raised ?? 8) : (metricsDraft.OUT_base ?? 4)
    const loadTrActive = activeTrId === 'tr-load-path'
    const U = raised && loadTrActive ? Math.min(IN, OUT) : 0
    return { IN, OUT, U }
  }, [metricsDraft, raised, activeTrId])

  const toggleRaise = () => {
    if (animating) return
    setAnimating(true)
    setRaised((v) => !v)
    window.setTimeout(() => setAnimating(false), 500)
  }

  const o = host?.M?.O || {}
  const n = externalRing.length || 1

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Ring Demo · сид рычаг</p>
        <h1 className={styles.title}>{o.name || 'Ring Demo'}</h1>
        <p className={styles.lead}>
          Демо слоя: центр O, внешнее кольцо R_O (папки), трансляции как маяки понимания, один
          динамический центр — груз. Структура ближе к RL-донору Data.
        </p>
        <nav className={styles.topLinks}>
          {onNavigate ? (
            <>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('visualModel')}
              >
                ← Visual Model
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('reflection')}
              >
                → Reflection
              </button>
              <button type="button" className={styles.topLink} onClick={() => onNavigate('seeds')}>
                → Seeds
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('hfCenters')}
              >
                → HF Centers
              </button>
            </>
          ) : null}
        </nav>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'demo' ? styles.tabActive : ''}`}
          onClick={() => setTab('demo')}
        >
          Демо
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'help' ? styles.tabActive : ''}`}
          onClick={() => setTab('help')}
        >
          Справка (структура и проход)
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'talk' ? styles.tabActive : ''}`}
          onClick={() => setTab('talk')}
        >
          Беседа (what_could_be_new)
        </button>
      </div>

      {tab === 'talk' ? (
        <section className={styles.docPanel}>
          <p className={styles.hint}>
            Живая беседа об улучшениях и слоях. Файл: <code>{TALK_URL}</code>
          </p>
          {talkError ? <p className={styles.error}>{talkError}</p> : null}
          <article
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: talkHtml }}
          />
        </section>
      ) : null}

      {tab === 'help' ? (
        <section className={styles.docPanel}>
          <h2 className={styles.layerTitle}>Справка: структура данных и проход</h2>

          <h3 className={styles.helpH}>Откуда взята форма</h3>
          <p className={styles.helpP}>
            Каркас как у <strong>RL-донора</strong>{' '}
            <code>public/donor_program/Data</code>: объект-хозяин с ядром <strong>M.O</strong> и
            блоками в <strong>L</strong>. UI кольца ближе к NavigationViewer (O в центре, узлы по
            окружности). Эталон полного донора — <code>step_9</code> / HostObject; здесь урезанный
            сид рычага.
          </p>

          <h3 className={styles.helpH}>Файл демо</h3>
          <p className={styles.helpP}>
            <code>{DATA_URL}</code> — один JSON:
          </p>
          <ul className={styles.helpList}>
            <li>
              <strong>M.O</strong> — имя и описание объекта (центр понимания).
            </li>
            <li>
              <strong>folders</strong> — дерево папок (геометрия покоя).
            </li>
            <li>
              <strong>R_O</strong> — внешнее кольцо: те же узлы в линейном порядке (рекурсия
              дерева), как «реальное» на окружности.
            </li>
            <li>
              <strong>centers</strong> — динамика; пока один: путь груза вверх/вниз (не папка).
            </li>
            <li>
              <strong>translations</strong> — маяки понимания: текст A→B, <code>order</code>,{' '}
              <code>importance</code>, <code>targets</code> на узлы R_O / центр.
            </li>
            <li>
              <strong>metrics</strong> — черновик IN / OUT / намёк на U.
            </li>
          </ul>

          <h3 className={styles.helpH}>Как пройти демо</h3>
          <ol className={styles.helpList}>
            <li>Смотрите центр <strong>O</strong> — что за объект.</li>
            <li>
              Кликайте узлы на <strong>R_O</strong> — карточка папки (статика мест).
            </li>
            <li>
              Выберите трансляцию справа — подсветятся <strong>targets</strong> на кольце (и намёк
              на центр груза, если он в targets).
            </li>
            <li>
              Нажмите <strong>Поднять / опустить груз</strong> — меняется динамический центр и OUT.
            </li>
            <li>
              <strong>U</strong> появляется, если груз поднят и активна трансляция пути груза (
              <code>tr-load-path</code>) — черновик резонанса.
            </li>
          </ol>

          <h3 className={styles.helpH}>Словарь (коротко)</h3>
          <ul className={styles.helpList}>
            <li>
              <strong>O</strong> — суть / понимание объекта.
            </li>
            <li>
              <strong>R_O</strong> — внешнее кольцо «реального» (здесь — папки).
            </li>
            <li>
              <strong>M+</strong> / маяки / поток — в полном доноре; здесь трансляции как первые
              маяки понимания (без полного OrderFlow).
            </li>
            <li>
              <strong>IN / OUT / U</strong> — язык лент RL: важность объекта, мой отклик/выбор,
              резонанс совпадения.
            </li>
            <li>
              <strong>order ≠ importance</strong> — порядок опоры vs то, что требует внимания.
            </li>
          </ul>

          <h3 className={styles.helpH}>Связанные страницы</h3>
          <p className={styles.helpP}>
            Visual Model — схема и симуляция рычага; Reflection — поле трансляций; Seeds — сид{' '}
            <code>example.md</code>; донор — микромир Data. Беседа и решения — вкладка «Беседа».
          </p>
        </section>
      ) : null}

      {tab === 'demo' ? (
        error ? (
          <p className={styles.error}>{error}</p>
        ) : !host ? (
          <p className={styles.hint}>Загрузка Ring Demo…</p>
        ) : (
          <div className={styles.layout}>
            <section className={styles.stagePanel}>
              <h2 className={styles.layerTitle}>O + внешнее кольцо R_O</h2>
              <p className={styles.hint}>
                Узлы по окружности (рекурсия папок). Клик — карточка. Трансляция подсвечивает
                targets.
              </p>

              <div className={styles.ringsWrap}>
                <div className={`${styles.ring} ${styles.ringL}`} aria-hidden>
                  <span className={styles.ringLLabel}>R_O</span>
                </div>
                {externalRing.map((item, idx) => {
                  const id = item.M?.id
                  const isSelected = selectedNodeId === id
                  const isHi = highlightIds.has(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.node} ${isSelected ? styles.nodeSelected : ''} ${
                        isHi ? styles.nodeHighlight : ''
                      }`}
                      style={nodeStyle(idx, n)}
                      title={item.M?.O?.description || item.M?.O?.tastes}
                      onClick={() => setSelectedNodeId(id)}
                    >
                      {shortLabel(item.M?.O?.tastes)}
                    </button>
                  )
                })}
                <div className={`${styles.ring} ${styles.ringO}`}>
                  <span className={styles.ringOLabel}>O</span>
                  <span className={styles.ringOName}>{o.name}</span>
                </div>
              </div>

              {selectedNode ? (
                <div className={styles.nodeCard}>
                  <strong>{selectedNode.M?.O?.tastes}</strong>
                  <span>{selectedNode.M?.O?.description}</span>
                  <div className={styles.trMeta}>id: {selectedNode.M?.id}</div>
                </div>
              ) : null}

              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={toggleRaise}
                  disabled={animating}
                >
                  {raised ? 'Опустить груз' : 'Поднять груз'}
                </button>
                <span className={styles.hintInline}>
                  Центр «{loadCenter?.M?.O?.name || 'груз'}»:{' '}
                  <strong>{raised ? 'поднято' : 'внизу'}</strong>
                  {highlightIds.has('center-load') ? ' · в фокусе трансляции' : ''}
                </span>
              </div>

              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>IN</span>
                  <span className={styles.metricValue}>{metrics.IN}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>OUT</span>
                  <span className={styles.metricValue}>{metrics.OUT}</span>
                </div>
                <div className={`${styles.metric} ${metrics.U ? styles.metricU : ''}`}>
                  <span className={styles.metricLabel}>U</span>
                  <span className={styles.metricValue}>{metrics.U || '—'}</span>
                </div>
              </div>
              <p className={styles.hint}>{metricsDraft.U_hint}</p>
            </section>

            <aside className={styles.sidePanel}>
              <h2 className={styles.layerTitle}>Трансляции (маяки)</h2>
              <p className={styles.hint}>
                order / importance отдельно. Клик — подсветка узлов на R_O.
              </p>
              <ul className={styles.trList}>
                {translations.map((tr) => {
                  const m = tr.M || {}
                  const active = activeTrId === m.id
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        className={`${styles.trItem} ${active ? styles.trActive : ''}`}
                        onClick={() => setActiveTrId((prev) => (prev === m.id ? null : m.id))}
                      >
                        <div className={styles.trText}>{m.O?.text}</div>
                        <div className={styles.trArrow}>
                          {m.O?.from} → {m.O?.to}
                        </div>
                        <div className={styles.trMeta}>
                          <span>order {m.order}</span>
                          <span>важн. {m.importance}</span>
                          <span>→ {(m.targets || []).map((t) => t.id).join(', ')}</span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className={styles.hint} style={{ marginTop: '0.85rem' }}>
                Данные: <code>{DATA_URL}</code>
              </p>
            </aside>
          </div>
        )
      ) : null}
    </div>
  )
}
