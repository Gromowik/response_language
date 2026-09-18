import { useEffect, useMemo, useState } from 'react'
import styles from './VisualModel.module.css'

const MODEL_DOC = '/visual_model.md'
const SEED_PATH = '/example.md'

const FOLDER_TREE = [
  {
    id: 'mechanism',
    name: 'Механизм (сид: рычаг)',
    children: [
      { id: 'me', name: 'Я (приложение сил)', children: [] },
      {
        id: 'wheel-common',
        name: 'Общее колесо с грузом',
        children: [
          { id: 'lever', name: 'Рычаг и радиус вращения', children: [] },
          {
            id: 'wrap',
            name: 'Колесо намотки (груз вверх)',
            children: [{ id: 'load', name: 'Сам груз', children: [] }],
          },
        ],
      },
    ],
  },
]

/** Dynamic centers — spiral of importance (outer = closer to settled manifestation) */
const CENTERS = [
  {
    id: 'load-path',
    title: 'Путь груза вверх / вниз',
    importance: 1,
    note: 'Меняет положение относительно колеса намотки — не только «папка».',
  },
  {
    id: 'power-link',
    title: 'Мощность входа ↔ выхода',
    importance: 0.9,
    note: 'Связь функцией, не соседством в пространстве.',
  },
  {
    id: 'lever-radius',
    title: 'Радиус рычага (перемена)',
    importance: 0.85,
    note: 'Геометрия меняется; работа может остаться константой.',
  },
  {
    id: 'hand-speed',
    title: 'Касательная скорость руки',
    importance: 0.7,
    note: 'Удобный темп «я» — константа удобства.',
  },
]

const PARAMS = {
  leverR: 1.5, // m, mid of 1.2–1.8
  wrapR: 1.0, // m
  handSpeedKmh: 5,
  liftHeight: 2.0, // m
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

function FolderNode({ node, depth = 0, open, onToggle, selected, onSelect }) {
  const hasKids = node.children?.length > 0
  const isOpen = open[node.id] !== false
  return (
    <div className={styles.folderBlock} style={{ marginLeft: depth ? '0.75rem' : 0 }}>
      <button
        type="button"
        className={`${styles.folderBtn} ${selected === node.id ? styles.folderActive : ''}`}
        onClick={() => onSelect(node.id)}
      >
        {hasKids ? (
          <span
            className={styles.folderTwist}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
          >
            {isOpen ? '▾' : '▸'}
          </span>
        ) : (
          <span className={styles.folderTwistMuted}>·</span>
        )}
        <span>{node.name}</span>
      </button>
      {hasKids && isOpen
        ? node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              open={open}
              onToggle={onToggle}
              selected={selected}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  )
}

function findFolder(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findFolder(n.children || [], id)
    if (found) return found
  }
  return null
}

export default function VisualModel({ onNavigate }) {
  const [tab, setTab] = useState('pilot') // pilot | thoughts
  const [raised, setRaised] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [folderOpen, setFolderOpen] = useState({
    mechanism: true,
    'wheel-common': true,
    wrap: true,
  })
  const [selectedFolder, setSelectedFolder] = useState('mechanism')
  const [docHtml, setDocHtml] = useState('')
  const [docError, setDocError] = useState(null)

  const physics = useMemo(() => {
    const vMs = (PARAMS.handSpeedKmh * 1000) / 3600
    const omega = vMs / PARAMS.leverR // rad/s
    const liftSpeed = omega * PARAMS.wrapR // m/s
    const timeLift = PARAMS.liftHeight / liftSpeed
    const workHint = 'm·g·h — итог тот же при той же массе и высоте'
    return { vMs, omega, liftSpeed, timeLift, workHint }
  }, [])

  useEffect(() => {
    if (tab !== 'thoughts') return
    let cancelled = false
    const load = async () => {
      try {
        const waitForMarked = () =>
          new Promise((resolve) => {
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
        const [res] = await Promise.all([
          fetch(MODEL_DOC, { cache: 'no-cache' }),
          waitForMarked(),
        ])
        if (!res.ok) throw new Error(`Не удалось загрузить ${MODEL_DOC}`)
        const text = await res.text()
        if (!cancelled) {
          setDocHtml(renderMarkdown(text))
          setDocError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setDocError(err.message || 'Ошибка загрузки')
          setDocHtml('')
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tab])

  const toggleRaise = () => {
    if (animating) return
    setAnimating(true)
    setRaised((v) => !v)
    window.setTimeout(() => setAnimating(false), 900)
  }

  const selectedMeta = findFolder(FOLDER_TREE, selectedFolder)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Visual model · пилот</p>
        <h1 className={styles.title}>Визуальная модель — рычаг</h1>
        <p className={styles.lead}>
          Пробная страница на первом сиде: статика (папки), динамика (центры), данные +
          симуляция подъёма груза. Трансляции как центры понимания — пока только помечены.
        </p>
        <nav className={styles.topLinks}>
          {onNavigate ? (
            <>
              <button type="button" className={styles.topLink} onClick={() => onNavigate('seeds')}>
                → Сид (Seeds / example.md)
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('reflection')}
              >
                → Reflection (трансляции)
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('cloudModels')}
              >
                → Cloud Models
              </button>
            </>
          ) : null}
        </nav>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'pilot' ? styles.tabActive : ''}`}
          onClick={() => setTab('pilot')}
        >
          Пилот
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'thoughts' ? styles.tabActive : ''}`}
          onClick={() => setTab('thoughts')}
        >
          Мысли (visual_model.md)
        </button>
      </div>

      {tab === 'thoughts' ? (
        <section className={styles.docPanel}>
          <p className={styles.hint}>
            Замысел слоёв и пилота. Файл: <code>{MODEL_DOC}</code>
          </p>
          {docError ? <p className={styles.error}>{docError}</p> : null}
          <article
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: docHtml }}
          />
        </section>
      ) : (
        <>
          <div className={styles.layers}>
            <section className={styles.panel}>
              <h2 className={styles.layerTitle}>1 · Статика — дерево мест</h2>
              <p className={styles.hint}>Папки ≈ где что лежит. Открывают карточку части.</p>
              {FOLDER_TREE.map((node) => (
                <FolderNode
                  key={node.id}
                  node={node}
                  open={folderOpen}
                  onToggle={(id) =>
                    setFolderOpen((prev) => {
                      const currentlyOpen = prev[id] !== false
                      return { ...prev, [id]: !currentlyOpen }
                    })
                  }
                  selected={selectedFolder}
                  onSelect={setSelectedFolder}
                />
              ))}
              {selectedMeta ? (
                <p className={styles.selectedNote}>
                  Выбрано: <strong>{selectedMeta.name}</strong>
                </p>
              ) : null}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.layerTitle}>2 · Динамика — центры (спираль важности)</h2>
              <p className={styles.hint}>
                Не место, а проявления во времени. Снаружи списка — ближе к устоявшемуся
                проявлению.
              </p>
              <ol className={styles.centerList}>
                {CENTERS.map((c, i) => (
                  <li key={c.id} className={styles.centerItem}>
                    <span className={styles.centerRank}>{i + 1}</span>
                    <div>
                      <strong>{c.title}</strong>
                      <span className={styles.centerImp}>важн. {c.importance}</span>
                      <p>{c.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className={styles.mainRow}>
            <section className={styles.stagePanel}>
              <h2 className={styles.layerTitle}>Схема механизма</h2>
              <svg
                className={styles.stage}
                viewBox="0 0 360 200"
                role="img"
                aria-label="Колесо, рычаг и груз"
              >
                <rect x="0" y="0" width="360" height="200" fill="#f4f8f6" rx="8" />
                {/* ground */}
                <line x1="20" y1="170" x2="340" y2="170" stroke="#cbd2d9" strokeWidth="2" />
                {/* common wheel */}
                <circle cx="160" cy="100" r="44" fill="#fff" stroke="#3d7a6a" strokeWidth="3" />
                <circle cx="160" cy="100" r="6" fill="#3d7a6a" />
                <text x="160" y="28" textAnchor="middle" className={styles.svgLabel}>
                  общее колесо
                </text>
                {/* wrap drum smaller */}
                <circle cx="160" cy="100" r="22" fill="none" stroke="#0b6faf" strokeWidth="2" />
                {/* lever arm */}
                <line
                  x1="160"
                  y1="100"
                  x2="268"
                  y2="58"
                  stroke="#d4a017"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="268" cy="58" r="8" fill="#d4a017" />
                <text x="278" y="52" className={styles.svgLabel}>
                  рычаг (я)
                </text>
                {/* chain always from rightmost point of wrap drum (160+22, 100) */}
                <circle cx="182" cy="100" r="3.5" fill="#0b6faf" />
                <g
                  className={styles.animRope}
                  style={{
                    transform: raised ? 'scaleY(0.39)' : 'scaleY(1)',
                  }}
                >
                  <line
                    x1="182"
                    y1="100"
                    x2="182"
                    y2="162"
                    stroke="#627d98"
                    strokeWidth="2"
                  />
                </g>
                <g
                  className={styles.animLoad}
                  style={{
                    transform: raised ? 'translateY(-38px)' : 'translateY(0)',
                  }}
                >
                  <rect x="167" y="162" width="30" height="28" rx="3" fill="#8B4513" />
                  <text x="222" y="180" className={styles.svgLabel}>
                    груз {raised ? '(поднято)' : '(внизу)'}
                  </text>
                </g>
              </svg>

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
                  Состояние: <strong>{raised ? 'поднято' : 'внизу'}</strong>
                  {animating ? ' · движение…' : ''}
                </span>
              </div>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.layerTitle}>3 · Данные (типовой расчёт)</h2>
              <ul className={styles.dataList}>
                <li>Радиус рычага R ≈ {PARAMS.leverR} м (диапазон 1.2–1.8)</li>
                <li>Радиус намотки r₂ = {PARAMS.wrapR} м</li>
                <li>Высота подъёма h = {PARAMS.liftHeight} м</li>
                <li>Касательная скорость руки ≈ {PARAMS.handSpeedKmh} км/ч</li>
                <li>
                  ω ≈ {physics.omega.toFixed(3)} рад/с → v_груза ≈{' '}
                  {physics.liftSpeed.toFixed(3)} м/с
                </li>
                <li>Время подъёма ≈ {physics.timeLift.toFixed(1)} с (при этих числах)</li>
                <li>{physics.workHint}</li>
              </ul>
              <p className={styles.hint}>
                Сид-источник: <code>{SEED_PATH}</code>. Полная симуляция формул — позже;
                кнопка уже меняет состояние «внизу / поднято».
              </p>
            </section>
          </div>

          <section className={styles.panel}>
            <h2 className={styles.layerTitle}>4 · Трансляции как центры понимания</h2>
            <div className={styles.placeholder}>
              <p>
                <strong>Пока только возможность.</strong> Здесь позже появятся важные A→B из
                Reflection / сида — как свободный слой поверх статики и динамики (не привязаны
                жёстко к папкам).
              </p>
              <p className={styles.hint}>
                Сейчас: отметьте для себя, что после симуляции ярче «отпечатываются» кандидаты
                (груз→скорость, я→работа, мощность входа↔выхода). Связать с полем трансляций —
                следующим шагом.
              </p>
              {onNavigate ? (
                <button
                  type="button"
                  className={styles.buttonGhost}
                  onClick={() => onNavigate('reflection')}
                >
                  Открыть Reflection (поле трансляций)
                </button>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
