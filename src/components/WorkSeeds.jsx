import { useEffect, useState } from 'react'
import styles from './WorkSeeds.module.css'

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: true, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

export default function WorkSeeds() {
  const [catalog, setCatalog] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [html, setHtml] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadCatalog = async () => {
      try {
        const res = await fetch('/work/catalog.json', { cache: 'no-cache' })
        if (!res.ok) throw new Error(`catalog.json (${res.status})`)
        const data = await res.json()
        if (!cancelled) {
          setCatalog(Array.isArray(data) ? data : [])
          setSelectedId(Array.isArray(data) && data[0] ? data[0].id : null)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Не удалось загрузить каталог сидов')
          setCatalog([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedId || !catalog.length) return
    const item = catalog.find((c) => c.id === selectedId)
    if (!item) return

    let cancelled = false
    const loadSeed = async () => {
      setHtml('<p>Загрузка…</p>')
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
          fetch(item.path, { cache: 'no-cache' }),
          waitForMarked(),
        ])
        if (!response.ok) {
          throw new Error(`Не удалось загрузить ${item.path} (${response.status})`)
        }
        const source = await response.text()
        if (!cancelled) {
          setHtml(renderMarkdown(source))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Ошибка загрузки сида')
          setHtml('')
        }
      }
    }
    loadSeed()
    return () => {
      cancelled = true
    }
  }, [selectedId, catalog])

  const selected = catalog.find((c) => c.id === selectedId) || null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Work seeds · почва для упражнений</p>
        <h1 className={styles.title}>Сборник сидов</h1>
        <p className={styles.lead}>
          Важный формат обучения мышлению на языке трансляций: обмениваться с ИИ, готовить
          почву, к которой можно вернуться всегда — и при желании или необходимости собрать
          на её основе своё, более детальное поле карточек (на странице{' '}
          <strong>Reflection</strong>), на свой вкус. Это не поле обмена людей, а запас смыслов
          и упражнений.
        </p>
      </header>

      {loading ? <p className={styles.hint}>Загрузка каталога…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sideTitle}>Сиды</h2>
          {catalog.length === 0 && !loading ? (
            <p className={styles.hint}>Каталог пуст. Добавьте записи в public/work/catalog.json.</p>
          ) : (
            <ul className={styles.list}>
              {catalog.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.seedBtn} ${
                      item.id === selectedId ? styles.seedBtnActive : ''
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className={styles.seedTitle}>{item.title}</span>
                    {item.subtitle ? (
                      <span className={styles.seedSub}>{item.subtitle}</span>
                    ) : null}
                    {item.tags?.length ? (
                      <span className={styles.tags}>
                        {item.tags.map((t) => (
                          <span key={t} className={styles.tag}>
                            {t}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={styles.reader}>
          {selected ? (
            <>
              <div className={styles.readerHead}>
                <div>
                  <h2 className={styles.readerTitle}>{selected.title}</h2>
                  {selected.hint ? <p className={styles.hint}>{selected.hint}</p> : null}
                  <p className={styles.path}>
                    Файл: <code>{selected.path}</code>
                  </p>
                </div>
              </div>
              <article
                className={styles.markdown}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </>
          ) : (
            <p className={styles.hint}>Выберите сид слева.</p>
          )}
        </section>
      </div>
    </div>
  )
}
