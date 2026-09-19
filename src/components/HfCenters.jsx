import { useEffect, useMemo, useState } from 'react'
import styles from './HfCenters.module.css'
import {
  bumpFrequency,
  effectiveFrequency,
  loadHfLocal,
  setPersonalNote,
} from '../utils/hfCentersStorage'

const CATALOG_URL = '/work/hf_centers.json'
const TALK_URL = '/work/what_could_be_new.md'

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: true, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

export default function HfCenters({ onNavigate }) {
  const [tab, setTab] = useState('catalog') // catalog | explain | talk
  const [centers, setCenters] = useState([])
  const [error, setError] = useState(null)
  const [local, setLocal] = useState(() => loadHfLocal())
  const [talkHtml, setTalkHtml] = useState('')
  const [talkError, setTalkError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(CATALOG_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Не удалось загрузить ${CATALOG_URL}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setCenters(Array.isArray(data) ? data : [])
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Ошибка загрузки')
          setCenters([])
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

  const sorted = useMemo(() => {
    return [...centers].sort((a, b) => {
      const fa = effectiveFrequency(a, local.frequencies[a.id])
      const fb = effectiveFrequency(b, local.frequencies[b.id])
      return fb - fa
    })
  }, [centers, local])

  const onTranslateRef = (id) => {
    setLocal(bumpFrequency(id))
  }

  const onOpenExternal = (center) => {
    if (!center.url) return
    setLocal(bumpFrequency(center.id))
    window.open(center.url, '_blank', 'noopener,noreferrer')
  }

  const onNoteChange = (id, value) => {
    setLocal(setPersonalNote(id, value))
  }

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>HF Centers · пробная страница</p>
        <h1 className={styles.title}>Центры высокой частоты (HF)</h1>
        <p className={styles.lead}>
          Каталог выпрямляющих центров, которые транслируют многие. Пока примеры — рабочее
          начало: ссылка и «трансляция» поднимают частоту; рядом — личное касание, чтобы U(BIG)
          не отрывался от малого.
        </p>
        <nav className={styles.topLinks}>
          {onNavigate ? (
            <>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('ringDemo')}
              >
                ← Ring Demo
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('visualModel')}
              >
                → Visual Model
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('reflection')}
              >
                → Reflection
              </button>
            </>
          ) : null}
        </nav>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'catalog' ? styles.tabActive : ''}`}
          onClick={() => setTab('catalog')}
        >
          Каталог
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'explain' ? styles.tabActive : ''}`}
          onClick={() => setTab('explain')}
        >
          Пояснения
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'talk' ? styles.tabActive : ''}`}
          onClick={() => setTab('talk')}
        >
          Беседа (what_could_be_new)
        </button>
      </div>

      {tab === 'explain' ? (
        <section className={styles.docPanel}>
          <h2 className={styles.helpH}>Генерализация и выпрямление</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Генерализация</th>
                  <th>Выпрямление</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Зачем</td>
                  <td>понять, найти, «мне видно»</td>
                  <td>
                    найти <strong>общие</strong> связи, чтобы <em>могли</em> транслировать{' '}
                    <strong>вместе</strong>
                  </td>
                </tr>
                <tr>
                  <td>Акцент</td>
                  <td>подготовка видимости (часто в одиночку)</td>
                  <td>резонанс множественного → высота, не только понимание</td>
                </tr>
                <tr>
                  <td>К U</td>
                  <td>личный отпечаток</td>
                  <td>
                    путь к <strong>U(BIG)</strong> — индивидуальное под действием большого, через
                    слой личного
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.helpP}>
            «Могли» — не принуждение к одному смыслу, а совместимость трансляции. Плюс/минус у
            всех — пример выпрямляющего центра: простой, общий, и через него ярче видно своё.
          </p>

          <h2 className={styles.helpH}>Резонанс множественного</h2>
          <blockquote className={styles.quote}>
            Чем больше видно внешнее, тем в нём ярче своё собственное. Отражение себя не только
            из близости «ты–я», а из множества, в котором находишь своё — не потому что достигли
            индивидуального сходства выражений, а именно из-за множественности.
          </blockquote>
          <p className={styles.helpP}>
            Важно окутать выпрямление <strong>слоем личного</strong>: тогда оно проникает вглубь
            и рождает индивидуальное под действием U(BIG). Без личного касания частота легко
            становится просто рейтингом.
          </p>

          <h2 className={styles.helpH}>Что такое HF здесь</h2>
          <p className={styles.helpP}>
            <strong>HF</strong> — плоскости / центры высокой частоты применения: то, что
            транслируют многие. В этом их сила. Даже если сначала кажутся искусственными —
            право существовать даёт сама возможность соединять ими. В доноре Data рядом с M+;
            в RL пока — отдельный каталог примеров.
          </p>
          <ul className={styles.helpList}>
            <li>
              Открыть живой пример или нажать «Сослаться / транслировать» →{' '}
              <strong>frequency +1</strong> (localStorage).
            </li>
            <li>Поле «личное касание» — ваш слой на центр (сохраняется локально).</li>
            <li>
              Позже: объекты и Ring Demo смогут ссылаться на id центра и тем же поднимать частоту.
            </li>
          </ul>

          <h2 className={styles.helpH}>Откуда текст</h2>
          <p className={styles.helpP}>
            Сжато из беседы в <code>{TALK_URL}</code> (блок про выпрямления и HF). Полный ход —
            вкладка «Беседа».
          </p>
        </section>
      ) : null}

      {tab === 'talk' ? (
        <section className={styles.docPanel}>
          <p className={styles.hint}>
            Живая беседа. Файл: <code>{TALK_URL}</code>
          </p>
          {talkError ? <p className={styles.error}>{talkError}</p> : null}
          <article
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: talkHtml }}
          />
        </section>
      ) : null}

      {tab === 'catalog' ? (
        <>
          <p className={styles.hint}>
            Данные: <code>{CATALOG_URL}</code>. Сортировка по частоте (база + локальные
            касания).
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.grid}>
            {sorted.map((c) => {
              const freq = effectiveFrequency(c, local.frequencies[c.id])
              const touches = local.touches?.[c.id] || 0
              const note = local.notes?.[c.id] ?? ''
              return (
                <article key={c.id} className={styles.card}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardName}>{c.name}</h2>
                    <span className={styles.freq}>frequency {freq}</span>
                  </div>
                  <p className={styles.summary}>{c.summary}</p>
                  {c.tags?.length ? (
                    <div className={styles.tags}>
                      {c.tags.map((t) => (
                        <span key={t} className={styles.tag}>
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className={styles.actions}>
                    {c.url ? (
                      <button
                        type="button"
                        className={styles.buttonLink}
                        onClick={() => onOpenExternal(c)}
                      >
                        Открыть пример →
                      </button>
                    ) : (
                      <span className={styles.hint}>URL пока нет</span>
                    )}
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => onTranslateRef(c.id)}
                    >
                      Сослаться / транслировать (+1)
                    </button>
                  </div>
                  <label className={styles.noteLabel} htmlFor={`note-${c.id}`}>
                    Личное касание
                    {c.personalHint ? ` — ${c.personalHint}` : ''}
                  </label>
                  <textarea
                    id={`note-${c.id}`}
                    className={styles.note}
                    value={note}
                    placeholder="Как этот центр касается меня / моего объекта…"
                    onChange={(e) => onNoteChange(c.id, e.target.value)}
                  />
                  <div className={styles.meta}>
                    id: {c.id}
                    {touches ? ` · локальных касаний: ${touches}` : ''}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
