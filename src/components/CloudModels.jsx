import { useEffect, useState } from 'react'
import styles from './CloudModels.module.css'

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: true, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

const PATHS = [
  {
    id: 'way',
    label: 'Путь (way.md)',
    path: '/work/way.md',
    hint:
      'Первая беседа-путь: работа/мощность, рычаг, зацепление, истории. Файл: /work/way.md',
  },
  {
    id: 'way3',
    label: 'Облако 2 (way_3.md)',
    path: '/work/way_3.md',
    hint:
      'Целиком ваш подход: столкновение/пролёт, каналы, колесо, шуруп, О↔Ц. Файл: /work/way_3.md',
  },
  {
    id: 'way3gemini',
    label: 'Проекции Gemini (way_3_gemini.md)',
    path: '/work/way_3_gemini.md',
    hint:
      'Слой комментариев и уточнений от ИИ (формулы, термины, проекции). Больше обзора, если нужно углубить шаги облака 2. Файл: /work/way_3_gemini.md',
  },
]

export default function CloudModels() {
  const [models, setModels] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('models') // models | way | way3
  const [docHtml, setDocHtml] = useState('')
  const [docError, setDocError] = useState(null)
  const [docLoading, setDocLoading] = useState(false)

  const activePath = PATHS.find((p) => p.id === tab) || null

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/work/cloud_models.json', { cache: 'no-cache' })
        if (!res.ok) throw new Error(`cloud_models.json (${res.status})`)
        const data = await res.json()
        if (!cancelled) {
          setModels(Array.isArray(data) ? data : [])
          setSelectedId(Array.isArray(data) && data[0] ? data[0].id : null)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Не удалось загрузить модели')
          setModels([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activePath) return
    let cancelled = false
    const loadDoc = async () => {
      setDocLoading(true)
      setDocHtml('<p>Загрузка…</p>')
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

        const [response] = await Promise.all([
          fetch(activePath.path, { cache: 'no-cache' }),
          waitForMarked(),
        ])
        if (!response.ok) {
          throw new Error(`Не удалось загрузить ${activePath.path} (${response.status})`)
        }
        const source = await response.text()
        if (!cancelled) {
          setDocHtml(renderMarkdown(source))
          setDocError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setDocError(err.message || 'Ошибка загрузки')
          setDocHtml('')
        }
      } finally {
        if (!cancelled) setDocLoading(false)
      }
    }
    loadDoc()
    return () => {
      cancelled = true
    }
  }, [activePath])

  const selected = models.find((m) => m.id === selectedId) || null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Cloud models · модели облака</p>
        <h1 className={styles.title}>Модели облака</h1>
        <p className={styles.lead}>
          Сжатый каркас уже разобранных схем — и целые тексты-пути рядом:{' '}
          <strong>way.md</strong>, <strong>way_3.md</strong>, слой проекций{' '}
          <strong>way_3_gemini.md</strong>. Новый слой лучше сначала прочитать целиком,
          при необходимости — обзор чужих проекций/формул, потом уточнять в отдельные
          модели — у каждого по-своему.
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'models' ? styles.tabActive : ''}`}
          onClick={() => setTab('models')}
        >
          Модели
        </button>
        {PATHS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${styles.tab} ${tab === p.id ? styles.tabActive : ''}`}
            onClick={() => setTab(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePath ? (
        <section className={styles.wayPanel}>
          <p className={styles.hint}>
            {activePath.hint}
            {docLoading ? ' · загрузка…' : ''}
          </p>
          {docError ? <p className={styles.error}>{docError}</p> : null}
          <article
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: docHtml }}
          />
        </section>
      ) : (
        <>
          {loading ? <p className={styles.hint}>Загрузка…</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <h2 className={styles.sideTitle}>Список</h2>
              <p className={styles.hint} style={{ marginTop: 0 }}>
                Пока разобраны модели первого облака (рычаг / зацепление). Облако из way_3 —
                следующим шагом.
              </p>
              <ul className={styles.list}>
                {models.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`${styles.cardBtn} ${
                        m.id === selectedId ? styles.cardBtnActive : ''
                      }`}
                      onClick={() => setSelectedId(m.id)}
                    >
                      <span className={styles.cardTitle}>{m.title}</span>
                      <span className={styles.cardShort}>{m.short}</span>
                      <span className={styles.badge}>{m.kind}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className={styles.detail}>
              {selected ? (
                <>
                  <h2 className={styles.detailTitle}>{selected.title}</h2>
                  <p className={styles.badgeLarge}>{selected.kind}</p>
                  <p className={styles.summary}>{selected.summary}</p>

                  <div className={styles.cols}>
                    <div>
                      <h3 className={styles.sub}>Что меняется</h3>
                      <ul>
                        {selected.changes.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className={styles.sub}>Что скорее инвариант</h3>
                      <ul>
                        {selected.invariants.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <h3 className={styles.sub}>Стартовые трансляции →</h3>
                  <ul className={styles.trList}>
                    {selected.starterTranslations.map((t) => (
                      <li key={t}>
                        <code>{t}</code>
                      </li>
                    ))}
                  </ul>

                  {selected.exercise ? (
                    <>
                      <h3 className={styles.sub}>Упражнение</h3>
                      <p className={styles.exercise}>{selected.exercise}</p>
                    </>
                  ) : null}

                  {selected.seedPaths?.length ? (
                    <>
                      <h3 className={styles.sub}>Почва (сиды)</h3>
                      <ul className={styles.seeds}>
                        {selected.seedPaths.map((p) => (
                          <li key={p}>
                            <code>{p}</code>
                          </li>
                        ))}
                      </ul>
                      <p className={styles.hint}>
                        Полные пути — вкладки <strong>Путь</strong> и{' '}
                        <strong>Облако 2</strong>. Сиды и истории — <strong>Seeds</strong>.
                        Карточки — <strong>Reflection</strong>.
                      </p>
                    </>
                  ) : null}
                </>
              ) : (
                <p className={styles.hint}>Выберите модель слева.</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
