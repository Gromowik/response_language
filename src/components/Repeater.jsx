import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Repeater.module.css'
import {
  loadTracks,
  saveTracks,
  stepLabel,
  getDemoTracks,
} from '../utils/repeaterStorage'

const WAY2_PATH = '/work/way_2.md'
const SILK_URL = 'https://zentrale-silk.vercel.app/'

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: true, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

export default function Repeater() {
  const [tracks, setTracks] = useState(() => loadTracks())
  const [trackId, setTrackId] = useState(() => loadTracks()[0]?.id || '')
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [linger, setLinger] = useState(false)
  const [tensionNote, setTensionNote] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [tab, setTab] = useState('play')
  const [wayHtml, setWayHtml] = useState('')
  const [wayError, setWayError] = useState(null)
  const [wayLoading, setWayLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    saveTracks(tracks)
  }, [tracks])

  useEffect(() => {
    if (tab !== 'thoughts') return
    setPlaying(false)
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
          fetch(WAY2_PATH, { cache: 'no-cache' }),
          waitForMarked(),
        ])
        if (!response.ok) throw new Error(`Не удалось загрузить ${WAY2_PATH} (${response.status})`)
        const source = await response.text()
        if (!cancelled) {
          setWayHtml(renderMarkdown(source))
          setWayError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setWayError(err.message || 'Ошибка загрузки')
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

  const track = useMemo(
    () => tracks.find((t) => t.id === trackId) || tracks[0] || null,
    [tracks, trackId]
  )

  const steps = track?.steps || []
  const step = steps[index] || null
  const progress = steps.length ? ((index + 1) / steps.length) * 100 : 0

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!playing || linger || !step || !steps.length || tab !== 'play') return

    const ms = Math.max(1.5, Number(step.durationSec) || 5) * 1000
    timerRef.current = window.setTimeout(() => {
      setIndex((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, ms)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [playing, linger, index, step, steps.length, tab])

  const selectTrack = (id) => {
    setTrackId(id)
    setIndex(0)
    setPlaying(false)
    setLinger(false)
    setTensionNote('')
  }

  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1))
    setPlaying(false)
  }

  const goNext = () => {
    setIndex((i) => Math.min(steps.length - 1, i + 1))
  }

  const togglePlay = () => {
    if (!steps.length) return
    if (index >= steps.length - 1 && !playing) {
      setIndex(0)
      setPlaying(true)
      setLinger(false)
      return
    }
    setPlaying((p) => !p)
    if (!playing) setLinger(false)
  }

  const handleLinger = () => {
    setLinger(true)
    setPlaying(false)
  }

  const handleTension = () => {
    setPlaying(false)
    setLinger(true)
    const label = step ? stepLabel(step) : 'шаг'
    setTensionNote(
      `Напряжение на «${label}». Можно уточнить свободным порядком: Reflection, Cloud Models или история в Seeds — затем вернуться в повторитель.`
    )
  }

  const resetDemo = () => {
    if (!window.confirm('Подставить демо-трек «катание» заново?')) return
    const demos = getDemoTracks()
    setTracks((prev) => {
      const without = prev.filter((t) => t.id !== 'demo-cycling')
      return [...demos, ...without]
    })
    setTrackId('demo-cycling')
    setIndex(0)
    setPlaying(false)
    setLinger(false)
    setTensionNote('')
  }

  const updateStepDuration = (stepId, durationSec) => {
    if (!track) return
    const next = {
      ...track,
      steps: track.steps.map((s) =>
        s.id === stepId ? { ...s, durationSec: Number(durationSec) || 5 } : s
      ),
    }
    setTracks((prev) => prev.map((t) => (t.id === track.id ? next : t)))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Repeater · повторитель</p>
        <h1 className={styles.title}>Повторитель</h1>
        <p className={styles.lead}>
          Игра сценария трансляций: шаги сменяют фокус с вашей скоростью. Рядом — мысли о
          слое (<code>way_2.md</code>). Дополнительные возможности повторения можно развивать
          отдельно в программе «Оболочка мысли».
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'play' ? styles.tabActive : ''}`}
          onClick={() => setTab('play')}
        >
          Сценарий
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'thoughts' ? styles.tabActive : ''}`}
          onClick={() => setTab('thoughts')}
        >
          Мысли (way_2.md)
        </button>
      </div>

      <aside className={styles.related}>
        <p className={styles.relatedTitle}>Связанная программа</p>
        <p className={styles.relatedText}>
          Доска повторения с карточками (изображение + мысль + очередь) собирается отдельно —
          туда удобно выносить дополнительные возможности, пока Repeater здесь остаётся
          сценарием трансляций RL.
        </p>
        <a
          className={styles.relatedLink}
          href={SILK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          zentrale-silk.vercel.app — Оболочка мысли
        </a>
      </aside>

      {tab === 'thoughts' ? (
        <section className={styles.thoughtsPanel}>
          <p className={styles.hint}>
            Зачем повторитель: константы → непонятное → красота / U → расщепление → игра
            фокуса. Файл: <code>{WAY2_PATH}</code>
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
          <div className={styles.toolbar}>
            <label className={styles.trackSelect}>
              Трек
              <select
                value={track?.id || ''}
                onChange={(e) => selectTrack(e.target.value)}
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={styles.buttonGhost} onClick={resetDemo}>
              Демо «катание»
            </button>
            <button
              type="button"
              className={`${styles.buttonGhost} ${showEditor ? styles.toggleOn : ''}`}
              onClick={() => setShowEditor((v) => !v)}
            >
              {showEditor ? 'Скрыть длительности' : 'Длительности шагов'}
            </button>
          </div>

          {track ? (
            <p className={styles.meta}>
              {track.sourceLabel ? `${track.sourceLabel} · ` : ''}
              {steps.length} шагов
              {track.description ? ` · ${track.description}` : ''}
            </p>
          ) : null}

          <div className={styles.stage}>
            {!step ? (
              <p className={styles.empty}>В треке пока нет шагов.</p>
            ) : (
              <>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <p className={styles.stepCount}>
                  Шаг {index + 1} / {steps.length}
                  {linger ? ' · пауза / задержка' : playing ? ' · играет' : ' · стоп'}
                  {' · '}
                  {step.durationSec}с
                </p>

                <p className={styles.arrow}>
                  <span className={styles.from}>{step.from || '—'}</span>
                  <span className={styles.arrowSign}>→</span>
                  <span className={styles.to}>{step.to || '—'}</span>
                </p>

                {step.note ? <p className={styles.note}>{step.note}</p> : null}

                {step.imageUrl ? (
                  <div className={styles.imageWrap}>
                    <img src={step.imageUrl} alt="" />
                  </div>
                ) : (
                  <p className={styles.imageHint}>Изображение позже можно привязать к шагу.</p>
                )}
              </>
            )}
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={goPrev}
              disabled={!steps.length || index === 0}
            >
              ← Назад
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={togglePlay}
              disabled={!steps.length}
            >
              {playing ? 'Пауза' : index >= steps.length - 1 ? 'Сначала' : 'Играть'}
            </button>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={goNext}
              disabled={!steps.length || index >= steps.length - 1}
            >
              Далее →
            </button>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={handleLinger}
              disabled={!step}
            >
              Задержаться
            </button>
            <button
              type="button"
              className={styles.buttonAccent}
              onClick={handleTension}
              disabled={!step}
            >
              Напряжение / уточнить
            </button>
          </div>

          {tensionNote ? (
            <div className={styles.tensionBox}>
              <p>{tensionNote}</p>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={() => setTensionNote('')}
              >
                Скрыть
              </button>
            </div>
          ) : null}

          {showEditor && track ? (
            <section className={styles.editor}>
              <h2 className={styles.editorTitle}>Очередь и время проявления</h2>
              <p className={styles.hint}>
                Порядок как в истории. Длительность — секунды на шаге при автопроигрывании.
              </p>
              <ol className={styles.queue}>
                {track.steps.map((s, i) => (
                  <li key={s.id} className={i === index ? styles.queueActive : ''}>
                    <button
                      type="button"
                      className={styles.queueBtn}
                      onClick={() => setIndex(i)}
                    >
                      <strong>{stepLabel(s)}</strong>
                      {s.note ? <span>{s.note}</span> : null}
                    </button>
                    <label className={styles.dur}>
                      сек
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={s.durationSec}
                        onChange={(e) => updateStepDuration(s.id, e.target.value)}
                      />
                    </label>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      )}

      <p className={styles.footerHint}>
        История-источник — Seeds → катание. Модели — Cloud Models. Карточки — Reflection.
        Согласование с «Оболочкой мысли» — по мере роста обеих сторон.
      </p>
    </div>
  )
}
