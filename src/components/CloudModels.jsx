import { useEffect, useState } from 'react'
import styles from './CloudModels.module.css'

export default function CloudModels() {
  const [models, setModels] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const selected = models.find((m) => m.id === selectedId) || null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Cloud models · модели облака</p>
        <h1 className={styles.title}>Модели облака</h1>
        <p className={styles.lead}>
          Готовые схемы «как устроено движение внимания в механике» — кирпичи, которые можно
          брать и на их основе строить свои трансляции и карточки (на <strong>Reflection</strong>).
          Сиды рядом — почва разговора; модели — сжатый каркас.
          Новые мысли можно дописывать в <code>public/work/Part_2.md</code> и в{' '}
          <code>cloud_models.json</code>.
        </p>
      </header>

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
                    Полный текст — во вкладке <strong>Seeds</strong>. Карточки — в{' '}
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
    </div>
  )
}
