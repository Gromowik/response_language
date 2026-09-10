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

const WAY_PATH = '/work/way.md'

export default function CloudModels() {
  const [models, setModels] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('models') // models | way
  const [wayHtml, setWayHtml] = useState('')
  const [wayError, setWayError] = useState(null)
  const [wayLoading, setWayLoading] = useState(false)

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
    if (tab !== 'way') return
    let cancelled = false
    const loadWay = async () => {
      setWayLoading(true)
      setWayHtml('<p>Загрузка…</p>')
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
          fetch(WAY_PATH, { cache: 'no-cache' }),
          waitForMarked(),
        ])
        if (!response.ok) {
          throw new Error(`Не удалось загрузить ${WAY_PATH} (${response.status})`)
        }
        const source = await response.text()
        if (!cancelled) {
          setWayHtml(renderMarkdown(source))
          setWayError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setWayError(err.message || 'Ошибка загрузки пути')
          setWayHtml('')
        }
      } finally {
        if (!cancelled) setWayLoading(false)
      }
    }
    loadWay()
    return () => {
      cancelled = true
    }
  }, [tab])

  const selected = models.find((m) => m.id === selectedId) || null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Cloud models · модели облака</p>
        <h1 className={styles.title}>Модели облака</h1>
        <p className={styles.lead}>
          Сжатый каркас схем — и рядом весь <strong>путь беседы</strong> (
          <code>way.md</code>), чтобы видеть связанность теории на практике: как из
          размышления вырастают модели, сиды и истории.
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
        <button
          type="button"
          className={`${styles.tab} ${tab === 'way' ? styles.tabActive : ''}`}
          onClick={() => setTab('way')}
        >
          Путь (way.md)
        </button>
      </div>

      {tab === 'way' ? (
        <section className={styles.wayPanel}>
          <p className={styles.hint}>
            Полная беседа-путь: от работы/мощности и первых трансляций через две модели
            рычага к третьей и к идее историй. Файл: <code>{WAY_PATH}</code>
            {wayLoading ? ' · загрузка…' : ''}
          </p>
          {wayError ? <p className={styles.error}>{wayError}</p> : null}
          <article
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: wayHtml }}
          />
        </section>
      ) : (
        <>
          {loading ? <p className={styles.hint}>Загрузка…</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <h2 className={styles.sideTitle}>Список</h2>
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
                        Полный путь беседы — вкладка <strong>Путь (way.md)</strong> на этой
                        странице. Сиды и истории — <strong>Seeds</strong>. Карточки —{' '}
                        <strong>Reflection</strong>.
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
