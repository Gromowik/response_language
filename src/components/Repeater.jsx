import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Repeater.module.css'
import {
  loadTracks,
  saveTracks,
  stepLabel,
  getDemoTracks,
} from '../utils/repeaterStorage'

export default function Repeater() {
  const [tracks, setTracks] = useState(() => loadTracks())
  const [trackId, setTrackId] = useState(() => loadTracks()[0]?.id || '')
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [linger, setLinger] = useState(false)
  const [tensionNote, setTensionNote] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    saveTracks(tracks)
  }, [tracks])

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
    if (!playing || linger || !step || !steps.length) return

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
  }, [playing, linger, index, step, steps.length])

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
          Игра сценария трансляций: шаги сменяют фокус с вашей скоростью. Холостой ход можно
          остановить на том, что резонирует; при напряжении — пауза и уточнение. Пока лично,
          до обмена с другими.
        </p>
      </header>

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
        <button type="button" className={styles.buttonGhost} onClick={goPrev} disabled={!steps.length || index === 0}>
          ← Назад
        </button>
        <button type="button" className={styles.button} onClick={togglePlay} disabled={!steps.length}>
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
        <button type="button" className={styles.buttonGhost} onClick={handleLinger} disabled={!step}>
          Задержаться
        </button>
        <button type="button" className={styles.buttonAccent} onClick={handleTension} disabled={!step}>
          Напряжение / уточнить
        </button>
      </div>

      {tensionNote ? (
        <div className={styles.tensionBox}>
          <p>{tensionNote}</p>
          <button type="button" className={styles.buttonGhost} onClick={() => setTensionNote('')}>
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
                <button type="button" className={styles.queueBtn} onClick={() => setIndex(i)}>
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

      <p className={styles.footerHint}>
        Смысл слоя — в <code>public/work/way_2.md</code>. История-источник — Seeds → катание.
        Модели — Cloud Models. Карточки — Reflection.
      </p>
    </div>
  )
}
